"use client";

import { useEffect, useState } from "react";
import {
  Smartphone,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Receipt,
  MessageCircle,
  Plug,
  Unplug,
} from "lucide-react";

type Status = {
  connection: "offline" | "starting" | "qr" | "open" | "close";
  qr: string | null;
  code?: number;
  updatedAt?: string;
};

export default function WhatsAppPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
        const data = await res.json();
        if (active) setStatus(data);
      } catch {
        /* abaikan; coba lagi tick berikutnya */
      }
    };
    poll();
    const id = setInterval(poll, 2500);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const connect = async () => {
    setBusy(true);
    try {
      await fetch("/api/whatsapp/connect", { method: "POST" });
      setStatus({ connection: "starting", qr: null });
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      setStatus({ connection: "offline", qr: null });
    } finally {
      setBusy(false);
    }
  };

  const conn = status?.connection;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink/10">
          <Smartphone size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">WhatsApp</h1>
          <p className="text-sm text-ink/50">
            Hubungkan WhatsApp-mu untuk mencatat transaksi & chat keuangan dari HP.
          </p>
        </div>
      </div>

      <div className="glass flex flex-col items-center gap-5 rounded-3xl p-8 text-center">
        {!status && (
          <div className="flex items-center gap-2 text-ink/55">
            <Loader2 className="animate-spin" size={18} /> Memuat status...
          </div>
        )}

        {conn === "offline" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink/10">
              <QrCode size={30} className="text-ink/50" />
            </div>
            <div>
              <p className="font-medium">WhatsApp belum terhubung</p>
              <p className="mt-1 text-sm text-ink/50">
                Hubungkan akunmu untuk mulai mencatat transaksi lewat WhatsApp.
              </p>
            </div>
            <button
              onClick={connect}
              disabled={busy}
              className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Plug size={16} />}
              Hubungkan WhatsApp
            </button>
          </>
        )}

        {conn === "starting" && (
          <div className="flex items-center gap-2 text-ink/55">
            <Loader2 className="animate-spin" size={18} /> Menyiapkan koneksi WhatsApp...
          </div>
        )}

        {conn === "qr" && status?.qr && (
          <>
            <p className="font-medium">Scan untuk menghubungkan</p>
            <div className="rounded-2xl bg-white p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={status.qr} alt="QR WhatsApp" width={280} height={280} className="rounded-lg" />
            </div>
            <ol className="space-y-1 text-left text-sm text-ink/60">
              <li>1. Buka WhatsApp di HP</li>
              <li>
                2. <b>Setelan → Perangkat Tertaut → Tautkan perangkat</b>
              </li>
              <li>3. Arahkan kamera ke QR di atas</li>
            </ol>
            <p className="flex items-center gap-1.5 text-xs text-ink/40">
              <RefreshCw size={12} /> QR menyegar otomatis — tidak perlu refresh halaman.
            </p>
            <button onClick={disconnect} disabled={busy} className="text-xs text-ink/45 underline hover:text-ink/70">
              Batalkan
            </button>
          </>
        )}

        {conn === "close" && (
          <div className="flex items-center gap-2 text-ink/55">
            <Loader2 className="animate-spin" size={18} />
            Koneksi terputus{status?.code ? ` (kode ${status.code})` : ""}, menyambung ulang...
          </div>
        )}

        {conn === "open" && (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-lg font-semibold">WhatsApp tersambung</p>
              <p className="mt-1 text-sm text-ink/50">Transaksi & chat dari WhatsApp masuk ke akun ini.</p>
            </div>
            <div className="w-full space-y-2 text-left text-sm text-ink/65">
              <div className="flex items-start gap-2.5 rounded-2xl bg-ink/5 px-4 py-3">
                <Receipt size={18} className="mt-0.5 shrink-0 text-ink/45" />
                <span>
                  <b>Kirim foto struk</b> → otomatis tercatat sebagai pengeluaran.
                </span>
              </div>
              <div className="flex items-start gap-2.5 rounded-2xl bg-ink/5 px-4 py-3">
                <MessageCircle size={18} className="mt-0.5 shrink-0 text-ink/45" />
                <span>
                  <b>Kirim teks</b> (mis. &ldquo;beli kopi 25rb&rdquo; atau &ldquo;pengeluaran bulan ini berapa?&rdquo;)
                  → dicatat atau dijawab AI.
                </span>
              </div>
            </div>
            <p className="text-xs text-ink/40">
              Gunakan chat <b>&ldquo;Pesan ke Diri Sendiri&rdquo;</b> di HP yang men-scan QR.
            </p>
            <button
              onClick={disconnect}
              disabled={busy}
              className="flex items-center gap-2 rounded-2xl border border-ink/15 px-4 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-50"
            >
              {busy ? <Loader2 className="animate-spin" size={15} /> : <Unplug size={15} />}
              Putuskan
            </button>
          </>
        )}
      </div>
    </div>
  );
}
