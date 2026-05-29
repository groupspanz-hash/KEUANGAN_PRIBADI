export interface FinancialHealthScore {
  score: number;
  status: string;
  color: string;
  savingRatio: number;
  expenseRatio: number;
  debtRatio: number;
  cashFlow: number;
  insights: string[];
  recommendations: string[];
  factors: { label: string; impact: string }[];
}

export function calculateFinancialHealth(
  totalPendapatan: number,
  totalPengeluaran: number,
  totalTabungan: number,
  totalUtang: number
): FinancialHealthScore {
  // If income is <= 0, handle safely
  if (totalPendapatan <= 0) {
    return {
      score: 0,
      status: 'Buruk',
      color: 'rose',
      savingRatio: 0,
      expenseRatio: 0,
      debtRatio: 0,
      cashFlow: totalPendapatan - totalPengeluaran,
      insights: ['Pendapatan bulan ini belum tercatat atau nol.'],
      recommendations: ['Tingkatkan pemasukan atau catat pendapatan Anda agar skor dapat dihitung.'],
      factors: []
    };
  }

  const savingRatio = (totalTabungan / totalPendapatan) * 100;
  const expenseRatio = (totalPengeluaran / totalPendapatan) * 100;
  const cashFlow = totalPendapatan - totalPengeluaran;
  const debtRatio = (totalUtang / totalPendapatan) * 100;
  const cashFlowRatio = (cashFlow / totalPendapatan) * 100;

  let savingScore = 0;
  if (savingRatio >= 30) savingScore = 100;
  else if (savingRatio >= 20) savingScore = 80;
  else if (savingRatio >= 10) savingScore = 60;
  else if (savingRatio >= 5) savingScore = 40;
  else savingScore = 20;

  let expenseScore = 0;
  if (expenseRatio <= 50) expenseScore = 100;
  else if (expenseRatio <= 70) expenseScore = 75;
  else if (expenseRatio <= 90) expenseScore = 50;
  else expenseScore = 20;

  let cashflowScore = 0;
  if (cashFlowRatio > 20) cashflowScore = 100;
  else if (cashFlow > 0) cashflowScore = 75;
  else if (cashFlow === 0) cashflowScore = 50;
  else cashflowScore = 20;

  let debtScore = 0;
  if (debtRatio <= 20) debtScore = 100;
  else if (debtRatio <= 35) debtScore = 75;
  else if (debtRatio <= 50) debtScore = 50;
  else debtScore = 20;

  const rawScore = (savingScore * 0.35) + (expenseScore * 0.25) + (cashflowScore * 0.25) + (debtScore * 0.15);
  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let status = '';
  let color = '';
  
  if (finalScore >= 80) {
    status = 'Sangat Sehat';
    color = 'emerald';
  } else if (finalScore >= 60) {
    status = 'Baik';
    color = 'green';
  } else if (finalScore >= 40) {
    status = 'Perlu Perhatian';
    color = 'amber';
  } else {
    status = 'Buruk';
    color = 'rose';
  }

  const insights: string[] = [];
  const recommendations: string[] = [];
  const factors: { label: string; impact: string }[] = [];

  // Saving Insights
  if (savingScore >= 80) {
    insights.push('Tabungan Anda sudah berada di level aman.');
    factors.push({ label: 'Rasio Tabungan Tinggi', impact: 'positif' });
  } else {
    insights.push('Alokasi tabungan masih di bawah ideal.');
    recommendations.push('Maksimalkan tabungan otomatis minimal 20% dari pendapatan.');
    factors.push({ label: 'Rasio Tabungan Rendah', impact: 'negatif' });
  }

  // Expense Insights
  if (expenseScore <= 50) {
    insights.push('Pengeluaran Anda terlalu tinggi dibanding pemasukan.');
    recommendations.push('Kurangi pengeluaran bersifat hiburan atau keinginan sebesar 15%.');
    factors.push({ label: 'Pengeluaran Tinggi', impact: 'negatif' });
  } else {
    factors.push({ label: 'Pengeluaran Terkontrol', impact: 'positif' });
  }

  // Cashflow Insights
  if (cashFlow < 0) {
    insights.push('Cash flow bulan ini negatif.');
    recommendations.push('Segera periksa pengeluaran besar dan kurangi belanja tidak penting.');
    factors.push({ label: 'Cash Flow Negatif', impact: 'negatif' });
  } else if (cashFlow > 0) {
    insights.push('Cash flow bulan ini positif.');
  }

  // Debt Insights
  if (debtScore <= 50) {
    insights.push('Beban utang bulanan cukup berisiko terhadap arus kas Anda.');
    recommendations.push('Jaga rasio utang di bawah 30% pendapatan, lunasi utang bunga tinggi terlebih dahulu.');
    factors.push({ label: 'Rasio Utang Tinggi', impact: 'negatif' });
  }

  if (finalScore >= 80) {
    insights.push('Kondisi finansial sangat sehat, pertahankan konsistensi.');
    if (recommendations.length === 0) {
      recommendations.push('Pertahankan alokasi anggaran Anda dan coba tingkatkan target investasi.');
    }
  }

  return {
    score: finalScore,
    status,
    color,
    savingRatio,
    expenseRatio,
    debtRatio,
    cashFlow,
    insights,
    recommendations,
    factors: factors.slice(0, 2)
  };
}
