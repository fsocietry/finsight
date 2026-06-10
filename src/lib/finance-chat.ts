import { prisma } from "./prisma";
import { groq, GROQ_MODEL, buildSystemPrompt } from "./groq";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export type ChatHistoryItem = { role: string; content: string };

/**
 * Membangun konteks keuangan dari SEMUA transaksi pengguna lalu meminta jawaban
 * ke Groq. Riwayat percakapan disimpan ke ChatMessage agar konsisten antara
 * chat di web dan chat via WhatsApp. Dipakai bersama oleh route API dan worker.
 */
export async function generateChatReply(
  userId: string,
  message: string,
  history: ChatHistoryItem[] = []
): Promise<string> {
  // Ambil SEMUA transaksi agar AI bisa menjawab pertanyaan periode apa pun.
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  type Tx = (typeof transactions)[number];

  const totals = (txs: Tx[]) => {
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const thisMonthTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getFullYear() === curYear && d.getMonth() === curMonth;
  });
  const thisYearTx = transactions.filter((t) => new Date(t.date).getFullYear() === curYear);

  // Rincian per bulan (12 bulan terakhir yang ada datanya).
  const monthMap = new Map<string, { y: number; m: number; income: number; expense: number }>();
  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let e = monthMap.get(key);
    if (!e) {
      e = { y: d.getFullYear(), m: d.getMonth(), income: 0, expense: 0 };
      monthMap.set(key, e);
    }
    if (t.type === "income") e.income += t.amount;
    else e.expense += t.amount;
  }
  const monthly = Array.from(monthMap.values())
    .sort((a, b) => b.y - a.y || b.m - a.m)
    .slice(0, 12)
    .map((e) => ({ label: `${MONTHS_ID[e.m]} ${e.y}`, income: e.income, expense: e.expense }));

  // Pengeluaran terbesar sepanjang waktu (dikelompokkan per deskripsi).
  const expenseTotals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    expenseTotals.set(t.description, (expenseTotals.get(t.description) || 0) + t.amount);
  }
  const topExpenses = Array.from(expenseTotals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const systemPrompt = buildSystemPrompt({
    todayLabel: `${now.getDate()} ${MONTHS_ID[curMonth]} ${curYear}`,
    currentMonthLabel: `${MONTHS_ID[curMonth]} ${curYear}`,
    currentYear: curYear,
    thisMonth: totals(thisMonthTx),
    thisYear: totals(thisYearTx),
    allTime: totals(transactions),
    monthly,
    topExpenses,
    recentTransactions: transactions.slice(0, 10).map((t: Tx) => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
    })),
  });

  const chatHistory = history.map((msg) => ({
    role: (msg.role === "model" ? "assistant" : "user") as "assistant" | "user",
    content: msg.content,
  }));

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  });

  const reply = completion.choices[0]?.message?.content || "Maaf, tidak dapat memproses permintaan.";

  await prisma.chatMessage.createMany({
    data: [
      { role: "user", content: message, userId },
      { role: "model", content: reply, userId },
    ],
  });

  return reply;
}
