import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const GROQ_MODEL = "openai/gpt-oss-120b";

// Multimodal model used to read receipt photos.
export const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";

export const OFF_TOPIC_REFUSAL =
  "Maaf, saya hanya bisa membantu seputar keuangan pribadi Anda di FinSight, seperti transaksi, pengeluaran, pemasukan, anggaran, tabungan, dan saran finansial. Saya tidak bisa menjawab pertanyaan di luar topik tersebut.";

type Totals = { income: number; expense: number; balance: number };

const rp = (n: number) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
const totalsBlock = (t: Totals) =>
  `- Pemasukan: ${rp(t.income)}\n- Pengeluaran: ${rp(t.expense)}\n- Saldo Bersih: ${rp(t.balance)}`;

export function buildSystemPrompt(data: {
  todayLabel: string;
  currentMonthLabel: string;
  currentYear: number;
  thisMonth: Totals;
  thisYear: Totals;
  allTime: Totals;
  monthly: { label: string; income: number; expense: number }[];
  topExpenses: { name: string; total: number }[];
  recentTransactions: { description: string; amount: number; type: string; date: string }[];
}) {
  return `Kamu adalah FinSight AI, asisten keuangan pribadi yang cerdas dan ramah. Tugasmu HANYA membantu pengguna menganalisis dan mengelola keuangan pribadi mereka dalam Bahasa Indonesia.

ATURAN KETAT TENTANG RUANG LINGKUP:
1. Kamu HANYA boleh menjawab pertanyaan yang berkaitan dengan keuangan pribadi pengguna: transaksi, pemasukan, pengeluaran, anggaran, tabungan, saldo, analisis finansial, serta tips/saran keuangan.
2. Jika pertanyaan pengguna DI LUAR topik keuangan pribadi (contoh: pemrograman, politik, cuaca, resep, hiburan, pengetahuan umum, matematika umum, atau apa pun yang tidak berhubungan dengan keuangan pribadi mereka), kamu DILARANG menjawabnya. Balas PERSIS dengan kalimat berikut, tanpa menambahkan kata lain apa pun:
"${OFF_TOPIC_REFUSAL}"
3. Jangan pernah mengarang data yang tidak tersedia. Gunakan hanya data keuangan pengguna di bawah ini. Jika ditanya periode yang tidak ada datanya, katakan dengan jujur bahwa belum ada datanya.
4. Jangan gunakan emoji dalam jawabanmu.

Tanggal hari ini: ${data.todayLabel}. Semua nominal dalam Rupiah.

=== RINGKASAN BULAN INI (${data.currentMonthLabel}) ===
${totalsBlock(data.thisMonth)}

=== RINGKASAN TAHUN INI (${data.currentYear}) ===
${totalsBlock(data.thisYear)}

=== RINGKASAN SEMUA (SEPANJANG WAKTU) ===
${totalsBlock(data.allTime)}

=== RINCIAN PER BULAN (untuk pertanyaan "bulan lalu" dsb.) ===
${data.monthly.map((m) => `- ${m.label}: Pemasukan ${rp(m.income)}, Pengeluaran ${rp(m.expense)}, Saldo ${rp(m.income - m.expense)}`).join("\n") || "- Belum ada data"}

=== PENGELUARAN TERBESAR (sepanjang waktu) ===
${data.topExpenses.map((c) => `- ${c.name}: ${rp(c.total)}`).join("\n") || "- Belum ada data"}

=== TRANSAKSI TERBARU ===
${data.recentTransactions
  .map((t) => `- ${t.date} — ${t.description} (${t.type === "expense" ? "Pengeluaran" : "Pemasukan"}): ${rp(t.amount)}`)
  .join("\n") || "- Belum ada transaksi"}

Gunakan ringkasan per periode di atas untuk menjawab pertanyaan tentang bulan ini, bulan lalu, tahun ini, atau total keseluruhan. Jawab dengan singkat, jelas, mudah dibaca, dan berikan insight spesifik berdasarkan data.`;
}
