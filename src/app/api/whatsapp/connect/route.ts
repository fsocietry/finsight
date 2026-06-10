import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Minta worker membuat sesi WhatsApp baru untuk akun ini (akan memunculkan QR).
// Koordinasi lewat DB agar berfungsi di serverless/Vercel.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  await prisma.whatsAppSession.upsert({
    where: { userId },
    create: { userId, status: "starting", command: "connect", qr: null },
    update: { command: "connect", status: "starting", qr: null, code: null },
  });
  return NextResponse.json({ ok: true });
}
