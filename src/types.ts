export type TransactionType = 'income' | 'expense' | 'transfer';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  updatedAt?: number;
}

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  description: string;
  date: number; // Storing as milliseconds for sorting capability
  receiptUrl?: string;
  debtId?: string;
  goalId?: string;
  createdAt: number;
  updatedAt?: number;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'weekly' | 'yearly';
}

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  amount: number;
  month: string; // YYYY-MM
  createdAt: number;
  updatedAt?: number;
}

export interface Goal {
  id?: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: number;
  createdAt: number;
  updatedAt?: number;
}

export interface Debt {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  dueDate?: number;
  type: 'debt' | 'loan';
  status: 'unpaid' | 'paid';
  createdAt: number;
  updatedAt?: number;
}

export interface AIInsight {
  id?: string;
  userId: string;
  title: string;
  content: string;
  type: 'warning' | 'tip' | 'positive';
  createdAt: number;
}

export const INCOME_CATEGORIES = [
  'Gaji',
  'Bonus',
  'Bisnis',
  'Investasi',
  'Hadiah',
  'Penjualan',
  'Lain-lain'
];

export const EXPENSE_CATEGORIES = [
  'Makanan',
  'Transportasi',
  'Kesehatan',
  'Pendidikan',
  'Kebutuhan Rumah',
  'Internet & Pulsa',
  'Listrik & Air',
  'Loundry',
  'Pembayaran Hutang',
  'Investasi',
  'Sedekah',
  'Orang Tua',
  'Liburan',
  'Perawatan',
  'Pakaian',
  'Pribadi',
  'Lain-lain'
];

export const CATEGORIES = Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]));

export type Category = string;

export const PAYMENT_METHODS = [
  'Tunai',
  'Transfer Bank',
  'Dompet Digital',
  'Kartu Kredit'
];
