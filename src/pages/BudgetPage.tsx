import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStore } from '../store';
import { 
  Plus, 
  PieChart, 
  Tag, 
  DollarSign, 
  Calendar,
  X,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Trash2,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Budget, EXPENSE_CATEGORIES } from '../types';
import { cn, OperationType, handleFirestoreError, withTimeout } from '../firebase/utils';

export default function BudgetPage() {
  const { user, budgets, setBudgets, transactions } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', user.uid),
      where('month', '==', selectedMonth)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bSet = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Budget[];
      setBudgets(bSet);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'budgets', false);
    });
    return () => unsubscribe();
  }, [user, selectedMonth, setBudgets]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const budgetData = {
        userId: user?.uid,
        category: formData.get('category') as string,
        amount: Number(formData.get('amount')),
        month: selectedMonth,
        updatedAt: serverTimestamp(),
      };

      if (editingBudget?.id) {
        await withTimeout(updateDoc(doc(db, 'budgets', editingBudget.id), budgetData));
        toast.success('Anggaran diperbarui');
      } else {
        await withTimeout(addDoc(collection(db, 'budgets'), { ...budgetData, createdAt: serverTimestamp() }));
        toast.success('Anggaran ditetapkan');
      }
      setIsModalOpen(false);
      setEditingBudget(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'budgets');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSpending = (category: string) => {
    return transactions
      .filter(tx => 
        tx.type === 'expense' && 
        tx.category === category && 
        format(tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date), 'yyyy-MM') === selectedMonth
      )
      .reduce((acc, tx) => acc + tx.amount, 0);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Perencana Anggaran</h1>
          <p className="text-slate-400 font-medium tracking-tight">Tetapkan batasan Anda. Bangun masa depan Anda.</p>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold focus:outline-none focus:border-emerald-500 transition-all text-white"
          />
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-6 h-6" />
            Atur Anggaran
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const spent = calculateSpending(budget.category);
          const percent = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;
          const isNearlyOver = percent > 85 && !isOver;

          return (
            <motion.div
              layout
              key={budget.id}
              className="bg-[#161B22] border border-slate-800 rounded-3xl p-8 backdrop-blur-xl relative group overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                    <PieChart className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{budget.category}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setEditingBudget(budget); setIsModalOpen(true); }}
                    title="Ubah Anggaran"
                    className="p-2 hover:bg-slate-800 rounded-lg text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await withTimeout(deleteDoc(doc(db, 'budgets', budget.id)));
                        toast.success('Anggaran dihapus');
                      } catch (error) {
                        handleFirestoreError(error, OperationType.DELETE, 'budgets');
                      }
                    }}
                    title="Hapus Anggaran"
                    className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-4">
                <p className="text-3xl font-black text-white tracking-tighter">
                  Rp{spent.toLocaleString()}
                  <span className="text-sm font-bold text-slate-500 tracking-normal ml-2 lowercase">terpakai dari Rp{budget.amount.toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors duration-500",
                      isOver ? "bg-rose-500" : isNearlyOver ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  />
                </div>
                <div className="flex items-center gap-2">
                  {isOver ? (
                    <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-bold uppercase tracking-widest">
                      <AlertTriangle className="w-4 h-4" /> Melebihi Anggaran
                    </div>
                  ) : isNearlyOver ? (
                    <div className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                      <TrendingDown className="w-4 h-4" /> Hampir tercapai
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> Sesuai jalur
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            </motion.div>
          );
        })}
        {budgets.length === 0 && (
          <div className="md:col-span-2 xl:col-span-3 py-32 flex flex-col items-center justify-center text-center opacity-30 select-none">
            <PieChart className="w-20 h-20 mb-6" />
            <h3 className="text-2xl font-bold">Belum ada anggaran untuk bulan ini</h3>
            <p className="mt-2 font-medium max-w-sm">Setiap rupiah butuh tugas. Tetapkan pendapatan Anda ke kategori agar tetap terkendali.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { if (!isSaving) setIsModalOpen(false); }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }} 
              className="relative w-full max-w-lg bg-[#161B22] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">{editingBudget ? 'Ubah Anggaran' : 'Atur Anggaran Kategori'}</h2>
                <button 
                  onClick={() => { if (!isSaving) setIsModalOpen(false); }}
                  disabled={isSaving}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Kategori</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <select name="category" defaultValue={editingBudget?.category || ''} disabled={isSaving} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors appearance-none text-white disabled:opacity-50">
                        {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Jumlah Anggaran (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 select-none">Rp</span>
                      <input type="number" name="amount" defaultValue={editingBudget?.amount} disabled={isSaving} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors text-white disabled:opacity-50" placeholder="misal: 500000" required />
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center"
                >
                  {isSaving ? 'Memproses...' : (editingBudget ? 'Perbarui Anggaran' : 'Atur Anggaran')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
