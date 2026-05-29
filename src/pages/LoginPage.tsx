import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { useStore } from '../store';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, LogIn, Chrome, LayoutDashboard, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const { user } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        toast.success('Login berhasil!');
        // Small delay to allow store update then navigate
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
        className="w-full max-w-md bg-gradient-to-b from-white/[0.05] to-transparent border border-white/[0.05] backdrop-blur-md shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-[40px] p-10 relative z-10 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <LayoutDashboard className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Smart Finance</h1>
          <p className="text-slate-500 font-bold  text-xs tracking-wide mt-2 text-center">Kecerdasan Keuangan Pribadi</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-6 bg-white text-black rounded-2xl font-semibold text-sm  tracking-wide hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl"
          >
            {loading ? (
              <span className="animate-pulse">Menghubungkan...</span>
            ) : (
              <>
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 font-sans text-xs text-black font-semibold border border-slate-200">G</div>
                Masuk dengan Google
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500 font-bold  tracking-wide leading-relaxed">
            Akses instan ke dashboard keuangan Anda<br />tanpa perlu kata sandi.
          </p>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block p-1 bg-slate-900 rounded-full border border-slate-800">
            <div className="px-4 py-2 bg-[#161B22] rounded-full">
              <p className="text-xs text-slate-400 font-semibold  tracking-wide">
                Aman & Privat
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
