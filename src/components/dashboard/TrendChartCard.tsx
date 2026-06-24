"use client";

import * as React from "react";
import { Filter, Calendar as CalendarIcon, RotateCcw, Download, FileSpreadsheet, ImageIcon } from "lucide-react";
import { exportDataToExcel, downloadChartAsImage } from "@/lib/utils";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, TooltipProps } from "recharts";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export interface TrendDataPoint {
  date: string;
  time: string;
  target: number;
  realisasi: number;
  targetDiff: number;
  realisasiDiff: number;
  actualPercentage: number;
  idealPercentage: number;
}

const chartConfig = {
  actualPercentage: {
    label: "Realisasi (%)",
    color: "var(--color-primary)",
  },
  idealPercentage: {
    label: "Ideal Target (%)",
    color: "var(--color-secondary)",
  },
} satisfies ChartConfig;

// Custom Tooltip component to show additional required information
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-md shadow-lg p-3 text-sm">
        <p className="font-bold text-foreground mb-1">{data.time}</p>
        <div className="space-y-1">
          <p className="text-muted-foreground flex justify-between gap-4">
            <span>Target:</span>
            <span className="font-mono text-foreground font-medium">{data.target.toLocaleString("id-ID")}</span>
          </p>
          <p className="text-muted-foreground flex justify-between gap-4">
            <span>Realisasi:</span>
            <span className="font-mono text-foreground font-medium">{data.realisasi.toLocaleString("id-ID")}</span>
          </p>
          <hr className="my-1 border-border" />
          <p className="text-muted-foreground flex justify-between gap-4">
            <span>Diff Target vs H-1:</span>
            <span className={`font-mono font-medium ${data.targetDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
              {data.targetDiff >= 0 ? "+" : ""}{data.targetDiff.toLocaleString("id-ID")}
            </span>
          </p>
          <p className="text-muted-foreground flex justify-between gap-4">
            <span>Diff Realisasi vs H-1:</span>
            <span className={`font-mono font-medium ${data.realisasiDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
              {data.realisasiDiff >= 0 ? "+" : ""}{data.realisasiDiff.toLocaleString("id-ID")}
            </span>
          </p>
          <hr className="my-1 border-border" />
          <p className="flex justify-between gap-4" style={{ color: chartConfig.actualPercentage.color }}>
            <span>% Realisasi:</span>
            <span className="font-mono font-bold">{data.actualPercentage.toFixed(1)}%</span>
          </p>
          <p className="flex justify-between gap-4" style={{ color: chartConfig.idealPercentage.color }}>
            <span>% Ideal (Target 75 Hari):</span>
            <span className="font-mono font-bold">{data.idealPercentage.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
};

import { RegionCombobox } from "@/components/ui/region-combobox";

// Internal Region Filter Popover Component
function RegionFilter({ 
  options, 
  desaOptions,
  currentKecamatan,
  currentDesa 
}: { 
  options: any[], 
  desaOptions?: any[],
  currentKecamatan: string,
  currentDesa: string 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedKecamatan, setSelectedKecamatan] = React.useState(currentKecamatan);
  const [selectedDesa, setSelectedDesa] = React.useState(currentDesa);

  // If kecamatan changes, reset desa
  const handleKecamatanChange = (val: string) => {
    setSelectedKecamatan(val || "all");
    setSelectedDesa("all");
  };

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("kodeKecamatan", selectedKecamatan);
    params.set("kodeDesa", selectedDesa);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const resetFilter = () => {
    setSelectedKecamatan("all");
    setSelectedDesa("all");
    const params = new URLSearchParams(searchParams.toString());
    params.set("kodeKecamatan", "all");
    params.set("kodeDesa", "all");
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const activeFiltersCount = (currentKecamatan !== "all" ? 1 : 0) + (currentDesa !== "all" ? 1 : 0);

  const kecamatanItems = [
    { label: "Semua Kecamatan", value: "all" },
    ...options.map((opt) => ({
      label: `[${opt.kode_kecamatan}] ${opt.nama_kecamatan.toUpperCase()}`,
      value: opt.kode_kecamatan
    }))
  ];

  const desaItems = [
    { label: "Semua Desa", value: "all" },
    ...(desaOptions || []).map((opt) => ({
      label: `[${opt.kode_desa}] ${opt.nama_desa.toUpperCase()}`,
      value: opt.kode_desa
    }))
  ];

  return (
    <Popover>
      <PopoverTrigger className="h-9 px-4 py-2 inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium border border-border bg-background text-foreground shadow-sm hover:bg-muted transition-colors">
        <Filter className="h-4 w-4" />
        Filter Wilayah {activeFiltersCount > 0 && `(${activeFiltersCount})`}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">PROVINSI</label>
            <RegionCombobox 
              options={[{ label: "[36] BANTEN", value: "36" }]}
              value="36"
              onChange={() => {}}
              placeholder="Pilih Provinsi"
              disabled
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">KABUPATEN/KOTA</label>
            <RegionCombobox 
              options={[{ label: "[3603] TANGERANG", value: "03" }]}
              value="03"
              onChange={() => {}}
              placeholder="Pilih Kabupaten"
              disabled
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">KECAMATAN</label>
            <RegionCombobox 
              options={kecamatanItems}
              value={selectedKecamatan}
              onChange={handleKecamatanChange}
              placeholder="Cari Kecamatan..."
            />
          </div>

          {selectedKecamatan !== "all" && desaOptions && desaOptions.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">DESA</label>
              <RegionCombobox 
                options={desaItems}
                value={selectedDesa}
                onChange={(val) => setSelectedDesa(val || "all")}
                placeholder="Cari Desa..."
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={resetFilter} className="flex-1 h-9 inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background text-foreground shadow-sm hover:bg-muted transition-colors">
              Reset
            </button>
            <button onClick={applyFilter} className="flex-1 h-9 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors">
              Terapkan
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Internal Date Filter Popover Component
function DateFilter({ currentStart, currentEnd }: { currentStart: string, currentEnd: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: parseISO(currentStart),
    to: parseISO(currentEnd)
  });

  const applyFilter = (range?: DateRange) => {
    const activeRange = range || date;
    if (activeRange?.from && activeRange?.to) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("startDate", format(activeRange.from, "yyyy-MM-dd"));
      params.set("endDate", format(activeRange.to, "yyyy-MM-dd"));
      router.push(`/?${params.toString()}`);
    }
  };

  const setPreset = (preset: "this_week" | "last_week" | "this_month" | "last_month") => {
    const today = new Date(); // Use real current date
    let range: DateRange;
    switch(preset) {
      case "this_week":
        range = { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
        break;
      case "last_week":
        const lastWeek = subDays(today, 7);
        range = { from: startOfWeek(lastWeek, { weekStartsOn: 1 }), to: endOfWeek(lastWeek, { weekStartsOn: 1 }) };
        break;
      case "this_month":
        range = { from: startOfMonth(today), to: endOfMonth(today) };
        break;
      case "last_month":
        const lastMonth = subDays(startOfMonth(today), 1);
        range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
    }
    setDate(range);
  };

  return (
    <Popover>
      <PopoverTrigger className="h-9 px-4 py-2 inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium border border-border bg-background text-foreground shadow-sm hover:bg-muted transition-colors">
        <CalendarIcon className="h-4 w-4" />
        {date?.from ? (
          date.to ? (
            `${format(date.from, "LLL dd")} - ${format(date.to, "LLL dd")}`
          ) : (
            format(date.from, "LLL dd")
          )
        ) : (
          "Filter Tanggal"
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="bg-card text-card-foreground p-3 border-b border-border">
          <Calendar
            mode="range"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            numberOfMonths={2}
            disabled={(date) => date > new Date("2026-08-31")} // Cap maximum select to end of survey
          />
        </div>
        <div className="p-3 grid grid-cols-2 gap-2 bg-muted/20">
          <button onClick={() => setPreset("this_week")} className="h-8 rounded text-xs font-medium border border-border hover:bg-muted transition-colors bg-background">Minggu Ini</button>
          <button onClick={() => setPreset("last_week")} className="h-8 rounded text-xs font-medium border border-border hover:bg-muted transition-colors bg-background">Minggu Lalu</button>
          <button onClick={() => setPreset("this_month")} className="h-8 rounded text-xs font-medium border border-border hover:bg-muted transition-colors bg-background">Bulan Ini</button>
          <button onClick={() => setPreset("last_month")} className="h-8 rounded text-xs font-medium border border-border hover:bg-muted transition-colors bg-background">Bulan Lalu</button>
          <button onClick={() => applyFilter()} className="col-span-2 mt-2 h-9 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors">
            Terapkan
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TrendChartCardProps {
  chartData: TrendDataPoint[];
  kecamatanOptions: any[];
  desaOptions?: any[];
  currentParams: {
    startDate: string;
    endDate: string;
    kodeKecamatan: string;
    kodeDesa: string;
  };
}

export function TrendChartCard({ chartData, kecamatanOptions, desaOptions, currentParams }: TrendChartCardProps) {
  const formattedStart = format(new Date(currentParams.startDate), "dd MMM yyyy", { locale: id });
  const formattedEnd = format(new Date(currentParams.endDate), "dd MMM yyyy", { locale: id });

  return (
    <Card id="trend-chart-card" className="rounded-[16px] border-border shadow-sm col-span-1">
      <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">Trend Persentase Realisasi Pendataan (Harian)</CardTitle>
            <Popover>
              <PopoverTrigger className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors" title="Download">
                <Download className="h-4 w-4" />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => exportDataToExcel(chartData, `trend_data_${currentParams.startDate}_${currentParams.endDate}.xlsx`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded text-left"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Download Excel
                  </button>
                  <button 
                    onClick={() => downloadChartAsImage('trend-chart-card', `trend_chart_${currentParams.startDate}_${currentParams.endDate}.png`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded text-left"
                  >
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Download Gambar (PNG)
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <CardDescription className="text-xs mt-1">
            Menampilkan data persentase capaian dari <span className="font-semibold text-foreground">{formattedStart}</span> hingga <span className="font-semibold text-foreground">{formattedEnd}</span>.
          </CardDescription>
        </div>
        
        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-2">
          <RegionFilter 
            options={kecamatanOptions} 
            desaOptions={desaOptions}
            currentKecamatan={currentParams.kodeKecamatan} 
            currentDesa={currentParams.kodeDesa}
          />
          <DateFilter currentStart={currentParams.startDate} currentEnd={currentParams.endDate} />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {chartData.length === 0 ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Tidak ada data untuk rentang waktu dan wilayah ini.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: -20,
                bottom: 0,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                className="text-xs"
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                className="text-xs"
                domain={['auto', 'auto']}
              />
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="actualPercentage"
                stroke="var(--color-actualPercentage)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="linear"
                dataKey="idealPercentage"
                stroke="var(--color-idealPercentage)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
