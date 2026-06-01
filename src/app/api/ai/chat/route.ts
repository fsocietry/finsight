import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { groq, GROQ_MODEL, buildSystemPrompt } from "@/lib/groq";
import { getMonthRange } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, history } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const { start, end } = getMonthRange();

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id, date: { gte: start, lte: end } },
    orderBy: { date: "desc" },
  });

  type Tx = typeof transactions[number];

  const totalIncome = transactions
    .filter((t: Tx) => t.type === "income")
    .reduce((sum: number, t: Tx) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t: Tx) => t.type === "expense")
    .reduce((sum: number, t: Tx) => sum + t.amount, 0);

  // Group expenses by description so the AI still gets a "top spending" breakdown.
  const expenseTotals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    expenseTotals.set(t.description, (expenseTotals.get(t.description) || 0) + t.amount);
  }
  const topExpenses = Array.from(expenseTotals.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const systemPrompt = buildSystemPrompt({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    topExpenses,
    recentTransactions: transactions.slice(0, 5).map((t: Tx) => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
    })),
  });

  const chatHistory = (history || []).map((msg: { role: string; content: string }) => ({
    role: msg.role === "model" ? "assistant" : "user",
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
      { role: "user", content: message, userId: session.user.id },
      { role: "model", content: reply, userId: session.user.id },
    ],
  });

  return NextResponse.json({ reply });
}
