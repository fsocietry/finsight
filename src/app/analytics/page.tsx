"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import ExpenseChart from "@/components/charts/ExpenseChart";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
}

const COLORS = ["#0a84ff", "#ff375f", "#ff9f0a", "#30d158", "#64d2ff", "#bf5af2", "#ff453a"];

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const expenses = transactions.filter((t) => t.type === "expense");
  const incomes = transactions.filter((t) => t.type === "income");
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);

  // Group expenses by description (categories were removed).
  const expenseMap = new Map<string, { name: string; total: number; count: number }>();
  expenses.forEach((t) => {
    const key = t.description || "Lainnya";
    const existing = expenseMap.get(key);
    if (existing) {
      existing.total += t.amount;
      existing.count++;
    } else {
      expenseMap.set(key, { name: key, total: t.amount, count: 1 });
    }
  });

  const categoryStats = Array.from(expenseMap.values())
    .sort((a, b) => b.total - a.total)
    .map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }));
  const pieData = categoryStats.slice(0, 7).map((c) => ({ name: c.name, value: c.total, color: c.color }));
  const barData = [{ name: "Bulan Ini", pemasukan: totalIncome, pengeluaran: totalExpense }];

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Analitik</h1>
        <p className="mt-1 text-ink/50">Analisis mendalam keuangan bulan ini</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass rounded-3xl p-5 text-center">
          <p className="mb-1 text-xs uppercase tracking-wide text-ink/45">Tingkat Tabungan</p>
          <p className={`text-3xl font-semibold ${savingsRate >= 0 ? "text-[#30d158]" : "text-[#ff453a]"}`}>
            {savingsRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-ink/40">dari total pemasukan</p>
        </div>
        <div className="glass rounded-3xl p-5 text-center">
          <p className="mb-1 text-xs uppercase tracking-wide text-ink/45">Rata-rata Pengeluaran/Hari</p>
          <p className="text-3xl font-semibold text-ink">
            {formatCurrency(totalExpense / new Date().getDate())}
          </p>
          <p className="mt-1 text-xs text-ink/40">per hari</p>
        </div>
        <div className="glass rounded-3xl p-5 text-center">
          <p className="mb-1 text-xs uppercase tracking-wide text-ink/45">Total Transaksi</p>
          <p className="text-3xl font-semibold text-ink">{transactions.length}</p>
          <p className="mt-1 text-xs text-ink/40">bulan ini</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 font-semibold text-ink/90">Distribusi Pengeluaran</h2>
          <CategoryPieChart data={pieData} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 font-semibold text-ink/90">Pemasukan vs Pengeluaran</h2>
          <ExpenseChart data={barData} />
        </div>
      </div>

      <div className="glass rounded-3xl">
        <div className="border-b border-ink/10 p-6">
          <h2 className="font-semibold text-ink/90">Rincian Pengeluaran</h2>
        </div>
        {categoryStats.length === 0 ? (
          <p className="p-8 text-center text-ink/40">Belum ada data pengeluaran</p>
        ) : (
          <div className="divide-y divide-ink/8">
            {categoryStats.map((cat) => (
              <div key={cat.name} className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-ink/80">{cat.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-ink">{formatCurrency(cat.total)}</span>
                    <span className="ml-2 text-xs text-ink/40">({cat.count} transaksi)</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${totalExpense > 0 ? (cat.total / totalExpense) * 100 : 0}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink/40">
                  {totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(1) : 0}% dari total pengeluaran
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
