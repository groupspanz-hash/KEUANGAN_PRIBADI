import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  HeartPulse, ChevronRight, Info, AlertTriangle, CheckCircle2, 
  TrendingUp, Sparkles, Zap, TrendingDown, Wallet, CreditCard, PiggyBank,
  ArrowRight
} from 'lucide-react';
import { calculateFinancialHealth } from '../utils/financialHealth';
import { formatRupiah } from '../utils/currency';
import { cn } from '../firebase/utils';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { subMonths, format } from 'date-fns';
import { id } from 'date-fns/locale';

interface FinancialHealthCardProps {
  totalPendapatan: number;
  totalPengeluaran: number;
  totalTabungan: number;
  totalUtang: number;
}

const mockChartData = Array.from({ length: 6 }).map((_, i) => ({
  name: format(subMonths(new Date(), 5 - i), 'MMM', { locale: id }),
  score: 60 + Math.floor(Math.random() * 25)
}));

const formatRatio = (ratio: number) => {
  if (ratio > 999) return "999%+";
  if (ratio < 0) return "0%";
  return `${Math.round(ratio)}%`;
};

export default function FinancialHealthCard({
  totalPendapatan,
  totalPengeluaran,
  totalTabungan,
  totalUtang
}: FinancialHealthCardProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const rawHealth = calculateFinancialHealth(
    totalPendapatan,
    totalPengeluaran,
    totalTabungan,
    totalUtang
  );

  const isDataInsufficient = totalPendapatan <= 0;
  
  const health = isDataInsufficient ? {
    ...rawHealth,
    score: 0,
    status: 'Data Belum Cukup',
    color: 'slate',
    insights: ['Catat pendapatan Anda bulan ini agar skor finansial dapat dihitung.'],
    recommendations: ['Mulai dengan mencatat pemasukan pertama Anda.']
  } : rawHealth;

  useEffect(() => {
    let start = 0;
    const end = health.score;
    mockChartData[5].score = end || 0;
    
    if (start === end || isDataInsufficient) {
      setAnimatedScore(end);
      return;
    }
    
    let totalDuration = 1000;
    let incrementTime = (totalDuration / (end || 1));
    let timer = setInterval(() => {
      start += 1;
      setAnimatedScore(start);
      if (start >= end) {
        clearInterval(timer);
        setAnimatedScore(end);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [health.score, isDataInsufficient]);

  const getColorClass = (color: string) => {
    switch (color) {
      case 'rose': return 'text-rose-500';
      case 'amber': return 'text-amber-400';
      case 'emerald': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };
  
  const getStrokeColor = (color: string) => {
    switch (color) {
      case 'rose': return '#f43f5e';
      case 'amber': return '#fbbf24';
      case 'emerald': return '#34d399';
      default: return '#94a3b8';
    }
  };

  const circleLength = 283;
  const strokeDashoffset = isDataInsufficient 
    ? circleLength 
    : circleLength - (health.score / 100) * circleLength;
    
  const indicatorColorClass = getColorClass(health.color);

  return (
    <div className="w-full bg-[#161B22]/80 backdrop-blur-xl border border-white/5 rounded-[24px] p-4 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-10 relative overflow-hidden shadow-2xl">
      
      {/* Background Glow */}
      <div 
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ backgroundColor: getStrokeColor(health.color) }}
      />
      
      {/* LEFT SECTION (35%) */}
      <div className="w-full lg:w-[35%] flex flex-col relative z-10 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-white shadow-sm">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Skor Finansial</h2>
        </div>
        
        <p className="text-sm text-slate-400 mb-8 max-w-[280px]">
          {isDataInsufficient 
            ? "Kami membutuhkan data pendapatan untuk menghitung skor."
            : `Kondisi finansial Anda ${health.status.toLowerCase()}, pertahankan konsistensi!`
          }
        </p>

        {/* Circular Score */}
        <div className="relative w-48 h-48 lg:w-56 lg:h-56 flex items-center justify-center shrink-0 mx-auto">
          <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="6"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getStrokeColor(health.color)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circleLength}
              initial={{ strokeDashoffset: circleLength }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn(
                "drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]",
                health.color === 'emerald' && "drop-shadow-[0_0_16px_rgba(52,211,153,0.4)]",
                health.color === 'rose' && "drop-shadow-[0_0_16px_rgba(244,63,94,0.4)]",
                health.color === 'amber' && "drop-shadow-[0_0_16px_rgba(251,191,36,0.4)]"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl lg:text-7xl font-bold text-white tracking-tighter leading-none mb-1">
              {isDataInsufficient ? "-" : animatedScore}
            </span>
            <span className={cn("text-sm lg:text-base font-semibold tracking-wider", indicatorColorClass)}>
              {health.status}
            </span>
          </div>
        </div>

        {/* Mini Trend Chart */}
        {!isDataInsufficient && (
          <div className="mt-auto pt-8 flex flex-col h-32 w-full">
            <p className="text-xs text-slate-500 mb-3 font-medium">Tren 6 Bulan Terakhir</p>
            <div className="w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getStrokeColor(health.color)} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={getStrokeColor(health.color)} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" axisLine={false} tickLine={false} fontSize={10} tickMargin={8} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke={getStrokeColor(health.color)} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorScore)"
                    dot={{ r: 0 }} 
                    activeDot={{ r: 6, fill: '#fff', stroke: getStrokeColor(health.color), strokeWidth: 2 }} 
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* DIVIDER */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      <div className="block lg:hidden w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

      {/* RIGHT SECTION (65%) */}
      <div className="flex-1 flex flex-col relative z-10 w-full gap-6 lg:gap-8">
        
        {/* Top Row: Insight & Rekomendasi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Insight AI */}
          <div className="bg-[#1c222b]/50 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Insight AI</h3>
            </div>
            <div className="space-y-3">
              {health.insights.slice(0, 3).map((insight, idx) => {
                 let Icon = CheckCircle2;
                 let iconColor = "text-emerald-400";
                 if (insight.toLowerCase().includes('negatif') || insight.toLowerCase().includes('tinggi')) { 
                   Icon = AlertTriangle; iconColor = "text-amber-400"; 
                 }
                 if (insight.toLowerCase().includes('nol') || insight.toLowerCase().includes('belum')) { 
                   Icon = Info; iconColor = "text-blue-400"; 
                 }

                 return (
                   <div key={idx} className="flex gap-3 items-start group">
                     <Icon className={cn("w-4 h-4 shrink-0 mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity", iconColor)} />
                     <p className="text-sm text-slate-300 leading-snug">{insight}</p>
                   </div>
                 );
              })}
            </div>
          </div>

          {/* Rekomendasi AI */}
          <div className="bg-[#1c222b]/50 border border-white/5 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Rekomendasi Utama</h3>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {health.recommendations.slice(0, 2).map((rec, idx) => {
                 let Icon = Info;
                 if (rec.toLowerCase().includes('tabungan')) Icon = PiggyBank;
                 else if (rec.toLowerCase().includes('utang')) Icon = CreditCard;
                 else if (rec.toLowerCase().includes('pengeluaran')) Icon = Wallet;

                 return (
                   <div key={idx} className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 p-3 rounded-xl transition-all cursor-pointer group">
                     <div className="p-2 bg-white/5 rounded-lg shrink-0">
                       <Icon className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
                     </div>
                     <p className="text-[13px] text-white/90 leading-tight font-medium line-clamp-2 flex-1">{rec}</p>
                     <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                   </div>
                 );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Row: Breakdown Indikator */}
        <div>
          <h3 className="text-sm text-slate-400 font-medium mb-4">Breakdown Indikator</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            <HorizontalMetricCard 
              icon={PiggyBank}
              title="Tabungan" 
              value={formatRatio(health.savingRatio)}
              label={isDataInsufficient ? "-" : health.savingRatio >= 20 ? "Aman" : "Kurang"} 
              color={isDataInsufficient ? "slate" : health.savingRatio >= 20 ? "emerald" : "amber"} 
              progress={isDataInsufficient ? 0 : Math.min(100, health.savingRatio)} 
            />
            <HorizontalMetricCard 
              icon={Wallet}
              title="Belanja" 
              value={formatRatio(health.expenseRatio)}
              label={isDataInsufficient ? "-" : health.expenseRatio > 70 ? "Bahaya" : "Terkontrol"} 
              color={isDataInsufficient ? "slate" : health.expenseRatio > 70 ? "rose" : "emerald"}
              progress={isDataInsufficient ? 0 : Math.min(100, health.expenseRatio)} 
            />
            <HorizontalMetricCard 
              icon={CreditCard}
              title="Utang" 
              value={formatRatio(health.debtRatio)}
              label={isDataInsufficient ? "-" : health.debtRatio > 35 ? "Berisiko" : "Aman"} 
              color={isDataInsufficient ? "slate" : health.debtRatio > 35 ? "rose" : "emerald"}
              progress={isDataInsufficient ? 0 : Math.min(100, health.debtRatio)} 
            />
            <HorizontalMetricCard 
              icon={TrendingUp}
              title="Cashflow" 
              value={isDataInsufficient ? "-" : health.cashFlow > 0 ? `Surplus` : `Defisit`} 
              subValue={isDataInsufficient ? "" : formatRupiah(Math.abs(health.cashFlow))}
              label={isDataInsufficient ? "-" : health.cashFlow >= 0 ? "Aman" : "Perhatian"} 
              color={isDataInsufficient ? "slate" : health.cashFlow >= 0 ? "emerald" : "rose"}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function HorizontalMetricCard({ 
  icon: Icon, 
  title, 
  value, 
  subValue,
  label, 
  color, 
  progress 
}: { 
  icon: React.ElementType, 
  title: string, 
  value: string | number, 
  subValue?: string,
  label: string, 
  color: 'emerald' | 'rose' | 'amber' | 'slate', 
  progress?: number 
}) {
  const colorMap = {
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400', iconBg: 'bg-emerald-500/10' },
    rose: { text: 'text-rose-400', bg: 'bg-rose-400', iconBg: 'bg-rose-500/10' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-400', iconBg: 'bg-amber-500/10' },
    slate: { text: 'text-slate-400', bg: 'bg-slate-400', iconBg: 'bg-slate-500/10' },
  };

  const style = colorMap[color];

  return (
    <div className="bg-[#1c222b]/40 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:bg-[#1c222b]/80 transition-colors">
      <div className={cn("p-2.5 rounded-lg shrink-0", style.iconBg)}>
        <Icon className={cn("w-5 h-5", style.text)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-end mb-1.5">
          <p className="text-[13px] text-slate-400 font-medium">{title}</p>
          <div className="text-right">
            <span className={cn("text-base font-bold tracking-tight", style.text)}>
              {value}
            </span>
            {subValue && (
               <span className="block text-[10px] text-slate-500 -mt-1 truncate max-w-[80px]">{subValue}</span>
            )}
          </div>
        </div>

        {progress !== undefined ? (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                className={cn("h-full", style.bg)} 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className={cn("text-[10px] font-semibold w-12 text-right", style.text)}>{label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            <div className={cn("w-1.5 h-1.5 rounded-full", style.bg)} />
            <span className={cn("text-[10px] font-semibold", style.text)}>{label}</span>
          </div>
        )}
      </div>
    </div>
  )
}
