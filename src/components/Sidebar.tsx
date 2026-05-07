import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Target, 
  HandCoins, 
  LogOut,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { cn } from '../firebase/utils';

const navItems = [
  { name: 'Dasbor', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Anggaran', path: '/budget', icon: PieChart },
  { name: 'Target Tabungan', path: '/goals', icon: Target },
  { name: 'Hutang & Pinjaman', path: '/debts', icon: HandCoins },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useStore();

  const handleLogout = async () => {
    try {
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white")} />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-emerald-950/20 rounded-2xl p-4 mb-4 border border-emerald-500/10">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 px-1">Wawasan AI</p>
          <p className="text-sm text-slate-300 italic leading-relaxed">"Setiap rupiah yang Anda tabung hari ini adalah langkah menuju kebebasan masa depan Anda."</p>
        </div>

        <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold ring-2 ring-white/10 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0] || user?.email?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </aside>
  );
}
