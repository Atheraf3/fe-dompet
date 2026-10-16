import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  ListOrdered,
  LogOut,
  Moon,
  PieChart,
  Plus,
  Sun,
  WalletCards,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { TransactionFormSheet } from '@/components/TransactionFormSheet';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Transaksi', icon: ListOrdered, end: true },
  { to: '/calendar', label: 'Kalender', icon: CalendarDays, end: false },
  { to: '/statistics', label: 'Statistik', icon: PieChart, end: false },
  { to: '/wallets', label: 'Dompet', icon: WalletCards, end: false },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, theme, toggleTheme, logout, openCreateTransaction } = useAppStore();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-border bg-background shadow-sm">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-none tracking-tight text-foreground">
                Dompet PWA
              </h1>
              <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              aria-label="Keluar dari akun"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

        <div className="pointer-events-none fixed bottom-20 left-0 right-0 z-30 mx-auto flex w-full max-w-[480px] justify-end px-4">
          <Button
            type="button"
            onClick={() => openCreateTransaction()}
            aria-label="Tambah transaksi baru"
            className="pointer-events-auto h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <nav
          aria-label="Navigasi Utama"
          className="fixed bottom-0 left-0 right-0 z-30 mx-auto grid h-16 w-full max-w-[480px] grid-cols-4 border-t border-border bg-card px-2"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <TransactionFormSheet />
    </div>
  );
}
