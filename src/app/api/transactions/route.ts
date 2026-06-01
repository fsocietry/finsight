import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
  const targetYear = year ? parseInt(year) : now.getFullYear();

  const start = new Date(targetYear, targetMonth, 1);
  const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  // `?all=1` returns every transaction (used by the Transaksi page); otherwise
  // results are scoped to a single month (dashboard / analytics).
  const where = all
    ? { userId: session.user.id }
    : { userId: session.user.id, date: { gte: start, lte: end } };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { amount, type, description, date } = body;

  if (!amount || !type || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      type,
      description,
      date: date ? new Date(date) : new Date(),
      userId: session.user.id,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
