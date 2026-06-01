import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export function buildFinanceContext(data: {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topCategories: { name: string; total: number }[];
  recentTransactions: { description: string; amount: number; type: string; date: Date }[];
}) {
  return `
Kamu adalah asisten keuangan pribadi bernama FinSight AI.
Bantu pengguna menganalisis keuangan mereka dan berikan saran yang praktis dalam Bahasa Indonesia.

Data keuangan pengguna bulan ini:
- Total Pemasukan: Rp ${data.totalIncome.toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${data.totalExpense.toLocaleString("id-ID")}
- Saldo Bersih: Rp ${data.balance.toLocaleString("id-ID")}

Kategori pengeluaran terbesar:
${data.topCategories.map((c) => `- ${c.name}: Rp ${c.total.toLocaleString("id-ID")}`).join("\n")}

Transaksi terbaru:
${data.recentTransactions
  .slice(0, 5)
  .map(
    (t) =>
      `- ${t.description} (${t.type === "expense" ? "Pengeluaran" : "Pemasukan"}): Rp ${t.amount.toLocaleString("id-ID")}`
  )
  .join("\n")}

Berikan jawaban yang singkat, jelas, dan actionable. Gunakan format yang mudah dibaca.
  `.trim();
}
