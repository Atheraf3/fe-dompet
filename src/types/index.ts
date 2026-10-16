export type TransactionType = 'income' | 'expense' | 'transfer';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  color_code: string;
  initial_balance: number;
  balance: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  type: 'income' | 'expense';
  name: string;
  icon_name: string;
  color_code: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  to_wallet_id: string | null;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  description: string;
  memo: string | null;
  created_at: string;
  wallet?: Pick<Wallet, 'id' | 'name' | 'color_code'> | null;
  to_wallet?: Pick<Wallet, 'id' | 'name' | 'color_code'> | null;
  category?: Pick<Category, 'id' | 'name' | 'icon_name' | 'color_code' | 'type'> | null;
}

export interface StatisticsSummary {
  opening_balance: number;
  closing_balance: number;
  total_income: number;
  total_expense: number;
  net_transfer: number;
  net_cashflow: number;
}

export interface ChartCategoryItem {
  category_id: string;
  name: string;
  icon_name: string;
  color_code: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface StatisticsChartResponse {
  type: 'income' | 'expense';
  total: number;
  items: ChartCategoryItem[];
}
