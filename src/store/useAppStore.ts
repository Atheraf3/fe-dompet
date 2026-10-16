import { create } from 'zustand';
import { api, getStoredToken, setStoredToken } from '@/lib/api';
import { toDateKey } from '@/lib/utils';
import type { Category, Transaction, User, Wallet } from '@/types';

interface DateRangeFilter {
  from: string;
  to: string;
}

interface AppState {
  user: User | null;
  storageMode: 'supabase' | 'local';
  authLoading: boolean;
  theme: 'light' | 'dark';

  wallets: Wallet[];
  categories: Category[];
  selectedWalletId: string;
  dateRange: DateRangeFilter;
  refreshCounter: number;

  isTxFormOpen: boolean;
  editingTransaction: Transaction | null;
  prefilledDate: string | null;

  initApp: () => Promise<void>;
  setSession: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleTheme: () => void;

  fetchWalletsAndCategories: () => Promise<void>;
  setSelectedWalletId: (walletId: string) => void;
  setDateRange: (range: DateRangeFilter) => void;
  triggerRefresh: () => void;

  openCreateTransaction: (defaultDate?: string) => void;
  openEditTransaction: (tx: Transaction) => void;
  closeTxForm: () => void;
}

function getDefaultMonthRange(): DateRangeFilter {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: toDateKey(firstDay),
    to: toDateKey(lastDay),
  };
}

function getInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('dompet_pwa_theme');
  if (saved === 'dark' || saved === 'light') {
    document.documentElement.classList.toggle('dark', saved === 'dark');
    return saved;
  }
  return 'light';
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  storageMode: 'local',
  authLoading: true,
  theme: getInitialTheme(),

  wallets: [],
  categories: [],
  selectedWalletId: 'all',
  dateRange: getDefaultMonthRange(),
  refreshCounter: 0,

  isTxFormOpen: false,
  editingTransaction: null,
  prefilledDate: null,

  initApp: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ user: null, authLoading: false });
      return;
    }

    try {
      const me = await api.auth.me();
      set({ user: me.user, storageMode: me.storage_mode });
      await get().fetchWalletsAndCategories();
    } catch {
      setStoredToken(null);
      set({ user: null });
    } finally {
      set({ authLoading: false });
    }
  },

  setSession: async (user, token) => {
    setStoredToken(token);
    set({ user, authLoading: false });
    await get().fetchWalletsAndCategories();
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors during logout cleanup.
    } finally {
      setStoredToken(null);
      set({
        user: null,
        wallets: [],
        categories: [],
        selectedWalletId: 'all',
      });
    }
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('dompet_pwa_theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    set({ theme: next });
  },

  fetchWalletsAndCategories: async () => {
    const [wallets, categories] = await Promise.all([
      api.wallets.list(),
      api.categories.list(),
    ]);
    set({ wallets, categories });
  },

  setSelectedWalletId: (walletId) => set({ selectedWalletId: walletId }),

  setDateRange: (range) => set({ dateRange: range }),

  triggerRefresh: () => {
    get().fetchWalletsAndCategories();
    set((s) => ({ refreshCounter: s.refreshCounter + 1 }));
  },

  openCreateTransaction: (defaultDate) =>
    set({
      isTxFormOpen: true,
      editingTransaction: null,
      prefilledDate: defaultDate || toDateKey(new Date()),
    }),

  openEditTransaction: (tx) =>
    set({
      isTxFormOpen: true,
      editingTransaction: tx,
      prefilledDate: null,
    }),

  closeTxForm: () =>
    set({
      isTxFormOpen: false,
      editingTransaction: null,
      prefilledDate: null,
    }),
}));
