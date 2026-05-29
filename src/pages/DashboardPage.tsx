import { formatRupiah } from '../utils/currency';
import React, { useEffect, useState } from 'react';
import { 
  ref, 
  onValue
} from 'firebase/database';
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
  CheckCircle2,
  Download,
  Upload
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
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getAIInsights } from '../services/aiService';
import { Transaction, EXPENSE_CATEGORIES } from '../types';
import { cn, OperationType, handleDatabaseError } from '../firebase/utils';
import FinancialHealthCard from '../components/FinancialHealthCard';

export default function DashboardPage() {
  const { user, transactions, setTransactions, insights, setInsights, debts, setDebts, goals, setGoals } = useStore();
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  useEffect(() => {
    if (!user) return;

    const tRef = ref(db, `transactions/${user.uid}`);
    const unsubscribeTxs = onValue(tRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const txs = Object.keys(data).map(key => ({ id: key, ...data[key] })) as Transaction[];
        
        txs.sort((a: any, b: any) => {
          const dateA = new Date(a.date).getTime() || 0;
          const dateB = new Date(b.date).getTime() || 0;
          return dateB - dateA;
        });
        
        setTransactions(txs);
      } else {
        setTransactions([]);
      }
    }, (error) => {
      handleDatabaseError(error, OperationType.LIST, 'transactions', false);
    });

    const dRef = ref(db, `debts/${user.uid}`);
    const unsubscribeDebts = onValue(dRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setDebts(items as any[]);
      } else {
        setDebts([]);
      }
    });

    const gRef = ref(db, `goals/${user.uid}`);
    const unsubscribeGoals = onValue(gRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setGoals(items as any[]);
      } else {
        setGoals([]);
      }
    });

    return () => {
      unsubscribeTxs();
      unsubscribeDebts();
      unsubscribeGoals();
    };
  }, [user, setTransactions, setDebts, setGoals]);

  const stats = {
    balance: transactions.reduce((acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount), 0),
    income: transactions
      .filter(tx => tx.type === 'income' && isWithinInterval(new Date(tx.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }))
      .reduce((acc, tx) => acc + tx.amount, 0),
    expense: transactions
      .filter(tx => tx.type === 'expense' && isWithinInterval(new Date(tx.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) }))
      .reduce((acc, tx) => acc + tx.amount, 0),
  };

  const totalTabungan = goals.reduce((acc, g) => acc + g.currentAmount, 0) + 
    transactions.filter(tx => tx.type === 'expense' && tx.category === 'Investasi' && isWithinInterval(new Date(tx.date), { start: startOfMonth(new Date()), end: endOfMonth(new Date()) })).reduce((acc, tx) => acc + tx.amount, 0);

  const totalUtang = debts.filter(d => d.status === 'unpaid').reduce((acc, d) => acc + d.amount, 0);

  const generateInsights = async () => {
    if (isGeneratingInsights) return;
    setIsGeneratingInsights(true);
    try {
      const newInsights = await getAIInsights(transactions.slice(0, 20), user);
      if (Array.isArray(newInsights) && newInsights.length > 0) {
        setInsights(newInsights);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Gagal menghasilkan insight AI');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const chartData = transactions
    .slice(0, 7)
    .reverse()
    .map(tx => ({
      name: format(new Date(tx.date), 'MMM dd'),
      amount: tx.amount,
      type: tx.type
    }));

  const pieData = EXPENSE_CATEGORIES.map(cat => ({
    name: cat,
    value: transactions
      .filter(tx => tx.type === 'expense' && tx.category === cat)
      .reduce((acc, tx) => acc + tx.amount, 0)
  })).filter(d => d.value > 0);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

  const monthlyCategoryExpenses = EXPENSE_CATEGORIES.map(cat => {
    const value = transactions
      .filter(tx => {
        if (tx.type !== 'expense' || tx.category !== cat) return false;
        const txDate = new Date(tx.date);
        return isWithinInterval(txDate, { start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
      })
      .reduce((acc, tx) => acc + tx.amount, 0);
    return { name: cat, value };
  }).filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">Dasbor</h1>
          <p className="text-xs sm:text-base text-gray-400 font-medium">Selamat datang kembali, {user?.displayName || 'Pengguna'}</p>
        </div>
        <Link 
          to="/transactions?add=true" 
          className="hidden sm:flex px-6 py-3 bg-[#10b981] text-white rounded-2xl font-semibold text-sm items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-[0_4px_20px_rgba(16,185,129,0.3)] w-fit"
        >
          <Plus className="w-5 h-5" />
          Tambah Transaksi
        </Link>
      </div>

      {/* Health Score Card (Full Width) */}
      <FinancialHealthCard 
        totalPendapatan={stats.income} 
        totalPengeluaran={stats.expense} 
        totalTabungan={totalTabungan} 
        totalUtang={totalUtang} 
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Saldo', value: stats.balance, icon: Wallet, color: 'text-white', iconColor: 'text-indigo-400', iconBg: 'bg-indigo-500/10', bgColor: 'bg-[#161B22]', borderColor: 'border-white/5' },
          { label: 'Pendapatan Bulanan', value: stats.income, icon: Download, color: 'text-emerald-400', iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/10', bgColor: 'bg-[#161B22]', borderColor: 'border-white/5' },
          { label: 'Pengeluaran Bulanan', value: stats.expense, icon: Upload, color: 'text-rose-400', iconColor: 'text-rose-400', iconBg: 'bg-rose-500/10', bgColor: 'bg-[#161B22]', borderColor: 'border-white/5' },
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -3 }}
            className={cn(
              "p-6 rounded-3xl border transition-all duration-300 flex flex-col",
              stat.bgColor,
              stat.borderColor,
            )}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={cn("p-3 rounded-xl", stat.iconBg)}>
                <stat.icon className={cn("w-6 h-6", stat.iconColor)} />
              </div>
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
            </div>
            
            <h3 className={cn("text-2xl sm:text-3xl font-bold tracking-tight mb-2 truncate", stat.color)}>
              {formatRupiah(stat.value)}
            </h3>
            
            <p className="text-emerald-500 text-xs font-bold mb-4">+4.5% dari bulan lalu</p>
            
            <div className="w-full bg-slate-800 h-1 mt-auto rounded-full overflow-hidden">
              <div 
                className={cn("h-full", idx === 0 ? "bg-indigo-500" : idx === 1 ? "bg-emerald-500" : "bg-rose-500")} 
                style={{ width: idx === 0 ? '100%' : idx === 1 ? '70%' : '40%' }} 
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-[#161B22] rounded-3xl border border-slate-800 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold text-white">Analisis Arus Kas</h4>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-800 text-xs rounded-full text-slate-300 font-bold  tracking-wider">7 Hari Terakhir</span>
              <span className="px-3 py-1 bg-emerald-500/20 text-xs rounded-full text-emerald-400 font-bold  tracking-wider">30 Hari Terakhir</span>
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
        <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] backdrop-blur-md shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-3xl p-6 flex flex-col relative overflow-hidden group">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expenses by Category */}
        <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] backdrop-blur-md shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-3xl p-5 md:p-8 h-[480px] flex flex-col">
          <h3 className="text-lg md:text-xl font-bold mb-6 text-white">Anggaran Kategori</h3>
          <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-6">
            {pieData.map((item, idx) => {
              const spentPercent = Math.min((item.value / 5000000) * 100, 100); // Mock target 5jt untuk konteks Rp
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400  font-bold tracking-wider">{item.name}</span>
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

        {/* Ringkasan Pengeluaran (Bulan Ini) - Scrollable List */}
        <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] backdrop-blur-md shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-3xl p-5 md:p-8 flex flex-col h-[480px]">
          <div className="mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white leading-normal">Ringkasan Pengeluaran</h3>
            <p className="text-xs text-slate-400 font-bold  tracking-wider mt-0.5">Bulan Ini ({format(new Date(), 'MMMM yyyy')})</p>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-lg rounded-2xl p-4 flex items-center justify-between mb-6">
            <span className="text-xs font-bold text-slate-400  tracking-wide">Total Pengeluaran</span>
            <span className="text-lg font-semibold text-rose-400">{formatRupiah(stats.expense)}</span>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-4">
            {monthlyCategoryExpenses.map((item, idx) => {
              const percentage = stats.expense > 0 ? (item.value / stats.expense) * 100 : 0;
              const color = COLORS[idx % COLORS.length];
              return (
                <div key={idx} className="group">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-white font-bold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-medium font-mono text-[11px]">{formatRupiah(item.value)}</span>
                      <span className="font-extrabold text-[11px]" style={{ color }}>{Math.round(percentage)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%`, backgroundColor: color }} 
                    />
                  </div>
                </div>
              );
            })}
            {monthlyCategoryExpenses.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center opacity-40">
                <p className="text-slate-500 italic text-sm">Tidak ada transaksi pengeluaran bulan ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] backdrop-blur-md shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-3xl p-5 md:p-8 h-[480px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg md:text-xl font-bold text-white">Transaksi Terakhir</h3>
            <Link to="/transactions" className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 group  tracking-wide">
              Lihat Semua
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar space-y-3">
            {transactions.slice(0, 5).map((tx, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-colors group">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-xs shrink-0 select-none",
                    tx.type === 'income' ? "bg-emerald-500/10 text-emerald-400" : tx.type === 'expense' ? "bg-rose-500/10 text-rose-400" : "bg-indigo-500/10 text-indigo-400"
                  )}>
                    {tx.category[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-white truncate leading-tight">{tx.description}</h4>
                    <p className="text-[11px] text-slate-500  font-semibold tracking-wider mt-0.5 truncate">{tx.category} • {format(new Date(tx.date), 'MMM dd')}</p>
                  </div>
                </div>
                <p className={cn(
                  "text-sm sm:text-md font-semibold tracking-tight shrink-0 pl-2",
                  tx.type === 'income' ? "text-emerald-400" : tx.type === 'expense' ? "text-rose-400" : "text-indigo-400"
                )}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatRupiah(tx.amount)}
                </p>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-slate-500 italic text-center py-20">Tidak ada transaksi.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
