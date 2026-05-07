import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Shield, Zap, BarChart3, Globe, LayoutDashboard, Database, Cpu } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-200 overflow-x-hidden selection:bg-emerald-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent opacity-30" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 max-w-7xl mx-auto px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <LayoutDashboard className="text-white w-7 h-7" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tracking-tighter leading-none">SF MONITOR</span>
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1">Intelligence</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Fitur</a>
          <a href="#security" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Keamanan</a>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Masuk</Link>
          <Link 
            to="/register" 
            className="px-8 py-3.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Dapatkan Akses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/50 border border-slate-800 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 backdrop-blur-xl"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sistem Aktif: Inti Keuangan 1.0
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-7xl md:text-[140px] font-black tracking-tighter leading-[0.8] mb-10 text-white"
        >
          KEUANGAN <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-white">MODERN.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-slate-500 max-w-2xl mb-16 font-bold leading-relaxed"
        >
          Definisikan ulang hubungan Anda dengan kekayaan. Rasakan antarmuka kelas profesional 
          untuk melacak aset, hutang, dan aspirasi dengan sintesis AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link 
            to="/register" 
            className="px-12 py-6 bg-white text-black text-xs font-black uppercase tracking-[.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl"
          >
            Mulai Sekarang
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            to="/login" 
            className="px-12 py-6 bg-slate-900/50 text-white border border-slate-800 text-xs font-black uppercase tracking-[.2em] rounded-2xl hover:bg-slate-800 transition-all backdrop-blur-xl"
          >
            Lanjutkan Sesi
          </Link>
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="md:col-span-2 p-12 rounded-[40px] bg-[#161B22] border border-slate-800 relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-500 border border-emerald-500/20">
                <Cpu className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-black text-white mb-4 tracking-tight">Inti Semantik AI</h3>
              <p className="text-xl text-slate-500 font-bold max-w-md">Mesin neural bertenaga Gemini yang menyintesis pola pengeluaran Anda menjadi kecerdasan yang dapat ditindaklanjukan.</p>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="p-12 rounded-[40px] bg-[#161B22] border border-slate-800 group"
          >
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-500 border border-emerald-500/20 transition-transform group-hover:scale-110">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Sinkronisasi Cloud</h3>
            <p className="text-lg text-slate-500 font-bold leading-snug">Arsitektur buku besar real-time terdistribusi yang dibangun di atas node berkinerja tinggi Firebase.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="p-12 rounded-[40px] bg-[#161B22] border border-slate-800 group"
          >
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-500 border border-emerald-500/20 transition-transform group-hover:scale-110">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Enkripsi</h3>
            <p className="text-lg text-slate-500 font-bold leading-snug">Protokol keamanan tingkat bank yang memastikan identitas keuangan Anda tetap pribadi.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="md:col-span-2 p-12 rounded-[40px] bg-[#161B22] border border-slate-800 relative overflow-hidden group"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 text-emerald-500 border border-emerald-500/20">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h3 className="text-4xl font-black text-white mb-4 tracking-tight">Analisis Visual</h3>
                <p className="text-xl text-slate-500 font-bold">Visualisasi data imersif yang dibangun dengan logika presisi menggunakan mesin Recharts.</p>
              </div>
              <div className="w-full md:w-1/3 aspect-square bg-slate-900 rounded-[32px] border border-slate-800 p-8 flex items-end justify-between gap-2 overflow-hidden">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 0.8 }}
                    className="flex-1 bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 py-16 mt-20 bg-[#0A0C10]">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="w-6 h-6 text-emerald-500" />
            <span className="text-sm font-black text-white uppercase tracking-[0.2em]">SF MONITOR SISTEM</span>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.1em]">© 2026 SmartFinance Collective. Professional Intelligence Deployment.</p>
          <div className="flex items-center gap-10">
            <a href="#" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Privasi</a>
            <a href="#" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Ketentuan</a>
            <Globe className="w-5 h-5 text-slate-500 hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
