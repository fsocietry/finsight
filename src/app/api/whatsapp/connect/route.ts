import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROOT = process.env.WA_USERS_DIR || "whatsapp/users";

// Minta worker membuat sesi WhatsApp baru untuk akun ini (akan memunculkan QR).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dir = path.resolve(ROOT, session.user.id);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "connect.req"), new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal memulai koneksi" }, { status: 500 });
  }
}
