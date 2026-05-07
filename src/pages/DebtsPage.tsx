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
  HandCoins, 
  User, 
  Calendar,
  X,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Debt } from '../types';
import { cn, OperationType, handleFirestoreError } from '../firebase/utils';

export default function DebtsPage() {
  const { user, debts, setDebts } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'debts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dSet = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Debt[];
      setDebts(dSet);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'debts');
    });
    return () => unsubscribe();
  }, [user, setDebts]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const debtData = {
      userId: user?.uid,
      name: formData.get('name') as string,
      amount: Number(formData.get('amount')),
      type: formData.get('type') as 'debt' | 'loan',
      status: formData.get('status') as 'unpaid' | 'paid',
      dueDate: formData.get('dueDate') ? Timestamp.fromDate(new Date(formData.get('dueDate') as string)) : null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingDebt?.id) {
        await updateDoc(doc(db, 'debts', editingDebt.id), debtData);
        toast.success('Informasi diperbarui');
      } else {
        await addDoc(collection(db, 'debts'), { ...debtData, createdAt: serverTimestamp() });
        toast.success('Hutang/Pinjaman dicatat');
      }
      setIsModalOpen(false);
      setEditingDebt(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'debts');
    }
  };

  const toggleStatus = async (debt: Debt) => {
    if (!debt.id) return;
    const newStatus = debt.status === 'paid' ? 'unpaid' : 'paid';
    try {
      await updateDoc(doc(db, 'debts', debt.id), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Ditandai sebagai ${newStatus === 'paid' ? 'sudah dibayar' : 'belum dibayar'}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'debts');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Hutang & Pinjaman</h1>
          <p className="text-slate-400 font-medium tracking-tight">Kelola kewajiban Anda dengan transparansi.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-6 h-6" />
          Tambah Entri
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debts.map((debt) => (
          <motion.div
            layout
            key={debt.id}
            className={cn(
              "p-8 rounded-[32px] border backdrop-blur-xl relative group transition-all",
              debt.status === 'paid' ? "bg-black/20 border-white/5 opacity-60" : "bg-[#161B22] border-slate-800 hover:border-emerald-500/50"
            )}
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  debt.type === 'debt' ? "bg-rose-400/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                )}>
                  {debt.type === 'debt' ? <AlertCircle className="w-6 h-6" /> : <Banknote className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{debt.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{debt.type === 'debt' ? 'Hutang' : 'Pinjaman'}</span>
                </div>
              </div>
              <button 
                onClick={() => toggleStatus(debt)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  debt.status === 'paid' ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-500 hover:text-white"
                )}
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-4xl font-black tracking-tighter text-white">Rp{debt.amount.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Calendar className="w-4 h-4" />
                Jatuh Tempo: {debt.dueDate ? format(debt.dueDate instanceof Timestamp ? debt.dueDate.toDate() : new Date(debt.dueDate), 'MMM dd, yyyy') : 'Tanpa tanggal jatuh tempo'}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex gap-2">
              <button 
                onClick={() => { setEditingDebt(debt); setIsModalOpen(true); }}
                className="flex-1 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors text-slate-400 hover:text-white"
              >
                Ubah
              </button>
              <button 
                onClick={async () => { if(debt.id && window.confirm('Hapus?')) { await deleteDoc(doc(db, 'debts', debt.id)); toast.success('Dihapus'); } }}
                className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsModalOpen(false); setEditingDebt(null); }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#161B22] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-8 pb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">{editingDebt ? 'Perbarui Entri' : 'Kewajiban Baru'}</h2>
                <button onClick={() => { setIsModalOpen(false); setEditingDebt(null); }} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Orang / Institusi</label>
                    <input type="text" name="name" defaultValue={editingDebt?.name} required className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 text-white" placeholder="misal: Bank ABC" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Jumlah (Rp)</label>
                      <input type="number" name="amount" defaultValue={editingDebt?.amount} required className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 text-white" placeholder="1000000" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tanggal Jatuh Tempo</label>
                      <input type="date" name="dueDate" defaultValue={editingDebt?.dueDate ? format(editingDebt.dueDate instanceof Timestamp ? editingDebt.dueDate.toDate() : new Date(editingDebt.dueDate), 'yyyy-MM-dd') : ''} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tipe</label>
                      <select name="type" defaultValue={editingDebt?.type || 'debt'} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none text-white">
                        <option value="debt">Hutang (Saya berhutang pada mereka)</option>
                        <option value="loan">Pinjaman (Mereka berhutang pada saya)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Status</label>
                      <select name="status" defaultValue={editingDebt?.status || 'unpaid'} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none text-white">
                        <option value="unpaid">Belum Dibayar</option>
                        <option value="paid">Sudah Dibayar</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:scale-105 transition-transform">
                  Simpan Entri
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
