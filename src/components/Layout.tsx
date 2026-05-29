import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Target, 
  HandCoins, 
  LogOut, 
  Sparkles, 
  X, 
  Plus,
  User,
  Quote
} from 'lucide-react';
import { useStore } from '../store';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { cn } from '../firebase/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearData } = useStore();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = async () => {
    try {
      clearData();
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navItems = [
    { name: 'Dasbor', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Anggaran', path: '/budget', icon: PieChart },
    { name: 'Target', path: '/goals', icon: Target },
    { name: 'Hutang', path: '/debts', icon: HandCoins },
  ];

  return (
    <div className="flex min-h-screen bg-transparent text-slate-200 font-sans overflow-x-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sticky Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0A0C10]/80 backdrop-blur-md border-b border-slate-900 z-30 flex items-center justify-between px-4 md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Sparkles className="text-white w-4.5 h-4.5" />
          </div>
          <span className="text-md font-extrabold text-white tracking-tight">SmartFinance</span>
        </Link>

        {/* Profile Avatar Trigger */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="w-10 h-10 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center p-0.5 overflow-hidden active:scale-95 transition-transform"
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-emerald-400">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </span>
          )}
        </button>
      </header>

      {/* Mobile Slide-out Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Drawer Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-[#0F1218] border-l border-slate-900 p-6 z-50 flex flex-col justify-between md:hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="text-sm font-semibold text-slate-400  tracking-wide">Akun & Sesi</span>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 bg-slate-900 rounded-xl hover:bg-slate-800 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile detail cards */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-extrabold overflow-hidden">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      user?.displayName?.[0] || user?.email?.[0] || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-bold truncate leading-tight">{user?.displayName || 'Pengguna'}</h4>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>

                {/* AI Quote for finance motivation */}
                <div className="bg-emerald-950/20 rounded-2xl p-5 border border-emerald-500/10 mb-6 flex gap-3">
                  <Quote className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <h5 className="text-xs font-semibold text-emerald-500  tracking-wide mb-1.5">Wawasan AI</h5>
                    <p className="text-xs text-slate-300 italic leading-relaxed">
                      "Setiap rupiah yang disimpan dengan penuh kesadaran adalah jembatan menuju ketenangan hidup."
                    </p>
                  </div>
                </div>
              </div>

              {/* Drawer Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:bg-rose-500 hover:text-white font-bold transition-all"
              >
                <LogOut className="w-5 h-5" />
                Masuk / Keluar Sesi
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) on Mobile */}
      <Link 
        to="/transactions?add=true"
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_4px_24px_rgba(16,185,129,0.5)] active:scale-90 transition-transform md:hidden"
        title="Tambah Transaksi"
      >
        <Plus className="w-7 h-7" />
      </Link>

      {/* Mobile Animated Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#0A0C10]/95 backdrop-blur-lg border-t border-slate-900 z-30 flex items-center justify-around px-2 pb-safe md:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-14 h-full relative group"
            >
              {/* Active Backplate soft glow */}
              {isActive && (
                <motion.div 
                  layoutId="bottomNavGlow"
                  className="absolute inset-x-1 top-1 bottom-1 bg-emerald-500/5 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              {/* Active Tab Dot Accent */}
              {isActive && (
                <span className="absolute top-0 w-4 h-1 bg-emerald-500 rounded-b-full" />
              )}

              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-200", 
                isActive 
                  ? "text-emerald-400 scale-110" 
                  : "text-slate-500 group-hover:text-slate-300"
              )} />
              
              <span className={cn(
                "text-[11px] font-bold mt-1 tracking-tight truncate max-w-full",
                isActive 
                  ? "text-emerald-400" 
                  : "text-slate-500"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Pane */}
      <main className="flex-1 ml-0 md:ml-64 p-4 pt-20 pb-28 md:p-8 overflow-y-auto w-full transition-all">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
