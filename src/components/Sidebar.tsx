import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Target, 
  HandCoins, 
  LogOut,
  Sparkles,
  Languages
} from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { cn } from '../firebase/utils';

export default function Sidebar() {
  const location = useLocation();
  const { user, clearData, language, setLanguage } = useStore();

  const navItems = [
    { name: language === 'id' ? 'Dasbor' : 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: language === 'id' ? 'Transaksi' : 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: language === 'id' ? 'Anggaran' : 'Budgets', path: '/budget', icon: PieChart },
    { name: language === 'id' ? 'Target Tabungan' : 'Savings Goals', path: '/goals', icon: Target },
    { name: language === 'id' ? 'Hutang & Pinjaman' : 'Debts & Loans', path: '/debts', icon: HandCoins },
  ];

  const handleLogout = async () => {
    try {
      clearData();
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className="w-64 bg-[#0F1218] border-r border-emerald-900/20 flex flex-col h-screen fixed left-0 top-0 z-40">
      <div className="p-8">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SmartFinance</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
                  : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800/50 hover:shadow-[0_0_10px_rgba(16,185,129,0.05)]"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-slate-400 group-hover:text-emerald-300")} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto border-t border-slate-900 bg-[#0F1218]/90">
        
        {/* Language Toggle */}
        <div className="bg-slate-900/60 rounded-xl p-2 mb-2.5 flex overflow-hidden border border-white/5">
          <button 
            className={cn("flex-1 text-xs font-semibold py-1.5 transition-all text-center  tracking-wider rounded-lg", language === 'id' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300')}
            onClick={() => setLanguage('id')}
          >
            ID
          </button>
          <button 
            className={cn("flex-1 text-xs font-semibold py-1.5 transition-all text-center  tracking-wider rounded-lg", language === 'en' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300')}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
        </div>

        {/* Compact Wawasan AI */}
        <div className="bg-emerald-950/20 rounded-xl p-3 mb-2.5 border border-emerald-500/10">
          <p className="text-[11px] font-semibold text-emerald-500  tracking-wide mb-1 px-0.5">Wawasan AI</p>
          <p className="text-[11px] text-slate-300 italic leading-normal">
            "Setiap rupiah yang Anda tabung hari ini adalah langkah menuju kebebasan masa depan Anda."
          </p>
        </div>

        {/* Compact Profile Card */}
        <div className="bg-white/5 rounded-xl p-2.5 mb-2.5 border border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold text-xs shrink-0 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0] || user?.email?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight">{user?.displayName || 'User'}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Compact Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-rose-500/10 text-xs font-semibold  tracking-wider transition-all duration-300"
        >
          <LogOut className="w-4 h-4 text-slate-500 hover:text-red-400" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
