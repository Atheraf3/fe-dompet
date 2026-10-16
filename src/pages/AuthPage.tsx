import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Moon, Sun, WalletCards } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const authFormSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().email('Masukkan alamat email yang valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
});

type AuthFormValues = z.infer<typeof authFormSchema>;

export function AuthPage() {
  const { setSession, theme, toggleTheme } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (mode === 'register') {
        const res = await api.auth.register({
          email: values.email,
          password: values.password,
          name: values.name,
        });
        if (res.access_token && res.user) {
          await setSession(res.user, res.access_token);
        } else {
          setInfoMsg(
            'Pendaftaran berhasil. Silakan periksa email Anda untuk verifikasi atau masuk ke akun Anda.'
          );
          setMode('login');
        }
      } else {
        const res = await api.auth.login({
          email: values.email,
          password: values.password,
        });
        await setSession(res.user, res.access_token);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memproses autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center border-x border-border px-5 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <WalletCards className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Dompet PWA</h1>
              <p className="text-xs text-muted-foreground">
                Buku kas pribadi & pengelola dompet harian
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {mode === 'login' ? 'Masuk ke Buku Kas Anda' : 'Buat Akun Dompet Baru'}
            </CardTitle>
            <CardDescription>
              Catat pemasukan, pengeluaran, dan transfer antar dompet secara rapi di satu tempat.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={mode}
              onValueChange={(v) => {
                setMode(v as 'login' | 'register');
                setErrorMsg(null);
                setInfoMsg(null);
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar Baru</TabsTrigger>
              </TabsList>

              <TabsContent value={mode}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
                  {errorMsg && (
                    <div
                      role="alert"
                      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
                    >
                      {errorMsg}
                    </div>
                  )}

                  {infoMsg && (
                    <div
                      role="status"
                      className="rounded-lg border border-primary/40 bg-accent px-3 py-2 text-xs font-medium text-accent-foreground"
                    >
                      {infoMsg}
                    </div>
                  )}

                  {mode === 'register' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="auth-name">Nama Panggilan (Opsional)</Label>
                      <Input
                        id="auth-name"
                        type="text"
                        placeholder="Contoh: Budi"
                        {...form.register('name')}
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="auth-email">Alamat Email</Label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      {...form.register('email')}
                    />
                    {form.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="auth-password">Kata Sandi</Label>
                    <Input
                      id="auth-password"
                      type="password"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      placeholder="Minimal 6 karakter"
                      {...form.register('password')}
                    />
                    {form.formState.errors.password && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? 'Memproses...'
                      : mode === 'login'
                      ? 'Masuk ke Aplikasi'
                      : 'Daftar & Buat Dompet Utama'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
