import { create } from 'zustand';
import { User, Transaction, Budget, Goal, Debt, AIInsight } from './types';

interface FinanceState {
  user: User | null;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  insights: AIInsight[];
  loading: boolean;
  
  setUser: (user: User | null) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setGoals: (goals: Goal[]) => void;
  setDebts: (debts: Debt[]) => void;
  setInsights: (insights: AIInsight[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<FinanceState>((set) => ({
  user: null,
  transactions: [],
  budgets: [],
  goals: [],
  debts: [],
  insights: [],
  loading: true,

  setUser: (user) => set({ user }),
  setTransactions: (transactions) => set({ transactions }),
  setBudgets: (budgets) => set({ budgets }),
  setGoals: (goals) => set({ goals }),
  setDebts: (debts) => set({ debts }),
  setInsights: (insights) => set({ insights }),
  setLoading: (loading) => set({ loading }),
}));
