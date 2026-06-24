import { ColumnChartCard } from "@/components/dashboard/ColumnChartCard";
import { HorizontalBarChartCard } from "@/components/dashboard/HorizontalBarChartCard";
import { TrendChartCard } from "@/components/dashboard/TrendChartCard";
import { DashboardService } from "@/services/DashboardService";
import Link from "next/link";
import { Upload } from "lucide-react";

import { format, startOfWeek, endOfWeek, intervalToDuration } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
};

export default async function Home(props: Props) {
  // Resolving searchParams promise in Next.js 15/16
  const searchParams = await props.searchParams;
  
  const today = new Date();
  
  // Default values for Trend Chart (Minggu Ini)
  const defaultStartWeek = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const defaultEndWeek = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  const startDate = typeof searchParams.startDate === "string" ? searchParams.startDate : defaultStartWeek;
  const endDate = typeof searchParams.endDate === "string" ? searchParams.endDate : defaultEndWeek;
  const kodeKecamatan = typeof searchParams.kodeKecamatan === "string" ? searchParams.kodeKecamatan : "all";
  const kodeDesa = typeof searchParams.kodeDesa === "string" ? searchParams.kodeDesa : "all";
  
  // Default values for Column Chart (Hari Ini)
  const defaultToday = format(today, "yyyy-MM-dd");
  const columnDate = typeof searchParams.columnDate === "string" ? searchParams.columnDate : defaultToday;
  const columnKecamatan = typeof searchParams.columnKecamatan === "string" ? searchParams.columnKecamatan : "all";

  // Default values for Horizontal Bar Chart (Hari Ini)
  const barDate = typeof searchParams.barDate === "string" ? searchParams.barDate : defaultToday;
  const barKecamatan = typeof searchParams.barKecamatan === "string" ? searchParams.barKecamatan : "all";

  // Fetching data
  const trendData = await DashboardService.getTrendData({ startDate, endDate, kodeKecamatan, kodeDesa });
  const kecamatanOptions = await DashboardService.getKecamatanOptions();
  let trendDesaOptions: any[] = [];
  if (kodeKecamatan !== "all") {
    trendDesaOptions = await DashboardService.getDesaOptions(kodeKecamatan);
  }
  
  const columnDataResponse = await DashboardService.getColumnData({ date: columnDate, kodeKecamatan: columnKecamatan });
  const barDataResponse = await DashboardService.getColumnData({ date: barDate, kodeKecamatan: barKecamatan });

  // Fetching global data for KPI Cards (Unfiltered)
  const globalTrendData = await DashboardService.getTrendData({ 
    startDate: "2026-06-15", 
    endDate: defaultToday, 
    kodeKecamatan: "all", 
    kodeDesa: "all" 
  });
  const globalKPI = globalTrendData.length > 0 ? globalTrendData[globalTrendData.length - 1] : null;

  const now = new Date();
  const lastUpdatedDate = globalKPI ? new Date(globalKPI.lastUpdatedAtRaw) : null;
  
  let timeLag = "-";
  if (lastUpdatedDate) {
    const duration = intervalToDuration({ start: lastUpdatedDate, end: now });
    const parts = [];
    if (duration.days) parts.push(`${duration.days} hari`);
    if (duration.hours) parts.push(`${duration.hours} jam`);
    if (duration.minutes) parts.push(`${duration.minutes} menit`);
    
    if (parts.length > 0) {
      // Only take the top 2 units for neatness (e.g. days and hours, or hours and minutes)
      timeLag = `${parts.slice(0, 2).join(' ')} yang lalu`;
    } else {
      timeLag = "Baru saja";
    }
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Monitoring</h1>
            <p className="text-muted-foreground mt-1">Pantau progres pendataan Kabupaten Tangerang secara harian.</p>
          </div>
          <Link 
            href="/upload" 
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Data
          </Link>
        </div>

        {/* Dashboard Content */}
        <div className="flex flex-col gap-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Real Headline Cards based on fetched data */}
            <div className="rounded-[16px] border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Target Pendataan</h3>
                </div>
                <div className="text-2xl font-bold font-heading">
                  {globalKPI ? globalKPI.target.toLocaleString("id-ID") : 0}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className={globalKPI && globalKPI.targetDiff >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {globalKPI && globalKPI.targetDiff > 0 ? "+" : ""}
                  {globalKPI ? globalKPI.targetDiff.toLocaleString("id-ID") : 0}
                </span> dari hari sebelumnya
              </p>
            </div>

            <div className="rounded-[16px] border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Realisasi Masuk</h3>
                </div>
                <div className="text-2xl font-bold font-heading">
                  {globalKPI ? globalKPI.realisasi.toLocaleString("id-ID") : 0}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <span className={globalKPI && globalKPI.realisasiDiff >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {globalKPI && globalKPI.realisasiDiff > 0 ? "+" : ""}
                  {globalKPI ? globalKPI.realisasiDiff.toLocaleString("id-ID") : 0}
                </span> dari hari sebelumnya
              </p>
            </div>

            <div className="rounded-[16px] border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">% Capaian Saat Ini</h3>
                </div>
                <div className="text-2xl font-bold font-heading text-primary">
                  {globalKPI ? globalKPI.actualPercentage.toFixed(1) : 0}%
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Batas ideal hari ini: <span className="font-semibold text-orange-500">{globalKPI ? globalKPI.idealPercentage.toFixed(1) : 0}%</span>
              </p>
            </div>

            {/* Information Card (4th Card) */}
            <div className="rounded-[16px] border border-border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between bg-muted/20">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50 mb-3">
                <h3 className="tracking-tight text-sm font-medium">Status Sinkronisasi</h3>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Kondisi Data Terakhir</span>
                  <span className="text-base font-semibold font-heading">
                    {globalKPI ? formatInTimeZone(lastUpdatedDate!, "Asia/Jakarta", "dd MMM yyyy, HH:mm", { locale: id }) : "-"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lag Perbedaan Waktu</span>
                  <span className="text-base font-semibold font-heading text-orange-600">
                    {timeLag}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Rows for Charts */}
          <div className="flex flex-col gap-6">
            <TrendChartCard 
              chartData={trendData} 
              kecamatanOptions={kecamatanOptions}
              desaOptions={trendDesaOptions}
              currentParams={{ startDate, endDate, kodeKecamatan, kodeDesa }}
            />
            
            {/* Column Chart */}
            <ColumnChartCard 
              currentDate={columnDate}
              kodeKecamatan={columnKecamatan}
              kecamatanOptions={kecamatanOptions}
              chartData={columnDataResponse.data}
              idealPercentage={columnDataResponse.idealPercentage}
            />

            {/* Horizontal Bar Chart */}
            <HorizontalBarChartCard 
              currentDate={barDate}
              kodeKecamatan={barKecamatan}
              kecamatanOptions={kecamatanOptions}
              chartData={barDataResponse.data}
              idealPercentage={barDataResponse.idealPercentage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
