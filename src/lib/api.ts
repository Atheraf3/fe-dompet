import type {
  Category,
  StatisticsChartResponse,
  StatisticsSummary,
  Transaction,
  TransactionType,
  User,
  Wallet,
} from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'dompet_pwa_access_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Permintaan gagal (${response.status})`);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (payload: { email: string; password: string; name?: string }) =>
      request<{ user: User; access_token: string | null; requires_email_confirmation?: boolean }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(payload) }
      ),
    login: (payload: { email: string; password: string }) =>
      request<{ user: User; access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    me: () => request<{ user: User; storage_mode: 'supabase' | 'local' }>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
  },

  wallets: {
    list: () => request<Wallet[]>('/wallets'),
    create: (payload: { name: string; color_code: string; initial_balance: number }) =>
      request<Wallet>('/wallets', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: { name?: string; color_code?: string; initial_balance?: number }) =>
      request<Wallet>(`/wallets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    remove: (id: string) => request<{ message: string }>(`/wallets/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: (type?: 'income' | 'expense') =>
      request<Category[]>(type ? `/categories?type=${type}` : '/categories'),
    create: (payload: {
      name: string;
      type: 'income' | 'expense';
      icon_name: string;
      color_code: string;
    }) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id: string) => request<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),
  },

  transactions: {
    list: (params?: {
      start_date?: string;
      end_date?: string;
      wallet_id?: string;
      type?: TransactionType;
    }) => {
      const search = new URLSearchParams();
      if (params?.start_date) search.set('start_date', params.start_date);
      if (params?.end_date) search.set('end_date', params.end_date);
      if (params?.wallet_id && params.wallet_id !== 'all') search.set('wallet_id', params.wallet_id);
      if (params?.type) search.set('type', params.type);
      const qs = search.toString();
      return request<Transaction[]>(`/transactions${qs ? `?${qs}` : ''}`);
    },
    create: (payload: {
      wallet_id: string;
      to_wallet_id?: string | null;
      category_id?: string | null;
      type: TransactionType;
      amount: number;
      transaction_date: string;
      description: string;
      memo?: string | null;
    }) => request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(payload) }),
    update: (
      id: string,
      payload: {
        wallet_id: string;
        to_wallet_id?: string | null;
        category_id?: string | null;
        type: TransactionType;
        amount: number;
        transaction_date: string;
        description: string;
        memo?: string | null;
      }
    ) =>
      request<Transaction>(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      request<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
  },

  statistics: {
    summary: (params: { start_date?: string; end_date?: string; wallet_id?: string }) => {
      const search = new URLSearchParams();
      if (params.start_date) search.set('start_date', params.start_date);
      if (params.end_date) search.set('end_date', params.end_date);
      if (params.wallet_id && params.wallet_id !== 'all') search.set('wallet_id', params.wallet_id);
      const qs = search.toString();
      return request<StatisticsSummary>(`/statistics/summary${qs ? `?${qs}` : ''}`);
    },
    chart: (params: {
      start_date?: string;
      end_date?: string;
      wallet_id?: string;
      type?: 'income' | 'expense';
    }) => {
      const search = new URLSearchParams();
      if (params.start_date) search.set('start_date', params.start_date);
      if (params.end_date) search.set('end_date', params.end_date);
      if (params.wallet_id && params.wallet_id !== 'all') search.set('wallet_id', params.wallet_id);
      if (params.type) search.set('type', params.type);
      const qs = search.toString();
      return request<StatisticsChartResponse>(`/statistics/chart${qs ? `?${qs}` : ''}`);
    },
  },
};
