import { formatRupiah } from '../utils/currency';
import React, { useState, useEffect } from 'react';
import { 
  ref, 
  onValue, 
  push, 
  set, 
  remove, 
  serverTimestamp
} from 'firebase/database';
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
import { cn, OperationType, handleDatabaseError, withTimeout } from '../firebase/utils';

export default function DebtsPage() {
  const { user, debts, setDebts } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const dRef = ref(db, `debts/${user.uid}`);
    const unsubscribe = onValue(dRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dSet = Object.keys(data).map(key => ({ id: key, ...data[key] })) as Debt[];
        setDebts(dSet);
      } else {
        setDebts([]);
      }
    }, (error) => {
      handleDatabaseError(error, OperationType.LIST, 'debts');
    });
    return () => unsubscribe();
  }, [user, setDebts]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setIsModalOpen(false); // Optimistic UI: close immediately
    setIsSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const dueDateVal = formData.get('dueDate') as string;
      const dueDate = (dueDateVal && dueDateVal.trim() !== '') ? new Date(dueDateVal + 'T00:00:00').getTime() : null;

      const debtData = {
        userId: user.uid,
        name: formData.get('name') as string,
        amount: Number(formData.get('amount')),
        type: formData.get('type') as 'debt' | 'loan',
        status: formData.get('status') as 'unpaid' | 'paid',
        dueDate,
        updatedAt: serverTimestamp(),
      };

      const isEditing = !!editingDebt?.id;
      let debtPromise;
      if (isEditing) {
        debtPromise = set(ref(db, `debts/${user.uid}/${editingDebt!.id}`), { ...editingDebt, ...debtData });
      } else {
        const newRef = push(ref(db, `debts/${user.uid}`));
        debtPromise = set(newRef, { ...debtData, createdAt: serverTimestamp(), id: newRef.key });
      }
        
      setEditingDebt(null); // Clear state

      await withTimeout(debtPromise);
      toast.success(isEditing ? 'Informasi diperbarui' : 'Hutang/Pinjaman dicatat');
    } catch (error) {
      handleDatabaseError(error, OperationType.WRITE, 'debts', false);
      toast.error('Gagal menyimpan catatan hutang/pinjaman. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (debt: Debt) => {
    if (!debt.id || !user?.uid) return;
    const newStatus = debt.status === 'paid' ? 'unpaid' : 'paid';
    try {
      await withTimeout(set(ref(db, `debts/${user.uid}/${debt.id}/status`), newStatus));
      await withTimeout(set(ref(db, `debts/${user.uid}/${debt.id}/updatedAt`), serverTimestamp()));
      toast.success(`Ditandai sebagai ${newStatus === 'paid' ? 'sudah dibayar' : 'belum dibayar'}`);
    } catch (error) {
      handleDatabaseError(error, OperationType.UPDATE, 'debts');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Hutang & Pinjaman</h1>
          <p className="text-slate-400 font-medium tracking-tight">Kelola kewajiban Anda dengan transparansi.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]"
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
                  <span className="text-xs font-semibold  tracking-wide text-slate-500">{debt.type === 'debt' ? 'Hutang' : 'Pinjaman'}</span>
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
              <p className="text-4xl font-semibold tracking-tighter text-white">{formatRupiah(debt.amount)}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500  tracking-wide">
                <Calendar className="w-4 h-4" />
                Jatuh Tempo: {debt.dueDate ? format(new Date(debt.dueDate), 'MMM dd, yyyy') : 'Tanpa tanggal jatuh tempo'}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 flex gap-2">
              <button 
                onClick={() => { setEditingDebt(debt); setIsModalOpen(true); }}
                className="flex-1 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-xs font-semibold  tracking-wide transition-colors text-slate-400 hover:text-white"
              >
                Ubah
              </button>
              <button 
                onClick={async () => { if(debt.id && user?.uid) { try { await withTimeout(remove(ref(db, `debts/${user.uid}/${debt.id}`))); toast.success('Dihapus'); } catch(error) { handleDatabaseError(error, OperationType.DELETE, 'debts'); } } }}
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
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => { if (!isSaving) { setIsModalOpen(false); setEditingDebt(null); } }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="relative w-full max-w-lg bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] backdrop-blur-md shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 pb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white">{editingDebt ? 'Perbarui Entri' : 'Kewajiban Baru'}</h2>
                <button 
                  onClick={() => { if (!isSaving) { setIsModalOpen(false); setEditingDebt(null); } }} 
                  disabled={isSaving}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500  tracking-wide px-1">Orang / Institusi</label>
                    <input 
                      type="text" 
                      name="name" 
                      defaultValue={editingDebt?.name} 
                      required 
                      disabled={isSaving}
                      className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 shadow-inner rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 text-white disabled:opacity-50" 
                      placeholder="misal: Bank ABC" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500  tracking-wide px-1">Jumlah (Rp)</label>
                      <input 
                        type="number" 
                        name="amount" 
                        defaultValue={editingDebt?.amount} 
                        required 
                        disabled={isSaving}
                        className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 shadow-inner rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 text-white disabled:opacity-50" 
                        placeholder="1000000" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500  tracking-wide px-1">Tanggal Jatuh Tempo</label>
                      <input 
                        type="date" 
                        name="dueDate" 
                        defaultValue={editingDebt?.dueDate ? format(new Date(editingDebt.dueDate), 'yyyy-MM-dd') : ''} 
                        disabled={isSaving}
                        className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 shadow-inner rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 text-white disabled:opacity-50" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500  tracking-wide px-1">Tipe</label>
                      <select 
                        name="type" 
                        defaultValue={editingDebt?.type || 'debt'} 
                        disabled={isSaving}
                        className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 shadow-inner rounded-2xl py-4 px-4 focus:outline-none text-white disabled:opacity-50"
                      >
                        <option value="debt">Hutang (Saya berhutang pada mereka)</option>
                        <option value="loan">Pinjaman (Mereka berhutang pada saya)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500  tracking-wide px-1">Status</label>
                      <select 
                        name="status" 
                        defaultValue={editingDebt?.status || 'unpaid'} 
                        disabled={isSaving}
                        className="w-full bg-black/20 border border-white/10 focus:border-emerald-500/50 focus:bg-black/40 shadow-inner rounded-2xl py-4 px-4 focus:outline-none text-white disabled:opacity-50"
                      >
                        <option value="unpaid">Belum Dibayar</option>
                        <option value="paid">Sudah Dibayar</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-semibold text-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {isSaving ? 'Memproses...' : 'Simpan Entri'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
