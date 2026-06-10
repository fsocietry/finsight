import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { readFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ROOT = process.env.WA_USERS_DIR || "whatsapp/users";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Status WhatsApp khusus untuk akun yang sedang login.
  const file = path.resolve(ROOT, session.user.id, "status.json");
  try {
    const raw = await readFile(file, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ connection: "offline", qr: null });
  }
}
