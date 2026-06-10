import "dotenv/config";
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  DisconnectReason,
  downloadMediaMessage,
  type WASocket,
  type WAMessage,
} from "baileys";
import QRCode from "qrcode";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "fs";
import path from "path";
import pino from "pino";
import { prisma } from "../src/lib/prisma";
import { parseReceipt } from "../src/lib/receipt";
import { generateChatReply } from "../src/lib/finance-chat";
import { parseTransactionText } from "../src/lib/transaction-nlu";

// ── Konfigurasi & util ──────────────────────────────────────────────────────
// Tiap user FinSight punya satu sesi WhatsApp sendiri di whatsapp/users/<userId>/.
const ROOT = process.env.WA_USERS_DIR || "whatsapp/users";
const logger = pino({ level: process.env.WA_LOG_LEVEL || "silent" });
const TICK_MS = 2500;
// Jendela waktu sebuah permintaan "connect" tetap aktif (regen QR) sebelum scan.
const CONNECT_WINDOW_MS = 3 * 60 * 1000;

const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
const fmtDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const fmtShort = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
const CANCEL_WORDS = new Set(["batal", "hapus", "undo", "cancel", "batalkan"]);

const userDir = (userId: string) => path.join(ROOT, userId);
const authDir = (userId: string) => path.join(userDir(userId), "auth");

type WAStatus = "starting" | "qr" | "open" | "close" | "offline";

// Status & QR ditulis ke DB agar web (termasuk di Vercel) bisa membacanya.
async function writeStatus(userId: string, s: { connection: WAStatus; qr: string | null; code?: number }) {
  try {
    await prisma.whatsAppSession.upsert({
      where: { userId },
      create: { userId, status: s.connection, qr: s.qr, code: s.code ?? null },
      update: { status: s.connection, qr: s.qr, code: s.code ?? null },
    });
  } catch (e) {
    console.error(`[${userId}] gagal tulis status DB:`, e);
  }
}

/** creds.json punya identitas akun (me.id) → sesi sudah ter-pairing.
 *  Catatan: flag `registered` bisa tetap false pada perangkat tertaut walau
 *  sesi sudah valid, jadi kita andalkan keberadaan `me.id`. */
function isRegistered(userId: string): boolean {
  try {
    const raw = readFileSync(path.join(authDir(userId), "creds.json"), "utf8");
    const c = JSON.parse(raw);
    return Boolean(c?.me?.id);
  } catch {
    return false;
  }
}

function jidDigits(jid: string): string {
  return jid.split("@")[0].split(":")[0].replace(/\D/g, "");
}

// ── State sesi (in-memory) ──────────────────────────────────────────────────
type Session = {
  sock: WASocket;
  botSentIds: Set<string>;
  lastTxByChat: Map<string, string>;
};
const sessions = new Map<string, Session>();
const starting = new Set<string>();
const pendingConnect = new Map<string, number>(); // userId → expiresAt (ms)

// ── Penanganan pesan masuk ──────────────────────────────────────────────────
function ownIdsOf(userId: string, sock: WASocket): Set<string> {
  const ids = new Set<string>();
  const id = sock.user?.id || "";
  const lid = (sock.user as { lid?: string })?.lid || "";
  if (id) ids.add(jidDigits(id));
  if (lid) ids.add(jidDigits(lid));
  // sock.user.lid sering kosong walau creds.me.lid terisi — ambil dari creds
  // agar chat "Pesan ke Diri Sendiri" yang datang via JID @lid tetap dikenali.
  try {
    const c = JSON.parse(readFileSync(path.join(authDir(userId), "creds.json"), "utf8"));
    if (c?.me?.id) ids.add(jidDigits(c.me.id));
    if (c?.me?.lid) ids.add(jidDigits(c.me.lid));
  } catch {}
  return ids;
}

/** Hanya proses chat "Pesan ke Diri Sendiri" milik nomor yang men-scan. */
function isSelfChat(msg: WAMessage, ownIds: Set<string>): boolean {
  const jid = msg.key.remoteJid || "";
  if (jid.endsWith("@g.us") || jid.endsWith("@broadcast")) return false;
  const sender = jidDigits(jid);
  return Boolean(sender) && ownIds.has(sender);
}

async function handleMessage(userId: string, session: Session, msg: WAMessage) {
  const { sock, botSentIds, lastTxByChat } = session;
  if (!msg.message) return;
  const id = msg.key.id || "";
  if (id && botSentIds.has(id)) return; // anti-loop balasan sendiri

  if (!isSelfChat(msg, ownIdsOf(userId, sock))) return;

  const jid = msg.key.remoteJid!;
  const m = msg.message;
  const reply = async (text: string) => {
    const sent = await sock.sendMessage(jid, { text });
    if (sent?.key?.id) botSentIds.add(sent.key.id);
  };

  // ── Foto struk → transaksi pengeluaran ───────────────────────────────
  const image =
    m.imageMessage ||
    (m.documentMessage?.mimetype?.startsWith("image/") ? m.documentMessage : null);

  if (image) {
    await reply("Membaca struk...");
    let dataUrl: string;
    try {
      const buffer = (await downloadMediaMessage(
        msg,
        "buffer",
        {},
        { logger, reuploadRequest: sock.updateMediaMessage }
      )) as Buffer;
      dataUrl = `data:${image.mimetype || "image/jpeg"};base64,${buffer.toString("base64")}`;
    } catch (e) {
      console.error(`[${userId}] gagal unduh media:`, e);
      await reply("❌ Gagal mengunduh gambar. Coba kirim ulang.");
      return;
    }

    const result = await parseReceipt(dataUrl);
    if (!result.ok) {
      await reply("❌ " + result.error);
      return;
    }
    const { description, amount, date } = result.data;
    const tx = await prisma.transaction.create({
      data: { amount, type: "expense", description, date: date ? new Date(date) : new Date(), userId },
    });
    lastTxByChat.set(jid, tx.id);
    await reply(
      `✅ Tercatat sebagai pengeluaran:\n🧾 *${description}* · ${rp(amount)} · ${fmtDate(new Date(tx.date))}\n_(balas "batal" untuk hapus)_`
    );
    return;
  }

  // ── Teks ──────────────────────────────────────────────────────────────
  const text = (m.conversation || m.extendedTextMessage?.text || "").trim();
  if (!text) return;

  try {
    // 1) "batal" → hapus transaksi terakhir di chat ini.
    if (CANCEL_WORDS.has(text.toLowerCase())) {
      const lastId = lastTxByChat.get(jid);
      if (!lastId) {
        await reply("Tidak ada transaksi terbaru untuk dibatalkan.");
        return;
      }
      const deleted = await prisma.transaction.delete({ where: { id: lastId } }).catch(() => null);
      lastTxByChat.delete(jid);
      await reply(
        deleted
          ? `↩️ Dibatalkan. "${deleted.description} ${rp(deleted.amount)}" dihapus.`
          : "Transaksi itu sudah tidak ada."
      );
      return;
    }

    // 2) Pencatatan transaksi (income/expense) via bahasa natural.
    const parsed = await parseTransactionText(text, new Date());
    if (parsed.is_transaction && parsed.amount > 0) {
      const tx = await prisma.transaction.create({
        data: {
          amount: parsed.amount,
          type: parsed.type,
          description: parsed.description || (parsed.type === "income" ? "Pemasukan" : "Pengeluaran"),
          date: new Date(parsed.date),
          userId,
        },
      });
      lastTxByChat.set(jid, tx.id);
      const label = parsed.type === "income" ? "Pemasukan" : "Pengeluaran";
      const emoji = parsed.emoji || (parsed.type === "income" ? "💰" : "🧾");
      await reply(
        `✅ ${label} dicatat:\n${emoji} *${tx.description}* · ${rp(tx.amount)} · ${fmtShort(new Date(tx.date))}\n_(balas "batal" untuk hapus)_`
      );
      return;
    }

    // 3) Bukan transaksi → AI chat keuangan.
    const aiReply = await generateChatReply(userId, text);
    await reply(aiReply);
  } catch (e) {
    console.error(`[${userId}] gagal proses teks:`, e);
    await reply("❌ Maaf, terjadi kesalahan saat memproses pesanmu.");
  }
}

// ── Siklus hidup sesi ───────────────────────────────────────────────────────
async function startSession(userId: string) {
  if (sessions.has(userId) || starting.has(userId)) return;
  starting.add(userId);
  try {
    await writeStatus(userId, { connection: "starting", qr: null });
    const { state, saveCreds } = await useMultiFileAuthState(authDir(userId));
    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({ version, auth: state, logger, browser: Browsers.macOS("Desktop") });
    const session: Session = { sock, botSentIds: new Set(), lastTxByChat: new Map() };
    sessions.set(userId, session);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (u) => {
      const { connection, lastDisconnect, qr } = u;
      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
          await writeStatus(userId, { connection: "qr", qr: dataUrl });
        } catch (e) {
          console.error(`[${userId}] gagal buat QR:`, e);
        }
      }
      if (connection === "open") {
        pendingConnect.delete(userId);
        console.log(`[${userId}] ✅ tersambung sebagai ${sock.user?.id}`);
        await writeStatus(userId, { connection: "open", qr: null });
      }
      if (connection === "close") {
        const code = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
        sessions.delete(userId);
        if (code === DisconnectReason.loggedOut) {
          console.log(`[${userId}] logout — menghapus sesi`);
          pendingConnect.delete(userId);
          try {
            rmSync(authDir(userId), { recursive: true, force: true });
          } catch {}
          await writeStatus(userId, { connection: "offline", qr: null });
        } else {
          // Reconnect ditangani controlTick (selama registered atau masih dalam jendela connect).
          await writeStatus(userId, { connection: "close", qr: null, code });
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;
      const s = sessions.get(userId);
      if (!s) return;
      for (const msg of messages) {
        try {
          await handleMessage(userId, s, msg);
        } catch (e) {
          console.error(`[${userId}] gagal proses pesan:`, e);
        }
      }
    });
  } catch (e) {
    console.error(`[${userId}] gagal start sesi:`, e);
    sessions.delete(userId);
    await writeStatus(userId, { connection: "offline", qr: null });
  } finally {
    starting.delete(userId);
  }
}

async function logoutSession(userId: string) {
  const s = sessions.get(userId);
  try {
    if (s) await s.sock.logout();
  } catch {}
  sessions.delete(userId);
  pendingConnect.delete(userId);
  try {
    rmSync(authDir(userId), { recursive: true, force: true });
  } catch {}
  await writeStatus(userId, { connection: "offline", qr: null });
  console.log(`[${userId}] diputuskan`);
}

// ── Loop kontrol: pantau perintah dari web (via DB) & reconnect otomatis ─────
async function controlTick() {
  // 1) Perintah connect/logout dari web (DB → berfungsi walau web di Vercel).
  try {
    const pending = await prisma.whatsAppSession.findMany({ where: { command: { not: null } } });
    for (const row of pending) {
      const userId = row.userId;
      await prisma.whatsAppSession.update({ where: { userId }, data: { command: null } }).catch(() => {});
      if (row.command === "logout") {
        await logoutSession(userId);
      } else if (row.command === "connect") {
        pendingConnect.set(userId, Date.now() + CONNECT_WINDOW_MS);
        await startSession(userId);
      }
    }
  } catch (e) {
    console.error("controlTick (DB) error:", e);
  }

  // 2) Sambungkan ulang sesi tertaut yang kredensialnya tersimpan di disk worker.
  if (!existsSync(ROOT)) return;
  let userIds: string[] = [];
  try {
    userIds = readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    return;
  }

  for (const userId of userIds) {
    if (sessions.has(userId) || starting.has(userId)) continue;
    try {
      if (isRegistered(userId)) {
        // Sesi tertaut sungguhan → sambungkan ulang.
        await startSession(userId);
      } else if ((pendingConnect.get(userId) || 0) > Date.now()) {
        // Masih menunggu scan → regen QR.
        await startSession(userId);
      } else if (pendingConnect.has(userId)) {
        // Jendela connect habis tanpa scan → bersihkan kredensial sementara.
        pendingConnect.delete(userId);
        try {
          rmSync(authDir(userId), { recursive: true, force: true });
        } catch {}
        await writeStatus(userId, { connection: "offline", qr: null });
      }
    } catch (e) {
      console.error(`[${userId}] reconnect error:`, e);
    }
  }
}

async function main() {
  mkdirSync(ROOT, { recursive: true });
  console.log("🟢 FinSight WhatsApp worker (multi-akun) berjalan. Memantau koneksi tiap akun...");
  await controlTick();
  setInterval(() => {
    controlTick().catch((e) => console.error("controlTick gagal:", e));
  }, TICK_MS);
}

main().catch((e) => {
  console.error("Worker WhatsApp gagal start:", e);
  process.exit(1);
});
