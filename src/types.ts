import { Timestamp } from 'firebase/firestore';

export type TransactionType = 'income' | 'expense';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  description: string;
  date: Timestamp | Date;
  receiptUrl?: string;
  createdAt: Timestamp | Date;
}

export interface Budget {
  id?: string;
  userId: string;
  category: string;
  amount: number;
  month: string; // YYYY-MM
  createdAt: Timestamp | Date;
}

export interface Goal {
  id?: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Timestamp | Date;
  createdAt: Timestamp | Date;
}

export interface Debt {
  id?: string;
  userId: string;
  name: string;
  amount: number;
  dueDate?: Timestamp | Date;
  type: 'debt' | 'loan';
  status: 'unpaid' | 'paid';
  createdAt: Timestamp | Date;
}

export interface AIInsight {
  id?: string;
  userId: string;
  title: string;
  content: string;
  type: 'warning' | 'tip' | 'positive';
  createdAt: Timestamp | Date;
}

export type Category = 
  | 'Makan'
  | 'Transportasi'
  | 'Tagihan'
  | 'Bisnis'
  | 'Investasi'
  | 'Hiburan'
  | 'Kesehatan'
  | 'Pendidikan'
  | 'Lainnya';

export const CATEGORIES: Category[] = [
  'Makan',
  'Transportasi',
  'Tagihan',
  'Bisnis',
  'Investasi',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Lainnya'
];

export const PAYMENT_METHODS = [
  'Cash',
  'Transfer',
  'E-wallet',
  'Kartu Kredit'
];
