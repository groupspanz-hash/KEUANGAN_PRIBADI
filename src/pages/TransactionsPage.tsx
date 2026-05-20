import React, { useState, useEffect } from 'react';
import { cn, OperationType, handleFirestoreError } from '../firebase/utils';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useStore } from '../store';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  FileText,
  Upload,
  Sparkles,
  Camera,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Transaction, CATEGORIES, PAYMENT_METHODS } from '../types';

const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Jumlah harus lebih besar dari 0'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Kategori harus diisi'),
  paymentMethod: z.string().min(1, 'Metode pembayaran harus diisi'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  date: z.string().min(1, 'Tanggal harus diisi'),
  debtId: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const { user, transactions, setTransactions, debts, setDebts } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  // AI Receipt scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category');

  // Load debts to connect with 'Pembayaran Hutang' category
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'debts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dSet = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setDebts(dSet);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'debts', false);
    });
    return () => unsubscribe();
  }, [user, setDebts]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
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

  const handleAIScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanFile(file);
    setIsScanning(true);
    setReceiptFile(file);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;

          const response = await fetch('/api/ai/scan-receipt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64Data }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Gagal memproses struk');
          }

          const result = await response.json();

          if (result.amount) {
            setValue('amount', Number(result.amount));
          }
          if (result.category) {
            setValue('category', result.category);
          }
          if (result.description) {
            setValue('description', result.description);
          }
          if (result.date) {
            setValue('date', result.date);
          }
          setValue('type', 'expense');

          toast.success('Struk berhasil dipindai oleh AI! Silakan cek kembali data di bawah.');
        } catch (error: any) {
          console.error("AI Scan processing error:", error);
          toast.error(error.message || 'Gagal memindai struk dengan AI');
        } finally {
          setIsScanning(false);
          setScanFile(null);
        }
      };
      reader.onerror = () => {
        toast.error('Gagal membaca file gambar');
        setIsScanning(false);
        setScanFile(null);
      };
    } catch (err) {
      console.error("Reader error:", err);
      toast.error('Gagal memproses file gambar');
      setIsScanning(false);
      setScanFile(null);
    }
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    
    let receiptUrl = editingTransaction?.receiptUrl || '';
    
    if (receiptFile) {
      setIsUploading(true);
      try {
        const fileRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${receiptFile.name}`);
        const snapshot = await uploadBytes(fileRef, receiptFile);
        receiptUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        toast.error('Gagal mengunggah kwitansi');
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const txData = {
      userId: user.uid,
      amount: data.amount,
      type: data.type,
      category: data.category,
      paymentMethod: data.paymentMethod,
      description: data.description,
      date: Timestamp.fromDate(new Date(data.date)),
      receiptUrl,
      debtId: data.category === 'Pembayaran Hutang' ? (data.debtId || '') : '',
      updatedAt: serverTimestamp(),
    };

    try {
      // 1. Revert previous debt association if editing an existing transaction
      if (editingTransaction?.id && editingTransaction.category === 'Pembayaran Hutang' && editingTransaction.debtId) {
        try {
          const oldDebtRef = doc(db, 'debts', editingTransaction.debtId);
          const oldDebtSnap = await getDoc(oldDebtRef);
          if (oldDebtSnap.exists()) {
            const oldDebtData = oldDebtSnap.data();
            const revertedAmount = (oldDebtData.amount || 0) + editingTransaction.amount;
            await updateDoc(oldDebtRef, {
              amount: revertedAmount,
              status: revertedAmount > 0 ? 'unpaid' : 'paid',
              updatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Failed to revert old debt payment:", e);
        }
      }

      // 2. Save / Update Transaction
      if (editingTransaction?.id) {
        await updateDoc(doc(db, 'transactions', editingTransaction.id), txData);
        toast.success('Transaksi diperbarui');
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...txData,
          createdAt: serverTimestamp(),
        });
        toast.success('Transaksi ditambahkan');
      }

      // 3. Set/apply new debt payment logic if category is 'Pembayaran Hutang' and debtId is chosen
      if (data.category === 'Pembayaran Hutang' && data.debtId) {
        const debtRef = doc(db, 'debts', data.debtId);
        const debtSnap = await getDoc(debtRef);
        if (debtSnap.exists()) {
          const debtData = debtSnap.data();
          const newAmount = Math.max(0, (debtData.amount || 0) - data.amount);
          await updateDoc(debtRef, {
            amount: newAmount,
            status: newAmount <= 0 ? 'paid' : 'unpaid',
            updatedAt: serverTimestamp()
          });
          toast.success(`Hutang berkurang sebesar Rp${data.amount.toLocaleString()}. Sisa: Rp${newAmount.toLocaleString()}`);
        }
      }

      handleCloseModal();
    } catch (error) {
      toast.error('Gagal menyimpan transaksi');
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setValue('amount', tx.amount);
    setValue('type', tx.type);
    setValue('category', tx.category);
    setValue('paymentMethod', tx.paymentMethod);
    setValue('description', tx.description);
    setValue('date', format(tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date), 'yyyy-MM-dd'));
    if (tx.debtId) {
      setValue('debtId', tx.debtId);
    } else {
      setValue('debtId', '');
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (tx: Transaction) => {
    if (!tx.id) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        // Revert debt reduction if applicable
        if (tx.category === 'Pembayaran Hutang' && tx.debtId) {
          try {
            const debtRef = doc(db, 'debts', tx.debtId);
            const debtSnap = await getDoc(debtRef);
            if (debtSnap.exists()) {
              const debtData = debtSnap.data();
              const revertedAmount = (debtData.amount || 0) + tx.amount;
              await updateDoc(debtRef, {
                amount: revertedAmount,
                status: revertedAmount > 0 ? 'unpaid' : 'paid',
                updatedAt: serverTimestamp()
              });
              toast.success(`Saldo Hutang dikembalikan sebesar Rp${tx.amount.toLocaleString()}`);
            }
          } catch (e) {
            console.error("Failed to restore debt balance on deletion:", e);
          }
        }

        await deleteDoc(doc(db, 'transactions', tx.id));
        toast.success('Transaksi dihapus');
      } catch (error) {
        toast.error('Hapus gagal');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setReceiptFile(null);
    setScanFile(null);
    setIsScanning(false);
    reset();
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Transaksi</h1>
          <p className="text-slate-400 font-medium">Jaga buku besar Anda tetap bersih dan aman.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-6 h-6" />
          Tambah Transaksi
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Cari berdasarkan deskripsi atau kategori..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-all font-medium text-white"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          {['semua', 'pendapatan', 'pengeluaran'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type === 'semua' ? 'all' : type === 'pendapatan' ? 'income' : 'expense')}
              className={cn(
                "flex-1 lg:flex-none px-6 py-4 rounded-2xl font-bold text-sm capitalize transition-all border",
                (filterType === 'all' && type === 'semua') || (filterType === 'income' && type === 'pendapatan') || (filterType === 'expense' && type === 'pengeluaran')
                  ? "bg-emerald-500 text-white border-transparent shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredTransactions.map((tx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={tx.id}
              className="bg-[#161B22] border border-slate-800 rounded-3xl p-6 group hover:border-emerald-500/30 transition-all backdrop-blur-sm"
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 transition-transform group-hover:scale-110",
                  tx.type === 'income' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {tx.category[0]}
                </div>
                
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold truncate text-white">{tx.description}</h3>
                    {tx.receiptUrl && (
                      <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors mx-auto md:mx-0">
                        <ImageIcon className="w-3 h-3" />
                        Kwitansi
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {tx.category}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(tx.date instanceof Timestamp ? tx.date.toDate() : new Date(tx.date), 'MMM dd, yyyy')}</span>
                    <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> {tx.paymentMethod}</span>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                  <p className={cn(
                    "text-2xl font-black tracking-tighter",
                    tx.type === 'income' ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {tx.type === 'income' ? '+' : '-'}Rp{tx.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(tx)}
                      className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(tx)}
                      className="p-3 bg-slate-800/50 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTransactions.length === 0 && (
          <div className="py-32 flex flex-col items-center text-center opacity-30 select-none">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Plus className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold">Transaksi tidak ditemukan</h3>
            <p className="mt-2 font-medium">Coba sesuaikan filter Anda atau tambahkan entri baru.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#161B22] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <h2 className="text-2xl font-black text-white">{editingTransaction ? 'Ubah Transaksi' : 'Transaksi Baru'}</h2>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* AI Instant Receipt Reader Block */}
                {!editingTransaction && (
                  <div className="bg-slate-950/40 border border-emerald-500/25 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white leading-normal">Pindai Nota / Struk dengan AI</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Unggah foto struk untuk mengisi otomatis seluruh formulir secara instan</p>
                        </div>
                      </div>
                      {isScanning && (
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-md animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Memproses
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAIScan}
                        disabled={isScanning}
                        id="ai-receipt-scan"
                        className="hidden"
                      />
                      <label
                        htmlFor="ai-receipt-scan"
                        className={cn(
                          "w-full border border-dashed rounded-xl py-3 px-4 flex items-center justify-center gap-2 cursor-pointer transition-all",
                          isScanning 
                            ? "bg-slate-900/50 border-slate-800 pointer-events-none opacity-50 text-slate-500" 
                            : "bg-slate-900 border-slate-800 hover:bg-slate-800/40 hover:border-emerald-500/40 text-slate-300 group"
                        )}
                      >
                        <Camera className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                        <span className="text-xs font-bold text-slate-300">
                          {scanFile ? scanFile.name : 'Pilih Foto Struk / Nota Toko'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {['expense', 'income'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue('type', type as any)}
                      className={cn(
                        "py-6 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all flex flex-col items-center gap-3",
                        selectedType === type
                          ? type === 'income' 
                            ? "bg-emerald-500 border-transparent text-white" 
                            : "bg-rose-500 border-transparent text-white"
                          : "bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700"
                      )}
                    >
                      {type === 'income' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                      {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </button>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Jumlah (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500 select-none">Rp</span>
                      <input
                        type="number"
                        step="1"
                        {...register('amount', { valueAsNumber: true })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors text-white font-bold"
                        placeholder="0"
                      />
                    </div>
                    {errors.amount && <p className="text-rose-400 text-xs font-bold">{errors.amount.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Tanggal</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="date"
                        {...register('date')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Kategori</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <select
                        {...register('category')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors appearance-none text-white font-medium"
                      >
                        <option value="" disabled className="bg-slate-900 text-white">Pilih Kategori</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Metode Pembayaran</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <select
                        {...register('paymentMethod')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors appearance-none text-white font-medium"
                      >
                        <option value="" disabled className="bg-slate-900 text-white">Pilih Metode</option>
                        {PAYMENT_METHODS.map(method => <option key={method} value={method === 'Cash' ? 'Tunai' : method} className="bg-slate-900 text-white">{method === 'Cash' ? 'Tunai' : method}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Connected Debt payment dropdown selection */}
                {selectedType === 'expense' && selectedCategory === 'Pembayaran Hutang' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 p-5 bg-slate-950/20 border border-emerald-500/25 rounded-2xl"
                  >
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-1">Hubungkan & Kurangi Sisa Hutang</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <select
                        {...register('debtId')}
                        className="w-full bg-slate-900 border border-emerald-500/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors appearance-none text-white font-bold"
                        required
                      >
                        <option value="" className="bg-slate-900 text-white">-- Pilih Akun Hutang --</option>
                        {debts.filter(d => d.status === 'unpaid').map(debt => (
                          <option key={debt.id} value={debt.id} className="bg-slate-900 text-white">
                            {debt.name} ({debt.type === 'debt' ? 'Hutang Anda' : 'Pinjaman'} - Sisa: Rp{debt.amount.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    {debts.filter(d => d.status === 'unpaid').length === 0 && (
                      <p className="text-rose-400 text-[10px] font-black uppercase tracking-wider mt-1 px-1">⚠️ Tidak ada akun hutang aktif yang belum lunas. Silakan buat akun hutang dulu di menu Hutang & Pinjaman.</p>
                    )}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Deskripsi</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      {...register('description')}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors text-white"
                      placeholder="Ngopi bersama teman..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Kwitansi (Opsional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label
                      htmlFor="receipt-upload"
                      className="w-full bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 hover:border-emerald-500/50 transition-all group"
                    >
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mb-2" />
                      <span className="text-sm font-bold text-slate-500 group-hover:text-white text-center">
                        {receiptFile ? receiptFile.name : 'Klik untuk mengunggah foto kwitansi'}
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {isSubmitting || isUploading ? 'Memproses...' : (editingTransaction ? 'Perbarui Transaksi' : 'Buat Transaksi')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
