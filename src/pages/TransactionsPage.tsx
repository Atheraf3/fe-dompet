import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import {
  formatLedgerDateHeader,
  formatRupiah,
  formatShortDate,
  toDateKey,
} from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { Transaction } from '@/types';

export function TransactionsPage() {
  const {
    wallets,
    selectedWalletId,
    setSelectedWalletId,
    refreshCounter,
    openCreateTransaction,
    openEditTransaction,
    triggerRefresh,
  } = useAppStore();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.transactions.list({
        wallet_id: selectedWalletId !== 'all' ? selectedWalletId : undefined,
      });
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar transaksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [selectedWalletId, refreshCounter]);

  const activeWalletBalance = useMemo(() => {
    if (selectedWalletId === 'all') {
      return wallets.reduce((acc, w) => acc + Number(w.balance || 0), 0);
    }
    const found = wallets.find((w) => w.id === selectedWalletId);
    return found ? Number(found.balance) : 0;
  }, [wallets, selectedWalletId]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.type === 'income') income += Number(tx.amount);
      if (tx.type === 'expense') expense += Number(tx.amount);
    }
    return { income, expense };
  }, [transactions]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<
      string,
      { dateKey: string; label: string; items: Transaction[]; dailyNet: number }
    >();

    for (const tx of transactions) {
      const key = toDateKey(tx.transaction_date);
      const existing = groups.get(key) || {
        dateKey: key,
        label: formatLedgerDateHeader(tx.transaction_date),
        items: [],
        dailyNet: 0,
      };

      existing.items.push(tx);
      if (tx.type === 'income') existing.dailyNet += Number(tx.amount);
      if (tx.type === 'expense') existing.dailyNet -= Number(tx.amount);
      groups.set(key, existing);
    }

    return Array.from(groups.values());
  }, [transactions]);

  const handleDeleteTransaction = async () => {
    if (!selectedTx) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.transactions.remove(selectedTx.id);
      setSelectedTx(null);
      triggerRefresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus transaksi.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Buku Kas Transaksi</h2>
          <p className="text-xs text-muted-foreground">
            Catatan arus kas harian dari dompet Anda
          </p>
        </div>

        <div className="w-44">
          <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
            <SelectTrigger aria-label="Filter dompet">
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
      </div>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground">
                {selectedWalletId === 'all' ? 'Total Saldo Semua Dompet' : 'Saldo Dompet Aktif'}
              </span>
              <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {formatRupiah(activeWalletBalance)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <WalletIcon className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Penghasilan</p>
                <p className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  +{formatRupiah(totals.income)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Pengeluaran</p>
                <p className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-400 tabular-nums">
                  -{formatRupiah(totals.expense)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3 py-6" role="status" aria-label="Memuat transaksi">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 animate-pulse rounded-xl border border-border bg-card p-4"
            />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button type="button" variant="outline" size="sm" onClick={loadTransactions}>
              <RefreshCw className="h-4 w-4" />
              <span>Coba Muat Ulang</span>
            </Button>
          </CardContent>
        </Card>
      ) : groupedByDate.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <WalletIcon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                Belum Ada Catatan Transaksi
              </h3>
              <p className="text-xs text-muted-foreground">
                Catat penghasilan, pengeluaran, atau transfer pertama Anda agar arus kas tercatat rapi.
              </p>
            </div>
            <Button type="button" onClick={() => openCreateTransaction()}>
              <Plus className="h-4 w-4" />
              <span>Catat Transaksi Pertama</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groupedByDate.map((group) => (
            <Card key={group.dateKey} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-4 py-2.5">
                <span className="text-xs font-semibold text-foreground">{group.label}</span>
                <span
                  className={`font-mono text-xs font-semibold tabular-nums ${
                    group.dailyNet > 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : group.dailyNet < 0
                      ? 'text-rose-700 dark:text-rose-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {group.dailyNet > 0 ? '+' : ''}
                  {formatRupiah(group.dailyNet)}
                </span>
              </div>

              <div className="divide-y divide-border">
                {group.items.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setSelectedTx(tx);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                          style={{
                            backgroundColor: isTransfer
                              ? '#0369a1'
                              : tx.category?.color_code || '#0f766e',
                          }}
                        >
                          {isTransfer ? (
                            <ArrowLeftRight className="h-4 w-4" />
                          ) : (
                            <CategoryIcon name={tx.category?.icon_name} className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {tx.description}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>
                              {isTransfer ? 'Transfer' : tx.category?.name || 'Kategori'}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: tx.wallet?.color_code || '#0f766e' }}
                              />
                              {tx.wallet?.name || 'Dompet'}
                              {isTransfer && tx.to_wallet ? ` -> ${tx.to_wallet.name}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`font-mono text-sm font-bold tabular-nums ${
                            isIncome
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isTransfer
                              ? 'text-sky-700 dark:text-sky-400'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatRupiah(tx.amount)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={Boolean(selectedTx)} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <SheetContent>
          {selectedTx && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle>Rincian Transaksi</SheetTitle>
                <SheetDescription>
                  Dicatat pada {formatShortDate(selectedTx.transaction_date)}
                </SheetDescription>
              </SheetHeader>

              {deleteError && (
                <div
                  role="alert"
                  className="mb-3 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive"
                >
                  {deleteError}
                </div>
              )}

              <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-xs text-muted-foreground">Nominal</span>
                  <span
                    className={`font-mono text-xl font-bold tabular-nums ${
                      selectedTx.type === 'income'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : selectedTx.type === 'transfer'
                        ? 'text-sky-700 dark:text-sky-400'
                        : 'text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    {selectedTx.type === 'income'
                      ? '+'
                      : selectedTx.type === 'expense'
                      ? '-'
                      : ''}
                    {formatRupiah(selectedTx.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tipe Transaksi</span>
                  <span className="font-semibold capitalize text-foreground">
                    {selectedTx.type === 'income'
                      ? 'Penghasilan'
                      : selectedTx.type === 'expense'
                      ? 'Pengeluaran'
                      : 'Transfer Antar Dompet'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {selectedTx.type === 'transfer' ? 'Dompet Asal -> Tujuan' : 'Dompet'}
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedTx.wallet?.name}
                    {selectedTx.type === 'transfer' && selectedTx.to_wallet
                      ? ` -> ${selectedTx.to_wallet.name}`
                      : ''}
                  </span>
                </div>

                {selectedTx.type !== 'transfer' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Kategori</span>
                    <span className="font-semibold text-foreground">
                      {selectedTx.category?.name || '-'}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Keterangan</span>
                  <span className="font-semibold text-foreground">
                    {selectedTx.description}
                  </span>
                </div>

                {selectedTx.memo && (
                  <div className="border-t border-border pt-2 text-xs">
                    <span className="block text-muted-foreground">Memo</span>
                    <p className="mt-1 text-foreground">{selectedTx.memo}</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const txToEdit = selectedTx;
                    setSelectedTx(null);
                    openEditTransaction(txToEdit);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  disabled={deleting}
                  onClick={handleDeleteTransaction}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deleting ? 'Menghapus...' : 'Hapus'}</span>
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
