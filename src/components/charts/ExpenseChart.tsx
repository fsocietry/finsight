"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "@/components/theme/ThemeProvider";

interface ChartData {
  name: string;
  pemasukan: number;
  pengeluaran: number;
}

interface ExpenseChartProps {
  data: ChartData[];
}

const formatYAxis = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
  return value.toString();
};

export default function ExpenseChart({ data }: ExpenseChartProps) {
  const { theme } = useTheme();
  const c = theme === "light"
    ? { grid: "rgba(0,0,0,0.08)", axis: "rgba(0,0,0,0.2)", tick: "rgba(60,60,67,0.6)", legend: "rgba(60,60,67,0.85)", tipBg: "rgba(255,255,255,0.95)", tipBorder: "rgba(0,0,0,0.1)", tipText: "#1d1d1f", cursor: "rgba(0,0,0,0.04)" }
    : { grid: "rgba(255,255,255,0.08)", axis: "rgba(255,255,255,0.2)", tick: "rgba(255,255,255,0.5)", legend: "rgba(255,255,255,0.7)", tipBg: "rgba(28,28,34,0.92)", tipBorder: "rgba(255,255,255,0.15)", tipText: "#fff", cursor: "rgba(255,255,255,0.05)" };
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: c.tick }} stroke={c.axis} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12, fill: c.tick }} stroke={c.axis} />
        <Tooltip
          cursor={{ fill: c.cursor }}
          contentStyle={{ background: c.tipBg, border: `1px solid ${c.tipBorder}`, borderRadius: 14, color: c.tipText }}
          formatter={(value) =>
            new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(Number(value))
          }
        />
        <Legend wrapperStyle={{ color: c.legend }} />
        <Bar dataKey="pemasukan" fill="#30d158" radius={[6, 6, 0, 0]} />
        <Bar dataKey="pengeluaran" fill="#ff375f" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
