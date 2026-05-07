import { motion } from 'motion/react';
import { LayoutDashboard } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-[#0A0C10] flex flex-col items-center justify-center z-[100]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>
      
      <div className="relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)] mb-8"
        >
          <LayoutDashboard className="text-white w-10 h-10" />
        </motion.div>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute -inset-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h2 className="text-white font-black text-xs uppercase tracking-[0.3em] mb-2">System Initializing</h2>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest animate-pulse">Syncing Encrypted Ledger...</p>
      </motion.div>
    </div>
  );
}
