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
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Goal } from '../types';
import { cn } from '../firebase/utils';

export default function GoalsPage() {
  const { user, goals, setGoals } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

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
    const formData = new FormData(e.currentTarget);
    const goalData = {
      userId: user?.uid,
      name: formData.get('name') as string,
      targetAmount: Number(formData.get('targetAmount')),
      currentAmount: Number(formData.get('currentAmount')),
      deadline: formData.get('deadline') ? Timestamp.fromDate(new Date(formData.get('deadline') as string)) : null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingGoal?.id) {
        await updateDoc(doc(db, 'goals', editingGoal.id), goalData);
        toast.success('Goal updated');
      } else {
        await addDoc(collection(db, 'goals'), { ...goalData, createdAt: serverTimestamp() });
        toast.success('Goal added');
      }
      setIsModalOpen(false);
      setEditingGoal(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'goals');
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
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Savings Goals</h1>
          <p className="text-slate-400 font-medium tracking-tight">Dream big. Save consistently. Win life.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-6 h-6" />
          Add Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goals.map((goal) => {
          const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const Icon = getIcon(goal.name);

          return (
            <motion.div
              layout
              key={goal.id}
              className="bg-[#161B22] border border-slate-800 rounded-[40px] p-10 backdrop-blur-xl relative group overflow-hidden"
            >
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{goal.name}</h3>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                      Target: ${goal.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditingGoal(goal); setIsModalOpen(true); }}
                  className="p-3 bg-slate-800/50 rounded-2xl hover:bg-slate-800 transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black tracking-tighter text-white">${goal.currentAmount.toLocaleString()}</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                    {percent.toFixed(0)}% Achieved
                  </span>
                </div>
                
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 tracking-widest uppercase outline-none">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {goal.deadline ? format(goal.deadline instanceof Timestamp ? goal.deadline.toDate() : new Date(goal.deadline), 'MMMM dd, yyyy') : 'No Deadline'}
                  </div>
                  <div className="text-emerald-400/80 font-black">
                    ${(goal.targetAmount - goal.currentAmount).toLocaleString()} left to go
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#161B22] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="p-8 pb-4 flex items-center justify-between">
                <h2 className="text-2xl font-black text-white">{editingGoal ? 'Update Goal' : 'New Savings Goal'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Goal Name</label>
                    <input type="text" name="name" defaultValue={editingGoal?.name} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white" placeholder="e.g. New Electric Car" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Target ($)</label>
                      <input type="number" name="targetAmount" defaultValue={editingGoal?.targetAmount} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white" placeholder="50000" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Current ($)</label>
                      <input type="number" name="currentAmount" defaultValue={editingGoal?.currentAmount} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white" placeholder="1000" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Target Date</label>
                    <input type="date" name="deadline" defaultValue={editingGoal?.deadline ? format(editingGoal.deadline instanceof Timestamp ? editingGoal.deadline.toDate() : new Date(editingGoal.deadline), 'yyyy-MM-dd') : ''} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-4 focus:outline-none focus:border-emerald-500 transition-colors text-white" />
                  </div>
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  {editingGoal ? 'Update Goal' : 'Start Saving'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
