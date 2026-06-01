"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ExpenseChart from "@/components/charts/ExpenseChart";
import CategoryPieChart from "@/components/charts/CategoryPieChart";
import PeriodFilter, { Period, PERIOD_LABEL } from "@/components/ui/PeriodFilter";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
}

const CHART_COLORS = ["#0a84ff", "#ff375f", "#ff9f0a", "#30d158", "#64d2ff", "#bf5af2"];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    let active = true;
    fetch(`/api/transactions?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setTransactions(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [period]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Group expenses by description (categories were removed).
  const expenseMap = new Map<string, number>();
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    const key = t.description || "Lainnya";
    expenseMap.set(key, (expenseMap.get(key) || 0) + t.amount);
  });

  const expenseBreakdown = Array.from(expenseMap.entries())
    .map(([name, total], i) => ({ name, value: total, color: CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const periodName = period === "month" ? "Bulan Ini" : period === "year" ? "Tahun Ini" : "Semua";
  const barData = [
    { name: periodName, pemasukan: totalIncome, pengeluaran: totalExpense },
  ];

  const stats = [
    { label: "Saldo Bersih", value: balance, icon: Wallet, color: "text-[#0a84ff]", bg: "bg-[#0a84ff]/15" },
    { label: "Total Pemasukan", value: totalIncome, icon: TrendingUp, color: "text-[#30d158]", bg: "bg-[#30d158]/15" },
    { label: "Total Pengeluaran", value: totalExpense, icon: TrendingDown, color: "text-[#ff375f]", bg: "bg-[#ff375f]/15" },
    { label: "Transaksi", value: transactions.length, icon: ArrowLeftRight, color: "text-[#64d2ff]", bg: "bg-[#64d2ff]/15", isCurrency: false },
  ];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-ink/50">Ringkasan keuangan {PERIOD_LABEL[period]}</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg, isCurrency = true }) => (
          <div key={label} className="glass rounded-3xl p-5">
            <div className={`mb-3 inline-flex rounded-2xl p-2 ${bg}`}>
              <Icon className={color} size={20} />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink/45">{label}</p>
            <p className="mt-1 text-xl font-semibold text-ink">
              {isCurrency ? formatCurrency(value as number) : value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 font-semibold text-ink/90">Pemasukan vs Pengeluaran</h2>
          <ExpenseChart data={barData} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h2 className="mb-4 font-semibold text-ink/90">Pengeluaran Teratas</h2>
          <CategoryPieChart data={expenseBreakdown} />
        </div>
      </div>

      <div className="glass rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink/10 p-5 sm:p-6">
          <h2 className="font-semibold text-ink/90">Transaksi Terbaru</h2>
          <Link href="/transactions" className="btn btn-glass px-3.5 py-1.5 text-xs">
            Lihat semua
          </Link>
        </div>
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-ink/40">
            <ArrowLeftRight className="mx-auto mb-3 opacity-30" size={40} />
            <p>Belum ada transaksi {PERIOD_LABEL[period]}</p>
            <Link href="/transactions" className="btn btn-glass mt-4">
              Tambah transaksi pertama
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-ink/8">
            {transactions.slice(0, 5).map((t) => {
              const color = t.type === "income" ? "#30d158" : "#0a84ff";
              const Icon = t.type === "income" ? ArrowDownLeft : ArrowUpRight;
              return (
                <div key={t.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: color + "22" }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{t.description}</p>
                      <p className="text-xs text-ink/45">
                        {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${t.type === "income" ? "text-[#30d158]" : "text-[#ff453a]"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
