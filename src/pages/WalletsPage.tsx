import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Trash2, WalletCards } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Wallet } from '@/types';

const WALLET_COLORS = [
  { code: '#0f766e', name: 'Zamrud' },
  { code: '#1d4ed8', name: 'Biru Kobalt' },
  { code: '#b45309', name: 'Amber' },
  { code: '#be123c', name: 'Merah Rubi' },
  { code: '#4338ca', name: 'Indigo' },
  { code: '#15803d', name: 'Hijau Daun' },
  { code: '#7e22ce', name: 'Ungu' },
  { code: '#374151', name: 'Grafit' },
];

const walletFormSchema = z.object({
  name: z.string().trim().min(1, 'Nama dompet wajib diisi.').max(100),
  color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Pilih warna dompet.'),
  initial_balance: z.coerce.number(),
});

type WalletFormValues = z.infer<typeof walletFormSchema>;

export function WalletsPage() {
  const { wallets, triggerRefresh } = useAppStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Wallet | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      name: '',
      color_code: '#0f766e',
      initial_balance: 0,
    },
  });

  const selectedColor = form.watch('color_code');

  const totalCombinedBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

  const openCreateModal = () => {
    setEditingWallet(null);
    setFormError(null);
    form.reset({
      name: '',
      color_code: '#0f766e',
      initial_balance: 0,
    });
    setDialogOpen(true);
  };

  const openEditModal = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormError(null);
    form.reset({
      name: wallet.name,
      color_code: wallet.color_code,
      initial_balance: Number(wallet.initial_balance),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: WalletFormValues) => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingWallet) {
        await api.wallets.update(editingWallet.id, {
          name: values.name,
          color_code: values.color_code,
          initial_balance: Number(values.initial_balance),
        });
      } else {
        await api.wallets.create({
          name: values.name,
          color_code: values.color_code,
          initial_balance: Number(values.initial_balance),
        });
      }
      triggerRefresh();
      setDialogOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan dompet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.wallets.remove(deleteTarget.id);
      triggerRefresh();
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Gagal menghapus dompet.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Manajemen Dompet</h2>
          <p className="text-xs text-muted-foreground">
            Kelola sumber dana dan rekening penyimpanan Anda
          </p>
        </div>

        <Button type="button" size="sm" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          <span>Tambah Dompet</span>
        </Button>
      </div>

      <Card className="bg-primary text-primary-foreground">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-medium opacity-90">
              Total Gabungan ({wallets.length} Dompet)
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-tight tabular-nums">
              {formatRupiah(totalCombinedBalance)}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <WalletCards className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <p className="text-sm font-semibold">Belum Ada Dompet</p>
            <p className="text-xs text-muted-foreground">
              Tambahkan dompet pertama Anda untuk mulai mencatat pemasukan dan pengeluaran.
            </p>
            <Button type="button" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              <span>Buat Dompet Pertama</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="overflow-hidden">
              <div
                className="h-2 w-full"
                style={{ backgroundColor: wallet.color_code }}
              />
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: wallet.color_code }}
                    />
                    <h3 className="font-semibold text-foreground">{wallet.name}</h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(wallet)}
                      aria-label={`Edit dompet ${wallet.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(wallet);
                      }}
                      aria-label={`Hapus dompet ${wallet.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-[11px] text-muted-foreground">Saldo Saat Ini</p>
                  <p className="font-mono text-lg font-bold text-foreground tabular-nums">
                    {formatRupiah(wallet.balance)}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground tabular-nums">
                    Saldo awal: {formatRupiah(wallet.initial_balance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWallet ? 'Edit Dompet' : 'Tambah Dompet Baru'}
            </DialogTitle>
            <DialogDescription>
              Berikan nama, saldo awal, dan warna identitas untuk dompet ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <div
                role="alert"
                className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive"
              >
                {formError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="wallet-name">Nama Dompet</Label>
              <Input
                id="wallet-name"
                placeholder="Contoh: MagangHub, BCA, Dompet Tunai"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wallet-initial">Saldo Awal (Rp)</Label>
              <Input
                id="wallet-initial"
                type="number"
                step="any"
                className="font-mono tabular-nums"
                placeholder="0"
                {...form.register('initial_balance')}
              />
              <p className="text-[11px] text-muted-foreground">
                Jika saldo awal diubah, saldo berjalan akan ikut menyesuaikan selisihnya.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Warna Kartu Dompet</Label>
              <div className="grid grid-cols-4 gap-2">
                {WALLET_COLORS.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() =>
                      form.setValue('color_code', c.code, { shouldValidate: true })
                    }
                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs font-medium transition-colors ${
                      selectedColor === c.code
                        ? 'border-foreground bg-secondary font-semibold'
                        : 'border-border bg-card hover:bg-secondary/50'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: c.code }}
                    />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Menyimpan...'
                  : editingWallet
                  ? 'Simpan Perubahan'
                  : 'Buat Dompet'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Dompet {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              Dompet hanya dapat dihapus apabila belum memiliki riwayat transaksi.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs font-medium text-destructive"
            >
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? 'Menghapus...' : 'Ya, Hapus Dompet'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
