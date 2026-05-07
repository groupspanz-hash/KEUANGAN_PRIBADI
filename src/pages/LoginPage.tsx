import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, LogIn, Chrome, LayoutDashboard, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Selamat datang kembali!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0C10] p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#161B22] border border-slate-800 rounded-[40px] p-10 relative z-10 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <LayoutDashboard className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Smart Finance</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Kecerdasan Keuangan Pribadi</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all font-medium text-white"
                placeholder="nama@perusahaan.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all font-medium text-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-8"
          >
            {loading ? 'Mengautentikasi...' : 'Masuk'}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">
            <span className="bg-[#161B22] px-4">Atau lanjutkan dengan</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-5 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-700 transition-colors flex items-center justify-center gap-4"
        >
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 font-sans text-[10px] text-black font-black">G</div>
          Google Intelligence
        </button>

        <p className="mt-10 text-center text-slate-500 font-bold text-xs uppercase tracking-widest">
          Belum punya akun?{' '}
          <Link to="/register" className="text-emerald-400 hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
