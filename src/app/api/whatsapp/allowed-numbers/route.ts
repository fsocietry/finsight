import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Simpan daftar nomor WA lain yang boleh chat ke bot ini (selain "Pesan ke Diri Sendiri").
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const numbers = Array.isArray(body?.numbers) ? body.numbers : [];
  const cleaned = Array.from(
    new Set(
      numbers
        .map((n: unknown) => String(n).replace(/\D/g, ""))
        .filter((n: string) => n.length >= 8)
    )
  );

  const userId = session.user.id;
  await prisma.whatsAppSession.upsert({
    where: { userId },
    create: { userId, allowedNumbers: cleaned.join(",") || null },
    update: { allowedNumbers: cleaned.join(",") || null },
  });

  return NextResponse.json({ ok: true, numbers: cleaned });
}
