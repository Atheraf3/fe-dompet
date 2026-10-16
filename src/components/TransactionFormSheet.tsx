import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/lib/api';
import { formatRupiah, formatShortDate, toDateKey } from '@/lib/utils';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from '@/components/CategoryIcon';
import type { TransactionType } from '@/types';

const txFormSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    transaction_date: z.string().min(1, 'Tanggal transaksi wajib diisi.'),
    amount: z.coerce.number().positive('Nominal harus lebih dari Rp 0.'),
    wallet_id: z.string().min(1, 'Dompet wajib dipilih.'),
    to_wallet_id: z.string().optional(),
    category_id: z.string().optional(),
    description: z.string().trim().min(1, 'Keterangan transaksi wajib diisi.').max(255),
    memo: z.string().trim().max(1000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'transfer') {
      if (!val.to_wallet_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['to_wallet_id'],
          message: 'Pilih dompet tujuan transfer.',
        });
      } else if (val.to_wallet_id === val.wallet_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['to_wallet_id'],
          message: 'Dompet tujuan harus berbeda dengan dompet asal.',
        });
      }
    } else if (!val.category_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['category_id'],
        message: 'Pilih kategori transaksi.',
      });
    }
  });

type TxFormValues = z.infer<typeof txFormSchema>;

const PRESET_COLORS = [
  '#be123c',
  '#b45309',
  '#0f766e',
  '#15803d',
  '#0369a1',
  '#4338ca',
  '#7e22ce',
  '#a21caf',
];

export function TransactionFormSheet() {
  const {
    isTxFormOpen,
    editingTransaction,
    prefilledDate,
    wallets,
    categories,
    selectedWalletId,
    closeTxForm,
    triggerRefresh,
    fetchWalletsAndCategories,
  } = useAppStore();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('#0f766e');
  const [catCreating, setCatCreating] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const defaultWalletId =
    selectedWalletId !== 'all'
      ? selectedWalletId
      : wallets[0]?.id || '';

  const form = useForm<TxFormValues>({
    resolver: zodResolver(txFormSchema),
    defaultValues: {
      type: 'expense',
      transaction_date: toDateKey(new Date()),
      amount: 0,
      wallet_id: defaultWalletId,
      to_wallet_id: '',
      category_id: '',
      description: '',
      memo: '',
    },
  });

  const activeType = form.watch('type');
  const activeDate = form.watch('transaction_date');
  const activeWalletId = form.watch('wallet_id');
  const activeToWalletId = form.watch('to_wallet_id');
  const activeCategoryId = form.watch('category_id');
  const watchedAmount = form.watch('amount');

  const filteredCategories = categories.filter(
    (c) => activeType !== 'transfer' && c.type === activeType
  );

  useEffect(() => {
    if (!isTxFormOpen) return;
    setSubmitError(null);

    if (editingTransaction) {
      form.reset({
        type: editingTransaction.type,
        transaction_date: toDateKey(editingTransaction.transaction_date),
        amount: Number(editingTransaction.amount),
        wallet_id: editingTransaction.wallet_id,
        to_wallet_id: editingTransaction.to_wallet_id || '',
        category_id: editingTransaction.category_id || '',
        description: editingTransaction.description,
        memo: editingTransaction.memo || '',
      });
    } else {
      const firstExpenseCat = categories.find((c) => c.type === 'expense')?.id || '';
      form.reset({
        type: 'expense',
        transaction_date: prefilledDate || toDateKey(new Date()),
        amount: 0,
        wallet_id:
          selectedWalletId !== 'all'
            ? selectedWalletId
            : wallets[0]?.id || '',
        to_wallet_id: wallets[1]?.id || '',
        category_id: firstExpenseCat,
        description: '',
        memo: '',
      });
    }
  }, [isTxFormOpen, editingTransaction, prefilledDate, wallets, categories, selectedWalletId, form]);

  const handleTypeChange = (nextType: string) => {
    const validType = nextType as TransactionType;
    form.setValue('type', validType, { shouldValidate: true });
    if (validType === 'transfer') {
      form.setValue('category_id', '');
      const fallbackTarget = wallets.find((w) => w.id !== activeWalletId)?.id || '';
      if (!activeToWalletId || activeToWalletId === activeWalletId) {
        form.setValue('to_wallet_id', fallbackTarget);
      }
    } else {
      const matchingCat = categories.find((c) => c.type === validType)?.id || '';
      form.setValue('category_id', matchingCat);
      form.setValue('to_wallet_id', '');
    }
  };

  const handleCreateCustomCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || activeType === 'transfer') {
      setCatError('Nama kategori wajib diisi.');
      return;
    }

    setCatCreating(true);
    setCatError(null);
    try {
      const created = await api.categories.create({
        name: newCatName.trim(),
        type: activeType,
        icon_name: newCatIcon,
        color_code: newCatColor,
      });
      await fetchWalletsAndCategories();
      form.setValue('category_id', created.id, { shouldValidate: true });
      setNewCatName('');
      setIsCatDialogOpen(false);
    } catch (err) {
      setCatError(err instanceof Error ? err.message : 'Gagal membuat kategori.');
    } finally {
      setCatCreating(false);
    }
  };

  const onSubmit = async (values: TxFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        type: values.type,
        transaction_date: values.transaction_date,
        amount: Number(values.amount),
        wallet_id: values.wallet_id,
        to_wallet_id: values.type === 'transfer' ? values.to_wallet_id || null : null,
        category_id: values.type === 'transfer' ? null : values.category_id || null,
        description: values.description,
        memo: values.memo || null,
      };

      if (editingTransaction) {
        await api.transactions.update(editingTransaction.id, payload);
      } else {
        await api.transactions.create(payload);
      }

      triggerRefresh();
      closeTxForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Sheet open={isTxFormOpen} onOpenChange={(open) => !open && closeTxForm()}>
        <SheetContent>
          <SheetHeader className="mb-4">
            <SheetTitle>
              {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
            </SheetTitle>
            <SheetDescription>
              Saldo dompet akan diperbarui secara otomatis saat transaksi disimpan.
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeType} onValueChange={handleTypeChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
              <TabsTrigger value="income">Penghasilan</TabsTrigger>
              <TabsTrigger value="transfer">Transfer</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
            {submitError && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
              >
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tx-date-btn">Tanggal</Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="tx-date-btn"
                      type="button"
                      variant="outline"
                      className="w-full justify-start px-3 font-normal tabular-nums"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{activeDate ? formatShortDate(activeDate) : 'Pilih tanggal'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start">
                    <Calendar
                      mode="single"
                      selected={activeDate}
                      onSelect={(dateKey) => {
                        form.setValue('transaction_date', dateKey, { shouldValidate: true });
                        setDatePopoverOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tx-amount">Jumlah (Rp)</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  min={1}
                  step="any"
                  placeholder="Contoh: 50000"
                  className="font-mono font-semibold tabular-nums"
                  {...form.register('amount')}
                />
                {Number(watchedAmount) > 0 && (
                  <p className="text-[11px] font-mono text-muted-foreground tabular-nums">
                    {formatRupiah(Number(watchedAmount))}
                  </p>
                )}
                {form.formState.errors.amount && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.amount.message}
                  </p>
                )}
              </div>
            </div>

            <div className={activeType === 'transfer' ? 'grid grid-cols-2 gap-3' : 'space-y-1.5'}>
              <div className="space-y-1.5">
                <Label>{activeType === 'transfer' ? 'Dompet Asal' : 'Dompet'}</Label>
                <Select
                  value={activeWalletId}
                  onValueChange={(val) => form.setValue('wallet_id', val, { shouldValidate: true })}
                >
                  <SelectTrigger aria-label="Pilih dompet">
                    <SelectValue placeholder="Pilih dompet" />
                  </SelectTrigger>
                  <SelectContent>
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
                {form.formState.errors.wallet_id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.wallet_id.message}
                  </p>
                )}
              </div>

              {activeType === 'transfer' && (
                <div className="space-y-1.5">
                  <Label>Dompet Tujuan</Label>
                  <Select
                    value={activeToWalletId || ''}
                    onValueChange={(val) =>
                      form.setValue('to_wallet_id', val, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger aria-label="Pilih dompet tujuan">
                      <SelectValue placeholder="Pilih tujuan" />
                    </SelectTrigger>
                    <SelectContent>
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
                  {form.formState.errors.to_wallet_id && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.to_wallet_id.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {activeType !== 'transfer' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Kategori</Label>
                  <button
                    type="button"
                    onClick={() => setIsCatDialogOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Kategori Kustom</span>
                  </button>
                </div>
                <Select
                  value={activeCategoryId || ''}
                  onValueChange={(val) =>
                    form.setValue('category_id', val, { shouldValidate: true })
                  }
                >
                  <SelectTrigger aria-label="Pilih kategori">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="flex h-5 w-5 items-center justify-center rounded-md text-white"
                            style={{ backgroundColor: c.color_code }}
                          >
                            <CategoryIcon name={c.icon_name} className="h-3 w-3" />
                          </span>
                          <span>{c.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.category_id.message}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tx-desc">Keterangan</Label>
              <Input
                id="tx-desc"
                type="text"
                maxLength={255}
                placeholder={
                  activeType === 'transfer'
                    ? 'Contoh: Pindah dana ke tabungan'
                    : 'Contoh: Makan siang nasi padang'
                }
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tx-memo">Memo (Opsional)</Label>
              <Textarea
                id="tx-memo"
                rows={2}
                placeholder="Catatan tambahan transaksi..."
                {...form.register('memo')}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={closeTxForm}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Menyimpan...'
                  : editingTransaction
                  ? 'Simpan Perubahan'
                  : 'Simpan Transaksi'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Kustom</DialogTitle>
            <DialogDescription>
              Kategori baru untuk tipe{' '}
              {activeType === 'income' ? 'Penghasilan' : 'Pengeluaran'}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomCategory} className="space-y-3.5">
            {catError && (
              <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                {catError}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="new-cat-name">Nama Kategori</Label>
              <Input
                id="new-cat-name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Contoh: Langganan Streaming"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Pilih Ikon</Label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVAILABLE_CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon.name}
                    type="button"
                    title={icon.label}
                    onClick={() => setNewCatIcon(icon.name)}
                    className={`flex h-10 items-center justify-center rounded-lg border transition-colors ${
                      newCatIcon === icon.name
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <CategoryIcon name={icon.name} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Warna Kategori</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Pilih warna ${color}`}
                    onClick={() => setNewCatColor(color)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      newCatColor === color
                        ? 'scale-110 border-foreground'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCatDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={catCreating}>
                {catCreating ? 'Menyimpan...' : 'Simpan Kategori'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
