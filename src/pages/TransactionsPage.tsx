import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn, OperationType, handleDatabaseError, withTimeout } from '../firebase/utils';
import { 
  ref, 
  onValue, 
  push, 
  set, 
  remove, 
  get,
  serverTimestamp
} from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { Transaction, CATEGORIES, INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../types';

const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Jumlah harus lebih besar dari 0'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Kategori harus diisi'),
  paymentMethod: z.string().min(1, 'Metode pembayaran harus diisi'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  date: z.string().min(1, 'Tanggal harus diisi'),
  debtId: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['monthly', 'weekly', 'yearly']).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const { user, transactions, setTransactions, debts, setDebts } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setIsModalOpen(true);
      navigate('/transactions', { replace: true });
    }
  }, [location.search, navigate]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      category: '',
      paymentMethod: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isRecurring: false,
      recurringInterval: 'monthly'
    }
  });

  const onFormError = (errors: any) => {
    Object.keys(errors).forEach((key) => {
      const err = errors[key as keyof typeof errors];
      if (err?.message) {
        toast.error(err.message);
      }
    });
  };

  const selectedType = watch('type');
  const selectedCategory = watch('category');

  // Load debts to connect with 'Pembayaran Hutang' category
  useEffect(() => {
    if (!user) return;
    const dRef = ref(db, `debts/${user.uid}`);
    const unsubscribe = onValue(dRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const dSet = Object.keys(data).map(key => ({ id: key, ...data[key] })) as any[];
        setDebts(dSet);
      } else {
        setDebts([]);
      }
    }, (error) => {
      handleDatabaseError(error, OperationType.LIST, 'debts', false);
    });
    return () => unsubscribe();
  }, [user, setDebts]);

  useEffect(() => {
    if (!user) return;

    const tRef = ref(db, `transactions/${user.uid}`);
    const unsubscribe = onValue(tRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const txs = Object.keys(data).map(key => ({ id: key, ...data[key] })) as Transaction[];
        
        // Sort manually
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

    return () => unsubscribe();
  }, [user, setTransactions]);



  const onSubmit = async (data: TransactionFormData) => {
    if (!user) return;
    
    if (data.category === 'Pembayaran Hutang' && !data.debtId) {
      toast.error('Silakan hubungkan dengan akun hutang yang ingin dikurangi/ditambah');
      return;
    }

    const currentEditingTx = editingTransaction;
    const currentReceiptFile = receiptFile;
    
    if (!currentReceiptFile) {
      handleCloseModal(); // Optimistic UI: close immediately and reset form if no upload
    } else {
      // If there's an image, keep modal open to show uploading state, to prevent background navigation issues
    }

    setIsSaving(true);
    try {
      let receiptUrl = currentEditingTx?.receiptUrl || '';
      
      if (currentReceiptFile) {
        setIsUploading(true);
        try {
          const fileRef = storageRef(storage, `receipts/${user.uid}/${Date.now()}_${currentReceiptFile.name}`);
          const snapshot = await withTimeout(uploadBytes(fileRef, currentReceiptFile), 15000, 'Gagal mengunggah gambar. Waktu terlampaui.');
          receiptUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          throw new Error('Gagal mengunggah kwitansi');
        } finally {
          setIsUploading(false);
        }
      }

      const parsedDate = new Date(data.date + 'T00:00:00');
      const finalDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      const txData: any = {
        userId: user.uid,
        amount: data.amount,
        type: data.type,
        category: data.category,
        paymentMethod: data.paymentMethod,
        description: data.description,
        date: finalDate.getTime(),
        receiptUrl,
        debtId: data.category === 'Pembayaran Hutang' ? (data.debtId || '') : '',
        updatedAt: serverTimestamp(),
      };
      
      if (data.isRecurring) {
        txData.isRecurring = true;
        txData.recurringInterval = data.recurringInterval;
      } else {
        txData.isRecurring = false;
        txData.recurringInterval = null;
      }

      // 1. Revert previous debt association if editing an existing transaction
      if (currentEditingTx?.id && currentEditingTx.category === 'Pembayaran Hutang' && currentEditingTx.debtId) {
        try {
          const oldDebtRef = ref(db, `debts/${user.uid}/${currentEditingTx.debtId}`);
          const oldDebtSnap = await get(oldDebtRef);
          if (oldDebtSnap.exists()) {
            const oldDebtData = oldDebtSnap.val();
            const revertedAmount = (oldDebtData.amount || 0) + currentEditingTx.amount;
            set(oldDebtRef, {
              ...oldDebtData,
              amount: revertedAmount,
              status: revertedAmount > 0 ? 'unpaid' : 'paid',
              updatedAt: serverTimestamp()
            }).catch(console.error);
          }
        } catch (e) {
          console.error("Failed to revert old debt payment:", e);
        }
      }

      // 2. Save / Update Transaction
      if (currentEditingTx?.id) {
        set(ref(db, `transactions/${user.uid}/${currentEditingTx.id}`), { ...currentEditingTx, ...txData }).catch(e => {
          console.error('Update failed', e);
        });
        toast.success('Transaksi diperbarui');
      } else {
        const newRef = push(ref(db, `transactions/${user.uid}`));
        set(newRef, {
          ...txData,
          id: newRef.key,
          createdAt: serverTimestamp(),
        }).catch(e => console.error('Add failed', e));
        toast.success('Transaksi ditambahkan');
      }

      // 3. Set/apply new debt payment logic if category is 'Pembayaran Hutang' and debtId is chosen
      if (data.category === 'Pembayaran Hutang' && data.debtId) {
        const debtRef = ref(db, `debts/${user.uid}/${data.debtId}`);
        const debtToUpdate = debts.find((d: any) => d.id === data.debtId);
        if (debtToUpdate) {
          const newAmount = Math.max(0, (debtToUpdate.amount || 0) - data.amount);
          set(debtRef, {
            ...debtToUpdate,
            amount: newAmount,
            status: newAmount <= 0 ? 'paid' : 'unpaid',
            updatedAt: serverTimestamp()
          }).catch(console.error);
          toast.success(`Hutang berkurang sebesar Rp${data.amount.toLocaleString()}. Sisa: Rp${newAmount.toLocaleString()}`);
        }
      }

      setIsSaving(false);
      if (currentReceiptFile) {
        handleCloseModal(); // If it was kept open for upload, close it now
      }
    } catch (error: any) {
      console.error("Submit transaction error:", error);
      toast.error('Gagal menyimpan transaksi: ' + (error?.message || error));
      setIsSaving(false);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setValue('amount', tx.amount);
    setValue('type', tx.type);
    setValue('category', tx.category);
    setValue('paymentMethod', tx.paymentMethod);
    setValue('description', tx.description);
    setValue('date', format(new Date(tx.date), 'yyyy-MM-dd'));
    if (tx.debtId) {
      setValue('debtId', tx.debtId);
    } else {
      setValue('debtId', '');
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (tx: Transaction) => {
    if (!tx.id || !user?.uid) return;
    try {
      // Revert debt reduction if applicable
        if (tx.category === 'Pembayaran Hutang' && tx.debtId) {
          try {
            const debtRef = ref(db, `debts/${user.uid}/${tx.debtId}`);
            const debtSnap = await get(debtRef);
            if (debtSnap.exists()) {
              const debtData = debtSnap.val();
              const revertedAmount = (debtData.amount || 0) + tx.amount;
              await withTimeout(set(debtRef, {
                ...debtData,
                amount: revertedAmount,
                status: revertedAmount > 0 ? 'unpaid' : 'paid',
                updatedAt: serverTimestamp()
              }));
              toast.success(`Saldo Hutang dikembalikan sebesar Rp${tx.amount.toLocaleString()}`);
            }
          } catch (e) {
            console.error("Failed to restore debt balance on deletion:", e);
          }
        }

        await withTimeout(remove(ref(db, `transactions/${user.uid}/${tx.id}`)));
        toast.success('Transaksi dihapus');
      } catch (error) {
        toast.error('Hapus gagal');
      }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setReceiptFile(null);
    try {
      reset({
        type: 'expense',
        category: '',
        paymentMethod: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: undefined,
        debtId: ''
      });
    } catch (e) {
      console.error("Resetting form fields failed:", e);
    }
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
                    {tx.isRecurring && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-blue-500/10 px-2 py-1 rounded-md text-blue-400 mx-auto md:mx-0">
                        <RefreshCw className="w-3 h-3" />
                        Berulang
                      </span>
                    )}
                    {tx.receiptUrl && (
                      <a href={tx.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors mx-auto md:mx-0">
                        <ImageIcon className="w-3 h-3" />
                        Kwitansi
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {tx.category}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(tx.date), 'MMM dd, yyyy')}</span>
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
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

              <form onSubmit={handleSubmit(onSubmit, onFormError)} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
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
                        {(selectedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>)}
                      </select>
                    </div>
                    {errors.category && <p className="text-rose-400 text-xs font-bold mt-1 px-1">{errors.category.message}</p>}
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
                    {errors.paymentMethod && <p className="text-rose-400 text-xs font-bold mt-1 px-1">{errors.paymentMethod.message}</p>}
                  </div>
                </div>

                {/* Connected Debt payment dropdown selection */}
                {selectedCategory === 'Pembayaran Hutang' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2 p-5 bg-slate-950/20 border border-emerald-500/25 rounded-2xl"
                  >
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-1">Hubungkan & Sesuaikan Sisa Hutang</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                      <select
                        {...register('debtId')}
                        className="w-full bg-slate-900 border border-emerald-500/20 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500 transition-colors appearance-none text-white font-bold"
                        required
                      >
                        <option value="" className="bg-slate-900 text-white">-- Pilih Akun Hutang --</option>
                        {debts.filter(d => d.status === 'unpaid' || d.id === editingTransaction?.debtId).map(debt => (
                          <option key={debt.id} value={debt.id} className="bg-slate-900 text-white">
                             {debt.name} ({debt.type === 'debt' ? 'Hutang Anda' : 'Pinjaman'} - Sisa: Rp{debt.amount.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    {debts.filter(d => d.status === 'unpaid' || d.id === editingTransaction?.debtId).length === 0 && (
                      <p className="text-rose-400 text-[10px] font-black uppercase tracking-wider mt-1 px-1">⚠️ Tidak ada akun hutang aktif yang belum lunas. Silakan buat akun hutang dulu di menu Hutang & Pinjaman.</p>
                    )}
                  </motion.div>
                )}

                <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('isRecurring')}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-sm font-bold text-white">Transaksi Berulang (Otomatis)</span>
                  </label>
                  
                  {watch('isRecurring') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 border-t border-slate-800"
                    >
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 block mb-2">Interval Pengulangan</label>
                      <select
                        {...register('recurringInterval')}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 transition-colors appearance-none text-white text-sm"
                      >
                        <option value="weekly">Mingguan</option>
                        <option value="monthly">Bulanan</option>
                        <option value="yearly">Tahunan</option>
                      </select>
                    </motion.div>
                  )}
                </div>

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
                  {errors.description && <p className="text-rose-400 text-xs font-bold mt-1 px-1">{errors.description.message}</p>}
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
                  disabled={isSaving || isUploading}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {isSaving || isUploading ? 'Memproses...' : (editingTransaction ? 'Perbarui Transaksi' : 'Buat Transaksi')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
