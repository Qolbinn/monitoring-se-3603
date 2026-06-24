"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Filter, Download, FileSpreadsheet, ImageIcon } from "lucide-react";
import { exportDataToExcel, downloadChartAsImage } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Bar, ComposedChart, CartesianGrid, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ColumnChartCardProps {
  currentDate: string;
  kodeKecamatan: string;
  kecamatanOptions: { kode_kecamatan: string; nama_kecamatan: string }[];
  chartData: { area: string; actualPercentage: number; target: number; realisasi: number }[];
  idealPercentage: number;
}

import { RegionCombobox } from "@/components/ui/region-combobox";

// Internal Region Filter Popover Component
function RegionFilter({ currentKecamatan, options }: { currentKecamatan: string, options: { kode_kecamatan: string, nama_kecamatan: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = React.useState(currentKecamatan);

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("columnKecamatan", selected);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const resetFilter = () => {
    setSelected("all");
    const params = new URLSearchParams(searchParams.toString());
    params.set("columnKecamatan", "all");
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const kecamatanItems = [
    { label: "Semua Kecamatan", value: "all" },
    ...options.map((opt) => ({
      label: `[${opt.kode_kecamatan}] ${opt.nama_kecamatan.toUpperCase()}`,
      value: opt.kode_kecamatan
    }))
  ];

  return (
    <Popover>
      <PopoverTrigger className="h-9 px-4 py-2 inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium border border-border bg-background text-foreground shadow-sm hover:bg-muted transition-colors">
        <Filter className="h-4 w-4" />
        Filter Wilayah {currentKecamatan !== "all" && "(Aktif)"}
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
              value={selected}
              onChange={(val) => setSelected(val || "all")}
              placeholder="Cari Kecamatan..."
            />
          </div>

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

const chartConfig = {
  actualPercentage: {
    label: "Capaian (%)",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

export function ColumnChartCard({ currentDate, kodeKecamatan, kecamatanOptions, chartData, idealPercentage }: ColumnChartCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Date Picker State
  const [date, setDate] = React.useState<Date | undefined>(
    currentDate ? parse(currentDate, "yyyy-MM-dd", new Date()) : new Date()
  );

  const applyDateFilter = () => {
    if (date) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("columnDate", format(date, "yyyy-MM-dd"));
      router.push(`/?${params.toString()}`, { scroll: false });
    }
  };

  // Sort data descending by actualPercentage
  const sortedData = React.useMemo(() => {
    return [...chartData].sort((a, b) => b.actualPercentage - a.actualPercentage);
  }, [chartData]);

  return (
    <Card id="column-chart-card" className="rounded-[16px] border border-border bg-card shadow-sm col-span-1 md:col-span-2">
      <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold font-heading">Sebaran Capaian Wilayah</CardTitle>
            <Popover>
              <PopoverTrigger className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors" title="Download">
                <Download className="h-4 w-4" />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => exportDataToExcel(sortedData, `column_chart_data_${currentDate}.xlsx`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded text-left"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Download Excel
                  </button>
                  <button 
                    onClick={() => downloadChartAsImage('column-chart-card', `column_chart_${currentDate}.png`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded text-left"
                  >
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Download Gambar (PNG)
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <CardDescription>
            Persentase capaian per wilayah pada tanggal <span className="font-semibold text-foreground">{date ? format(date, "dd MMMM yyyy", { locale: localeId }) : "-"}</span> dibandingkan dengan target ideal harian.
          </CardDescription>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Region Filter */}
          <RegionFilter currentKecamatan={kodeKecamatan} options={kecamatanOptions} />

          {/* Single Date Picker Filter */}
          <Popover>
            <PopoverTrigger className="h-9 px-4 py-2 inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background shadow-sm hover:bg-muted transition-colors">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "d MMM yyyy", { locale: localeId }) : "Pilih Tanggal"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="bg-card p-3 border-b border-border">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md"
                  disabled={(d) => d > new Date("2026-08-31") || d < new Date("2026-06-15")}
                />
              </div>
              <div className="p-3 bg-muted/20">
                <button 
                  onClick={applyDateFilter} 
                  className="w-full h-9 inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Tidak ada data untuk rentang waktu dan wilayah ini.</p>
          </div>
        ) : (
          <div className="h-[400px] w-full mt-4">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={sortedData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="area"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                    fontFamily="Times New Roman"
                    tick={{ fill: "var(--color-text-secondary)" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: "var(--color-text-secondary)" }}
                    domain={[0, 'dataMax + 5']}
                  />
                  
                  {/* Custom Tooltip */}
                  <ChartTooltip
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isBelowIdeal = data.actualPercentage < idealPercentage;
                        return (
                          <div className="rounded-lg border border-border bg-background p-3 shadow-md min-w-[200px]">
                            <p className="font-bold text-sm mb-2">{data.area}</p>
                            <div className="flex justify-between items-center text-sm py-1 border-b border-border/50">
                              <span className="text-muted-foreground">Capaian Aktual:</span>
                              <span className="font-bold text-primary">{data.actualPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-1">
                              <span className="text-muted-foreground">Target Ideal:</span>
                              <span className="font-bold text-orange-500">{idealPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="mt-2 text-xs font-medium">
                              {isBelowIdeal ? (
                                <span className="text-red-600 flex items-center gap-1">
                                  ⬇ Defisit {(idealPercentage - data.actualPercentage).toFixed(1)}% dari target
                                </span>
                              ) : (
                                <span className="text-green-600 flex items-center gap-1">
                                  ⬆ Surplus {(data.actualPercentage - idealPercentage).toFixed(1)}% dari target
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  {/* Target Ideal Line */}
                  <ReferenceLine 
                    y={idealPercentage} 
                    stroke="#f97316" /* Orange-500 equivalent */
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ 
                      position: 'insideTopLeft', 
                      value: `Target Ideal: ${idealPercentage.toFixed(1)}%`,
                      fill: '#f97316',
                      fontSize: 12,
                      fontWeight: 600,
                      offset: 10
                    }}
                  />

                  {/* Actual Data Bar */}
                  <Bar 
                    dataKey="actualPercentage" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                    animationDuration={1500}
                  >
                    {sortedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.actualPercentage >= idealPercentage ? "var(--color-primary)" : "#fca5a5"} // Red-ish if below ideal
                      />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
