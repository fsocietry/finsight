"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "@/components/theme/ThemeProvider";

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { theme } = useTheme();
  const c = theme === "light"
    ? { legend: "rgba(60,60,67,0.85)", tipBg: "rgba(255,255,255,0.95)", tipBorder: "rgba(0,0,0,0.1)", tipText: "#1d1d1f" }
    : { legend: "rgba(255,255,255,0.7)", tipBg: "rgba(28,28,34,0.92)", tipBorder: "rgba(255,255,255,0.15)", tipText: "#fff" };

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-ink/40">
        Belum ada data pengeluaran
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip
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
      </PieChart>
    </ResponsiveContainer>
  );
}
