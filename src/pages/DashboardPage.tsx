import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStore } from '../store';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  ChevronRight,
  BrainCircuit,
  AlertCircle,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { getAIInsights } from '../services/aiService';
import { Transaction, CATEGORIES } from '../types';
import { cn, OperationType, handleFirestoreError } from '../firebase/utils';

export default function DashboardPage() {
  const { user, transactions, setTransactions, insights, setInsights } = useStore();
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions', false);
    });

    return () => unsubscribe();
  }, [user, setTransactions]);

  const stats = {
    balance: transactions.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
    income: transactions
      .filter(tx => tx.type === 'income' && isWithinInterval(tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }))
      .reduce((acc, tx) => acc + tx.amount, 0),
    expense: transactions
      .filter(tx => tx.type === 'expense' && isWithinInterval(tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }))
      .reduce((acc, tx) => acc + tx.amount, 0),
  };

  const generateInsights = async () => {
    if (isGeneratingInsights) return;
    setIsGeneratingInsights(true);
    try {
      const newInsights = await getAIInsights(transactions.slice(0, 20), user);
      setInsights(newInsights);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const chartData = transactions
    .slice(0, 7)
    .reverse()
    .map(tx => ({
      name: format(tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date), 'MMM dd'),
      amount: tx.amount,
      type: tx.type
    }));

  const pieData = CATEGORIES.map(cat => ({
    name: cat,
    value: transactions
      .filter(tx => tx.type === 'expense' && tx.category === cat)
      .reduce((acc, tx) => acc + tx.amount, 0)
  })).filter(d => d.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Dasbor</h1>
          <p className="text-gray-400 font-medium">Selamat datang kembali, {user?.displayName || 'Pengguna'}</p>
        </div>
        <button className="px-6 py-3 bg-[#10b981] text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <Plus className="w-5 h-5" />
          Tambah Transaksi
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Saldo', value: stats.balance, icon: Wallet, color: 'text-white', bgColor: 'bg-[#161B22]', borderColor: 'border-slate-800' },
          { label: 'Pendapatan Bulanan', value: stats.income, icon: TrendingUp, color: 'text-emerald-400', bgColor: 'bg-[#161B22]', borderColor: 'border-slate-800' },
          { label: 'Pengeluaran Bulanan', value: stats.expense, icon: TrendingDown, color: 'text-rose-400', bgColor: 'bg-[#161B22]', borderColor: 'border-slate-800' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5 }}
            className={cn(
              "p-5 rounded-2xl border transition-colors",
              stat.bgColor,
              stat.borderColor
            )}
          >
            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
            <h3 className={cn("text-2xl font-bold mt-1", stat.color)}>
              Rp{stat.value.toLocaleString()}
            </h3>
            {idx === 0 && <p className="text-emerald-500 text-xs font-semibold mt-2">+4.5% vs bulan lalu</p>}
            {idx > 0 && (
              <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full", idx === 1 ? "bg-emerald-500" : "bg-rose-500")} 
                  style={{ width: idx === 1 ? '85%' : '25%' }} 
                />
              </div>
            )}
          </motion.div>
        ))}
        {/* Health Score Card */}
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-800 p-5 rounded-2xl border border-emerald-400/20"
        >
          <p className="text-emerald-100 text-sm font-medium">Skor Kesehatan</p>
          <div className="flex items-end gap-2 text-white">
            <h3 className="text-4xl font-black mt-1">84</h3>
            <span className="text-emerald-100/80 text-[10px] mb-1.5 uppercase tracking-widest font-bold">Luar Biasa</span>
          </div>
          <p className="text-emerald-100/70 text-[10px] mt-2 font-medium">Berdasarkan rasio tabungan & level hutang</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-[#161B22] rounded-3xl border border-slate-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold text-white">Analisis Arus Kas</h4>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-[10px] rounded-full text-slate-300 font-bold uppercase tracking-wider">7 Hari Terakhir</span>
              <span className="px-3 py-1 bg-emerald-500/20 text-[10px] rounded-full text-emerald-400 font-bold uppercase tracking-wider">30 Hari Terakhir</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis stroke="#ffffff40" axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `Rp${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-[#161B22] border border-slate-800 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BrainCircuit className="text-white w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Wawasan AI</h3>
            </div>
            <button 
              onClick={generateInsights}
              disabled={isGeneratingInsights}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 text-slate-400 hover:text-white"
            >
              <Plus className={cn("w-5 h-5", isGeneratingInsights ? "animate-spin" : "")} />
            </button>
          </div>

          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex gap-3"
                >
                  <div className="mt-1">
                    {insight.type === 'warning' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    {insight.type === 'tip' && <Lightbulb className="w-4 h-4 text-amber-400" />}
                    {insight.type === 'positive' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{insight.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed italic">"{insight.content}"</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center text-center opacity-30">
                <BrainCircuit className="w-12 h-12 mb-4" />
                <p className="text-xs font-medium">Klik + untuk menghasilkan <br /> kecerdasan finansial terbaru.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        <div className="bg-[#161B22] border border-slate-800 rounded-3xl p-8">
          <h3 className="text-xl font-bold mb-8 text-white">Anggaran Kategori</h3>
          <div className="space-y-6">
            {pieData.map((item, idx) => {
              const spentPercent = Math.min((item.value / 5000000) * 100, 100); // Mock target 5jt untuk konteks Rp
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400 uppercase font-bold tracking-wider">{item.name}</span>
                    <span className="font-bold" style={{ color }}>{Math.round(spentPercent)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${spentPercent}%`, backgroundColor: color }} 
                    />
                  </div>
                </div>
              );
            })}
            {pieData.length === 0 && <p className="text-slate-500 italic text-center py-20">Tidak ada data anggaran tersedia.</p>}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[#161B22] border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Transaksi Terakhir</h3>
            <button className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 group uppercase tracking-widest">
              Lihat Semua
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-110",
                    tx.type === 'income' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {tx.category[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{tx.description}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">{tx.category} • {format(tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date), 'MMM dd')}</p>
                  </div>
                </div>
                <p className={cn(
                  "text-lg font-black tracking-tighter",
                  tx.type === 'income' ? "text-emerald-400" : "text-rose-400"
                )}>
                  {tx.type === 'income' ? '+' : '-'}Rp{tx.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
