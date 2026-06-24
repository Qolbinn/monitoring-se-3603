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
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface HorizontalBarChartCardProps {
  currentDate: string;
  kodeKecamatan: string;
  kecamatanOptions: { kode_kecamatan: string; nama_kecamatan: string }[];
  chartData: { area: string; actualPercentage: number; target: number; realisasi: number }[];
  idealPercentage: number;
  lastUpdatedTime?: string;
}

import { RegionCombobox } from "@/components/ui/region-combobox";

// Internal Region Filter Popover Component
function RegionFilter({ currentKecamatan, options }: { currentKecamatan: string, options: { kode_kecamatan: string, nama_kecamatan: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = React.useState(currentKecamatan);

  const applyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("barKecamatan", selected);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const resetFilter = () => {
    setSelected("all");
    const params = new URLSearchParams(searchParams.toString());
    params.set("barKecamatan", "all");
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
              onChange={() => { }}
              placeholder="Pilih Provinsi"
              disabled
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">KABUPATEN/KOTA</label>
            <RegionCombobox
              options={[{ label: "[3603] TANGERANG", value: "03" }]}
              value="03"
              onChange={() => { }}
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

export function HorizontalBarChartCard({ currentDate, kodeKecamatan, kecamatanOptions, chartData, idealPercentage, lastUpdatedTime }: HorizontalBarChartCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Date Picker State
  const [date, setDate] = React.useState<Date | undefined>(
    currentDate ? parse(currentDate, "yyyy-MM-dd", new Date()) : new Date()
  );
  const [showDataLabels, setShowDataLabels] = React.useState(true);

  const getBarTitle = () => {
    const d = date || new Date();
    const dateStr = format(d, "dd MMMM", { locale: localeId });

    let timeStr = "23:59";
    if (lastUpdatedTime) {
      const updatedDate = new Date(lastUpdatedTime);
      if (format(updatedDate, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")) {
        timeStr = format(updatedDate, "HH:mm");
      }
    }

    const dateTimeStr = `(${dateStr}, ${timeStr} WIB)`;

    if (!kodeKecamatan || kodeKecamatan === "all") {
      return `KECAMATAN DI KABUPATEN TANGERANG ${dateTimeStr}`;
    }
    const kecName = kecamatanOptions.find(k => k.kode_kecamatan === kodeKecamatan)?.nama_kecamatan?.toUpperCase() || "";
    return `DESA DI KECAMATAN ${kecName} ${dateTimeStr}`;
  };

  const applyDateFilter = () => {
    if (date) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("barDate", format(date, "yyyy-MM-dd"));
      router.push(`/?${params.toString()}`, { scroll: false });
    }
  };

  // Data Manipulation for Horizontal Bar
  const processedData = React.useMemo(() => {
    // 1. Duplicate and sort by actualPercentage descending
    const sorted = [...chartData].sort((a, b) => b.actualPercentage - a.actualPercentage);

    // 2. Inject the Ideal Target as a regular item
    // Add isIdeal flag so we can color it differently
    const idealItem = {
      area: `🎯 Target Ideal (${idealPercentage.toFixed(1)}%)`,
      actualPercentage: idealPercentage,
      target: 0,
      realisasi: 0,
      isIdeal: true
    };

    // 3. Find where to insert it so it maintains sorting
    const insertIndex = sorted.findIndex(item => item.actualPercentage < idealPercentage);
    if (insertIndex === -1) {
      sorted.push(idealItem as any); // All are better than ideal, so ideal is last
    } else {
      sorted.splice(insertIndex, 0, idealItem as any);
    }

    return sorted;
  }, [chartData, idealPercentage]);

  // Minimum height to ensure bars aren't squished if there are many regions
  // Reduced to 25px per item to shorten the overall image length
  const chartHeight = Math.max(300, processedData.length * 25 + 60);

  return (
    <Card className="rounded-[16px] border border-border bg-card shadow-sm col-span-1 md:col-span-2">
      <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold font-heading">Peringkat Capaian Wilayah</CardTitle>
            <Popover>
              <PopoverTrigger className="px-2 py-1 hover:bg-muted rounded text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5" title="Download">
                Download <Download className="h-4 w-4" />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => exportDataToExcel(processedData, `horizontal_bar_data_${kodeKecamatan || 'all'}.xlsx`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded text-left"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Download Excel
                  </button>
                  <button
                    onClick={() => downloadChartAsImage('horizontal-bar-chart-card', `horizontal_bar_chart_${kodeKecamatan || 'all'}.png`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-muted rounded text-left"
                  >
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    Download Gambar (PNG)
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 bg-muted/30 p-1.5 rounded-md border border-border/50">
            <Switch
              id="horizontal-label-toggle"
              checked={showDataLabels}
              onCheckedChange={setShowDataLabels}
            />
            <label htmlFor="horizontal-label-toggle" className="text-xs font-medium cursor-pointer select-none pr-1">
              Label Data
            </label>
          </div>
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
      <CardContent id="horizontal-bar-chart-card" className="pt-6 bg-card rounded-b-[16px] p-4 sm:p-6">
        <div className="mb-4 text-center w-full">
          <h3 className="text-base font-bold uppercase tracking-wider">{getBarTitle()}</h3>
        </div>
        {processedData.length === 1 ? (
          <div className="h-[400px] w-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">Tidak ada data untuk rentang waktu dan wilayah ini.</p>
          </div>
        ) : (
          <div style={{ height: chartHeight }} className="w-full mt-4">
            <ChartContainer config={chartConfig} className="w-full h-full min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={processedData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: "currentColor", fontSize: 13, fontWeight: "bold" }}
                    domain={[0, 'dataMax + 5']}
                  />
                  <YAxis
                    type="category"
                    dataKey="area"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    fontSize={12}
                    width={120}
                    tick={{ fill: "currentColor", fontSize: 13, fontWeight: "bold" }}
                  />

                  {/* Custom Tooltip */}
                  <ChartTooltip
                    cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as any;
                        if (data.isIdeal) {
                          return (
                            <div className="rounded-lg border border-border bg-background p-3 shadow-md min-w-[200px]">
                              <p className="font-bold text-red-500 mb-2">🎯 Target Ideal Hari Ini</p>
                              <div className="flex justify-between items-center text-sm py-1">
                                <span className="text-muted-foreground">Persentase Target:</span>
                                <span className="font-bold text-red-500">{data.actualPercentage.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        }

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
                              <span className="font-bold text-red-500">{idealPercentage.toFixed(1)}%</span>
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

                  {/* Actual Data Bar */}
                  <Bar
                    dataKey="actualPercentage"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                    animationDuration={1500}
                  >
                    {processedData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isIdeal
                          ? "#ef4444" /* Red for ideal target */
                          : entry.actualPercentage >= idealPercentage
                            ? "var(--color-primary)"
                            : "#fca5a5" /* Red-ish if below ideal */
                        }
                      />
                    ))}
                    {showDataLabels && (
                      <LabelList
                        dataKey="actualPercentage"
                        position="right"
                        formatter={(val: any) => typeof val === 'number' ? val.toFixed(1) : val}
                        style={{ fontSize: 14, fontWeight: "bold", fill: "currentColor" }}
                      />
                    )}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
