import React, { useEffect, useMemo, useState } from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { formatRupiah, formatShortDate, toDateKey } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { StatisticsChartResponse, StatisticsSummary } from '@/types';

export function StatisticsPage() {
  const {
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    dateRange,
    setDateRange,
    refreshCounter,
  } = useAppStore();

  const [chartType, setChartType] = useState<'expense' | 'income'>('expense');
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [chartData, setChartData] = useState<StatisticsChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, chartRes] = await Promise.all([
        api.statistics.summary({
          start_date: dateRange.from,
          end_date: dateRange.to,
          wallet_id: selectedWalletId,
        }),
        api.statistics.chart({
          start_date: dateRange.from,
          end_date: dateRange.to,
          wallet_id: selectedWalletId,
          type: chartType,
        }),
      ]);
      setSummary(sumRes);
      setChartData(chartRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat statistik keuangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [dateRange.from, dateRange.to, selectedWalletId, chartType, refreshCounter]);

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    for (const item of chartData?.items || []) {
      cfg[item.category_id] = {
        label: item.name,
        color: item.color_code,
      };
    }
    return cfg;
  }, [chartData]);

  const applyPresetRange = (preset: 'this_month' | 'last_30' | 'this_year') => {
    const now = new Date();
    if (preset === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({ from: toDateKey(first), to: toDateKey(last) });
    } else if (preset === 'last_30') {
      const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      setDateRange({ from: toDateKey(past), to: toDateKey(now) });
    } else {
      const first = new Date(now.getFullYear(), 0, 1);
      const last = new Date(now.getFullYear(), 11, 31);
      setDateRange({ from: toDateKey(first), to: toDateKey(last) });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Laporan & Statistik</h2>
        <p className="text-xs text-muted-foreground">
          Analisis saldo awal, saldo akhir, dan struktur kategori keuangan Anda
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start px-3 text-xs font-medium tabular-nums"
            >
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {formatShortDate(dateRange.from)} - {formatShortDate(dateRange.to)}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80">
            <div className="mb-2 flex gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 text-[11px]"
                onClick={() => applyPresetRange('this_month')}
              >
                Bulan Ini
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 text-[11px]"
                onClick={() => applyPresetRange('last_30')}
              >
                30 Hari
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 text-[11px]"
                onClick={() => applyPresetRange('this_year')}
              >
                Tahun Ini
              </Button>
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(next) => setDateRange(next)}
            />
          </PopoverContent>
        </Popover>

        <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
          <SelectTrigger aria-label="Filter dompet statistik">
            <SelectValue placeholder="Semua Dompet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Dompet</SelectItem>
            {wallets.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: w.color_code }}
                  />
                  <span>{w.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={loadStatistics}>
              <RefreshCw className="h-4 w-4" />
              <span>Muat Ulang Statistik</span>
            </Button>
          </CardContent>
        </Card>
      ) : loading || !summary ? (
        <div className="grid grid-cols-2 gap-3" role="status" aria-label="Memuat statistik">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-20 animate-pulse rounded-xl border border-border bg-card p-4"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <Card>
              <CardContent className="p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Saldo Awal</p>
                <p className="mt-1 font-mono text-base font-bold text-foreground tabular-nums">
                  {formatRupiah(summary.opening_balance)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Per {formatShortDate(dateRange.from)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Saldo Akhir</p>
                <p className="mt-1 font-mono text-base font-bold text-primary tabular-nums">
                  {formatRupiah(summary.closing_balance)}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  Per {formatShortDate(dateRange.to)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Penghasilan</p>
                <p className="mt-1 font-mono text-base font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  +{formatRupiah(summary.total_income)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Pengeluaran</p>
                <p className="mt-1 font-mono text-base font-bold text-rose-700 dark:text-rose-400 tabular-nums">
                  -{formatRupiah(summary.total_expense)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>
                    Struktur {chartType === 'expense' ? 'Pengeluaran' : 'Penghasilan'}
                  </CardTitle>
                  <CardDescription>
                    Distribusi kategori pada periode terpilih
                  </CardDescription>
                </div>

                <Tabs
                  value={chartType}
                  onValueChange={(v) => setChartType(v as 'expense' | 'income')}
                >
                  <TabsList className="h-9 min-h-[36px]">
                    <TabsTrigger value="expense" className="px-2.5 text-xs">
                      Keluar
                    </TabsTrigger>
                    <TabsTrigger value="income" className="px-2.5 text-xs">
                      Masuk
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>

            <CardContent>
              {!chartData || chartData.items.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  Belum ada data {chartType === 'expense' ? 'pengeluaran' : 'penghasilan'} pada
                  rentang tanggal ini.
                </div>
              ) : (
                <>
                  <ChartContainer config={chartConfig} className="mx-auto max-h-[220px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={chartData.items}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={56}
                        outerRadius={86}
                        paddingAngle={2}
                        strokeWidth={2}
                      >
                        {chartData.items.map((entry) => (
                          <Cell key={entry.category_id} fill={entry.color_code} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>

                  <ChartLegend items={chartData.items} />

                  <div className="mt-4 divide-y divide-border border-t border-border">
                    {chartData.items.map((item) => (
                      <div
                        key={item.category_id}
                        className="flex items-center justify-between py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                            style={{ backgroundColor: item.color_code }}
                          >
                            <CategoryIcon name={item.icon_name} className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {item.count} transaksi ({item.percentage}%)
                            </p>
                          </div>
                        </div>

                        <span className="font-mono font-bold text-foreground tabular-nums">
                          {formatRupiah(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
