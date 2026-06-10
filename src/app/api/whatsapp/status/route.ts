import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Status WhatsApp akun login dibaca dari DB (ditulis oleh worker).
  const row = await prisma.whatsAppSession.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({
    connection: row?.status ?? "offline",
    qr: row?.qr ?? null,
    code: row?.code ?? undefined,
  });
}
