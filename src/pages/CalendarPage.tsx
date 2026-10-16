import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import {
  formatCompactRupiah,
  formatLedgerDateHeader,
  formatMonthYear,
  formatRupiah,
  toDateKey,
} from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { Transaction } from '@/types';

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function CalendarPage() {
  const {
    selectedWalletId,
    refreshCounter,
    openCreateTransaction,
    openEditTransaction,
  } = useAppStore();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthRange = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    return {
      start: toDateKey(first),
      end: toDateKey(last),
      year,
      month,
      firstDayOfWeek: first.getDay(),
      daysInMonth: last.getDate(),
    };
  }, [currentMonth]);

  const loadMonthTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.transactions.list({
        start_date: monthRange.start,
        end_date: monthRange.end,
        wallet_id: selectedWalletId !== 'all' ? selectedWalletId : undefined,
      });
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kalender transaksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthTransactions();
  }, [monthRange.start, monthRange.end, selectedWalletId, refreshCounter]);

  const dailySummaryMap = useMemo(() => {
    const map = new Map<
      string,
      { income: number; expense: number; items: Transaction[] }
    >();

    for (const tx of transactions) {
      const key = toDateKey(tx.transaction_date);
      const entry = map.get(key) || { income: 0, expense: 0, items: [] };
      if (tx.type === 'income') entry.income += Number(tx.amount);
      if (tx.type === 'expense') entry.expense += Number(tx.amount);
      entry.items.push(tx);
      map.set(key, entry);
    }

    return map;
  }, [transactions]);

  const monthTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') income += Number(tx.amount);
      if (tx.type === 'expense') expense += Number(tx.amount);
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

  const selectedDayData = dailySummaryMap.get(selectedDateKey) || {
    income: 0,
    expense: 0,
    items: [],
  };

  const cells: Array<{ key: string; day: number } | null> = [];
  for (let i = 0; i < monthRange.firstDayOfWeek; i++) {
    cells.push(null);
  }
  for (let d = 1; d <= monthRange.daysInMonth; d++) {
    cells.push({
      key: toDateKey(new Date(monthRange.year, monthRange.month, d)),
      day: d,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Kalender Kas</h2>
          <p className="text-xs text-muted-foreground">
            Ketuk tanggal untuk melihat atau mencatat transaksi harian
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Bulan sebelumnya"
            onClick={() => {
              const prev = new Date(monthRange.year, monthRange.month - 1, 1);
              setCurrentMonth(prev);
              setSelectedDateKey(toDateKey(prev));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[125px] text-center text-sm font-semibold">
            {formatMonthYear(currentMonth)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Bulan berikutnya"
            onClick={() => {
              const next = new Date(monthRange.year, monthRange.month + 1, 1);
              setCurrentMonth(next);
              setSelectedDateKey(toDateKey(next));
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Masuk Bulan Ini</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              +{formatCompactRupiah(monthTotals.income)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Keluar Bulan Ini</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-rose-700 dark:text-rose-400 tabular-nums">
              -{formatCompactRupiah(monthTotals.expense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[11px] text-muted-foreground">Selisih Bersih</p>
            <p className="mt-0.5 font-mono text-xs font-bold text-foreground tabular-nums">
              {monthTotals.net >= 0 ? '+' : ''}
              {formatCompactRupiah(monthTotals.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={loadMonthTransactions}>
              <RefreshCw className="h-4 w-4" />
              <span>Muat Ulang</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-3">
            <div className="mb-1.5 grid grid-cols-7 text-center">
              {HARI_SINGKAT.map((h) => (
                <span key={h} className="py-1 text-[11px] font-semibold text-muted-foreground">
                  {h}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="h-64 animate-pulse rounded-xl bg-secondary/50" />
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell, idx) => {
                  if (!cell) {
                    return <div key={`empty-${idx}`} className="h-14" />;
                  }

                  const daySummary = dailySummaryMap.get(cell.key);
                  const isSelected = cell.key === selectedDateKey;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => setSelectedDateKey(cell.key)}
                      className={`flex h-14 flex-col items-center justify-between rounded-xl border p-1.5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isSelected
                          ? 'border-primary bg-accent/80 text-foreground'
                          : 'border-transparent hover:border-border hover:bg-secondary/50'
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isSelected ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {cell.day}
                      </span>

                      {daySummary && (
                        <div className="w-full space-y-0.5 overflow-hidden">
                          {daySummary.income > 0 && (
                            <div className="truncate font-mono text-[9px] font-semibold leading-tight text-emerald-700 dark:text-emerald-400 tabular-nums">
                              +{Math.round(daySummary.income / 1000)}k
                            </div>
                          )}
                          {daySummary.expense > 0 && (
                            <div className="truncate font-mono text-[9px] font-semibold leading-tight text-rose-700 dark:text-rose-400 tabular-nums">
                              -{Math.round(daySummary.expense / 1000)}k
                            </div>
                          )}
                          {daySummary.income === 0 &&
                            daySummary.expense === 0 &&
                            daySummary.items.length > 0 && (
                              <div className="mx-auto h-1.5 w-1.5 rounded-full bg-sky-600" />
                            )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-4 py-3">
          <div>
            <h3 className="text-xs font-bold text-foreground">
              {formatLedgerDateHeader(selectedDateKey)}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {selectedDayData.items.length} transaksi tercatat
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openCreateTransaction(selectedDateKey)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Catat di Tanggal Ini</span>
          </Button>
        </div>

        <CardContent className="p-0">
          {selectedDayData.items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Tidak ada transaksi pada tanggal ini.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {selectedDayData.items.map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => openEditTransaction(tx)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{
                        backgroundColor:
                          tx.type === 'transfer'
                            ? '#0369a1'
                            : tx.category?.color_code || '#0f766e',
                      }}
                    >
                      {tx.type === 'transfer' ? (
                        <ArrowLeftRight className="h-4 w-4" />
                      ) : (
                        <CategoryIcon name={tx.category?.icon_name} className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {tx.wallet?.name}
                        {tx.type === 'transfer' && tx.to_wallet
                          ? ` -> ${tx.to_wallet.name}`
                          : ` • ${tx.category?.name || ''}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-sm font-bold tabular-nums ${
                      tx.type === 'income'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : tx.type === 'transfer'
                        ? 'text-sky-700 dark:text-sky-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    {formatRupiah(tx.amount)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
