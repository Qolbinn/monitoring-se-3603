import { createClient } from "@/lib/supabase/server";
import { format, parseISO, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";

export interface TrendDataPoint {
  date: string;
  time: string;
  lastUpdatedAtRaw: string;
  target: number;
  realisasi: number;
  targetDiff: number;
  realisasiDiff: number;
  actualPercentage: number;
  idealPercentage: number;
}

export class DashboardService {
  /**
   * Mengambil daftar kecamatan untuk keperluan dropdown filter.
   */
  static async getKecamatanOptions() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("master_kecamatan")
      .select("kode_kecamatan, nama_kecamatan")
      .order("nama_kecamatan", { ascending: true });

    if (error) {
      console.error("Error fetching kecamatan options:", error);
      return [];
    }
    return data;
  }

  /**
   * Mengambil daftar desa berdasarkan kode_kecamatan
   */
  static async getDesaOptions(kodeKecamatan: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("master_desa")
      .select("kode_desa, nama_desa")
      .eq("kode_kecamatan", kodeKecamatan)
      .order("nama_desa", { ascending: true });

    if (error) {
      console.error("Error fetching desa options:", error);
      return [];
    }
    return data;
  }

  /**
   * Mengambil data agregasi untuk Trend Chart
   */
  static async getTrendData(params: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    kodeKecamatan?: string;
    kodeDesa?: string;
  }): Promise<TrendDataPoint[]> {
    const supabase = await createClient();
    
    let query = supabase
      .from("progress_harian")
      .select(`
        tanggal_data,
        target_total,
        realisasi,
        last_updated_at,
        master_desa!inner (
          kode_kecamatan
        )
      `)
      .gte("tanggal_data", params.startDate)
      .lte("tanggal_data", params.endDate);

    if (params.kodeDesa && params.kodeDesa !== "all") {
      query = query.eq("kode_desa", params.kodeDesa);
    } else if (params.kodeKecamatan && params.kodeKecamatan !== "all") {
      query = query.eq("master_desa.kode_kecamatan", params.kodeKecamatan);
    }

    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await query.range(from, from + step - 1);

      if (error) {
        console.error("Error fetching trend data:", error);
        break;
      }

      if (data) {
        allData = allData.concat(data);
        if (data.length < step) {
          keepFetching = false;
        } else {
          from += step;
        }
      } else {
        keepFetching = false;
      }
    }

    // Karena tidak didukung GROUP BY langsung di Supabase JS tanpa RPC,
    // kita agregasi secara manual di memori
    const aggregatedData: Record<
      string,
      {
        target_total: number;
        realisasi: number;
        last_updated_at: string;
      }
    > = {};

    allData.forEach((row: any) => {
      const date = row.tanggal_data;
      if (!aggregatedData[date]) {
        aggregatedData[date] = {
          target_total: 0,
          realisasi: 0,
          last_updated_at: row.last_updated_at,
        };
      }
      aggregatedData[date].target_total += row.target_total || 0;
      aggregatedData[date].realisasi += row.realisasi || 0;
      
      // Ambil waktu update terakhir
      if (new Date(row.last_updated_at) > new Date(aggregatedData[date].last_updated_at)) {
        aggregatedData[date].last_updated_at = row.last_updated_at;
      }
    });

    // Urutkan tanggal secara kronologis
    const sortedDates = Object.keys(aggregatedData).sort();

    // Kalkulasi perbedaan dari hari sebelumnya
    const trendResult: TrendDataPoint[] = [];
    let prevTarget = 0;
    let prevRealisasi = 0;

    // Rentang Survei Resmi (15 Juni - 31 Agustus 2026) -> 75 Hari
    const surveyStartDate = parseISO("2026-06-15");
    const totalSurveyDays = 75;

    sortedDates.forEach((dateString) => {
      const current = aggregatedData[dateString];
      const currentDate = parseISO(dateString);
      
      const targetDiff = current.target_total - prevTarget;
      const realisasiDiff = current.realisasi - prevRealisasi;
      
      // Hitung Actual Percentage
      const actualPercentage = current.target_total > 0 
        ? (current.realisasi / current.target_total) * 100 
        : 0;

      // Hitung Ideal Percentage (Hanya dari 15 Juni sampai 31 Agustus)
      let idealPercentage = 0;
      const daysSinceStart = differenceInDays(currentDate, surveyStartDate) + 1;
      
      if (daysSinceStart >= 1 && daysSinceStart <= totalSurveyDays) {
        idealPercentage = (daysSinceStart / totalSurveyDays) * 100;
      } else if (daysSinceStart > totalSurveyDays) {
        idealPercentage = 100;
      }

      trendResult.push({
        date: format(currentDate, "d MMM", { locale: id }),
        time: `${format(currentDate, "d MMM yyyy", { locale: id })}, ${format(new Date(current.last_updated_at), "HH.mm 'WIB'")}`,
        lastUpdatedAtRaw: current.last_updated_at,
        target: current.target_total,
        realisasi: current.realisasi,
        targetDiff,
        realisasiDiff,
        actualPercentage: Number(actualPercentage.toFixed(2)),
        idealPercentage: Number(idealPercentage.toFixed(2)),
      });

      prevTarget = current.target_total;
      prevRealisasi = current.realisasi;
    });

    return trendResult;
  }

  /**
   * Mengambil data agregasi untuk Column Chart (Capaian per Wilayah pada 1 hari spesifik)
   */
  static async getColumnData(params: {
    date: string; // YYYY-MM-DD
    kodeKecamatan: string;
  }) {
    const supabase = await createClient();
    
    // Kalkulasi Ideal Percentage
    const surveyStartDate = parseISO("2026-06-15");
    const targetDate = parseISO(params.date);
    const totalSurveyDays = 75;
    
    let idealPercentage = 0;
    const daysSinceStart = differenceInDays(targetDate, surveyStartDate) + 1;
    
    if (daysSinceStart >= 1 && daysSinceStart <= totalSurveyDays) {
      idealPercentage = (daysSinceStart / totalSurveyDays) * 100;
    } else if (daysSinceStart > totalSurveyDays) {
      idealPercentage = 100;
    }

    // Fetch data
    let query = supabase
      .from("progress_harian")
      .select(`
        target_total,
        realisasi,
        master_desa!inner (
          nama_desa,
          kode_kecamatan,
          master_kecamatan!inner (
            nama_kecamatan
          )
        )
      `)
      .eq("tanggal_data", params.date);

    if (params.kodeKecamatan && params.kodeKecamatan !== "all") {
      query = query.eq("master_desa.kode_kecamatan", params.kodeKecamatan);
    }

    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const { data, error } = await query.range(from, from + step - 1);
      if (error) {
        console.error("Error fetching column data:", error);
        break;
      }
      if (data) {
        allData = allData.concat(data);
        if (data.length < step) keepFetching = false;
        else from += step;
      } else {
        keepFetching = false;
      }
    }

    // Agregasi manual
    const aggregatedData: Record<string, { target: number; realisasi: number }> = {};

    allData.forEach((row: any) => {
      const isAllKecamatan = params.kodeKecamatan === "all";
      const areaKey = isAllKecamatan 
        ? row.master_desa.master_kecamatan.nama_kecamatan 
        : row.master_desa.nama_desa;

      if (!aggregatedData[areaKey]) {
        aggregatedData[areaKey] = { target: 0, realisasi: 0 };
      }
      aggregatedData[areaKey].target += row.target_total || 0;
      aggregatedData[areaKey].realisasi += row.realisasi || 0;
    });

    const resultData = Object.keys(aggregatedData).map(area => {
      const agg = aggregatedData[area];
      const actualPercentage = agg.target > 0 ? (agg.realisasi / agg.target) * 100 : 0;
      return {
        area,
        target: agg.target,
        realisasi: agg.realisasi,
        actualPercentage: Number(actualPercentage.toFixed(2))
      };
    });

    // Urutkan area secara alfabetis
    resultData.sort((a, b) => a.area.localeCompare(b.area));

    return {
      data: resultData,
      idealPercentage: Number(idealPercentage.toFixed(2))
    };
  }
}
