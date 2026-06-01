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
  const period = searchParams.get("period"); // "month" (default) | "year" | "all"
  const all = searchParams.get("all"); // backwards-compatible alias for period=all
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const now = new Date();
  const targetYear = year ? parseInt(year) : now.getFullYear();

  // Build the date filter based on the requested period.
  let where: { userId: string; date?: { gte: Date; lte: Date } };
  if (all || period === "all") {
    where = { userId: session.user.id };
  } else if (period === "year") {
    where = {
      userId: session.user.id,
      date: { gte: new Date(targetYear, 0, 1), lte: new Date(targetYear, 11, 31, 23, 59, 59) },
    };
  } else {
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    where = {
      userId: session.user.id,
      date: { gte: new Date(targetYear, targetMonth, 1), lte: new Date(targetYear, targetMonth + 1, 0, 23, 59, 59) },
    };
  }

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
