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
  Target, 
  TrendingUp, 
  Calendar,
  X,
  CreditCard,
  Gift,
  Home,
  Car,
  Plane,
  Briefcase,
  Trash2,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Goal } from '../types';
import { cn, OperationType, handleFirestoreError, withTimeout } from '../firebase/utils';

export default function GoalsPage() {
  const { user, goals, setGoals } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gSet = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Goal[];
      setGoals(gSet);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
    });
    return () => unsubscribe();
  }, [user, setGoals]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const goalData = {
        userId: user?.uid,
        name: formData.get('name') as string,
        targetAmount: Number(formData.get('targetAmount')),
        currentAmount: Number(formData.get('currentAmount')),
        deadline: formData.get('deadline') ? Timestamp.fromDate(new Date(formData.get('deadline') as string)) : null,
        updatedAt: serverTimestamp(),
      };

      if (editingGoal?.id) {
        updateDoc(doc(db, 'goals', editingGoal.id), goalData).catch(e => console.error("Update goal failed:", e));
        toast.success('Target diperbarui');
      } else {
        addDoc(collection(db, 'goals'), { ...goalData, createdAt: serverTimestamp() }).catch(e => console.error("Add goal failed:", e));
        toast.success('Target ditambahkan');
      }
      setIsModalOpen(false);
      setEditingGoal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'goals');
    } finally {
      setIsSaving(false);
    }
  };

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('rumah')) return Home;
    if (n.includes('mobil') || n.includes('kendaraan')) return Car;
    if (n.includes('liburan') || n.includes('travel') || n.includes('umroh')) return Plane;
    if (n.includes('bisnis') || n.includes('investasi')) return Briefcase;
    return Gift;
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">Target Tabungan</h1>
          <p className="text-xs sm:text-base text-slate-400 font-medium tracking-tight">Bermimpi besar. Menabung secara konsisten. Menangkan hidup.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3.5 bg-emerald-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_20px_rgba(16,185,129,0.3)] w-full sm:w-auto shrink-0"
        >
          <Plus className="w-5 h-5" />
          Tambah Target
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {goals.map((goal) => {
          const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const Icon = getIcon(goal.name);

          return (
            <motion.div
              layout
              key={goal.id}
              className="bg-[#161B22] border border-slate-800 rounded-3xl p-5 md:p-10 backdrop-blur-xl relative group overflow-hidden"
            >
              <div className="flex items-start justify-between mb-6 md:mb-10">
                <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                    <Icon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg md:text-2xl font-black text-white truncate leading-tight">{goal.name}</h3>
                    <p className="text-slate-500 font-black uppercase text-[9px] md:text-[10px] tracking-wider mt-1 truncate">
                      Target: Rp{goal.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button 
                    onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }}
                    title="Ubah Target"
                    className="p-2.5 md:p-3 bg-slate-800/50 rounded-xl md:rounded-2xl hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                  </button>
                  <button 
                    onClick={() => { 
                      if(goal.id) { 
                        deleteDoc(doc(db, 'goals', goal.id)).catch(e => console.error(e)); 
                        toast.success('Target dihapus'); 
                      } 
                    }}
                    title="Hapus Target"
                    className="p-2.5 md:p-3 bg-rose-500/10 rounded-xl md:rounded-2xl hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <span className="text-xl sm:text-3xl md:text-4xl font-black tracking-tighter text-white">Rp{goal.currentAmount.toLocaleString()}</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest border border-emerald-500/20 shrink-0">
                    {percent.toFixed(0)}% Tercapai
                  </span>
                </div>
                
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[9px] md:text-[10px] font-bold text-slate-500 tracking-wider uppercase gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    {goal.deadline ? format(goal.deadline instanceof Timestamp ? goal.deadline.toDate() : new Date(goal.deadline), 'MMMM dd, yyyy') : 'Tanpa Tenggat Waktu'}
                  </div>
                  <div className="text-emerald-400/80 font-black sm:text-right">
                    Rp{(goal.targetAmount - goal.currentAmount).toLocaleString()} lagi untuk mencapai target
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full group-hover:bg-emerald-500/10 transition-colors" />
            </motion.div>
          );
        })}
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
                <h2 className="text-2xl font-black text-white">{editingGoal ? 'Perbarui Target' : 'Target Tabungan Baru'}</h2>
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
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nama Target</label>
                    <input type="text" name="name" defaultValue={editingGoal?.name} disabled={isSaving} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white disabled:opacity-50" placeholder="misal: Mobil Listrik Baru" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Target (Rp)</label>
                      <input type="number" name="targetAmount" defaultValue={editingGoal?.targetAmount} disabled={isSaving} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white disabled:opacity-50" placeholder="50000000" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Saat Ini (Rp)</label>
                      <input type="number" name="currentAmount" defaultValue={editingGoal?.currentAmount} disabled={isSaving} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white disabled:opacity-50" placeholder="1000000" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tanggal Target</label>
                    <input type="date" name="deadline" defaultValue={editingGoal?.deadline ? format(editingGoal.deadline instanceof Timestamp ? editingGoal.deadline.toDate() : new Date(editingGoal.deadline), 'yyyy-MM-dd') : ''} disabled={isSaving} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white disabled:opacity-50" />
                  </div>
                </div>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? 'Memproses...' : (editingGoal ? 'Perbarui Target' : 'Mulai Menabung')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
