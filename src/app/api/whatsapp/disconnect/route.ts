import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROOT = process.env.WA_USERS_DIR || "whatsapp/users";

// Minta worker memutus & menghapus sesi WhatsApp akun ini.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dir = path.resolve(ROOT, session.user.id);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "logout.req"), new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Gagal memutus koneksi" }, { status: 500 });
  }
}
