import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Minta worker memutus & menghapus sesi WhatsApp akun ini (via DB).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  await prisma.whatsAppSession.upsert({
    where: { userId },
    create: { userId, status: "offline", command: "logout" },
    update: { command: "logout" },
  });
  return NextResponse.json({ ok: true });
}
