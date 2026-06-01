"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Camera, Loader2, Sparkles, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
}

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-ink/5 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/35 backdrop-blur-xl focus:border-[#0a84ff]/70 focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/40";

const emptyForm = () => ({
  amount: "",
  type: "expense" as "income" | "expense",
  description: "",
  date: new Date().toISOString().split("T")[0],
});

// Downscale + re-encode the photo so the upload stays small and OCR-friendly.
function fileToCompressedDataUrl(file: File, maxSize = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas tidak didukung"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [fromReceipt, setFromReceipt] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/transactions?all=1")
      .then((r) => r.json())
      .then((txs) => {
        setTransactions(Array.isArray(txs) ? txs : []);
        setLoading(false);
      });
  }, []);

  const resetForm = () => {
    setForm(emptyForm());
    setShowForm(false);
    setFromReceipt(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newTx = await res.json();
      setTransactions([newTx, ...transactions]);
      resetForm();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setScanError(null);
    setScanning(true);
    try {
      const image = await fileToCompressedDataUrl(file);
      const res = await fetch("/api/ai/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = await res.json();
      if (!res.ok || !data?.amount) {
        throw new Error(data?.error || "Struk tidak terbaca. Coba foto yang lebih jelas.");
      }
      setForm({
        amount: String(data.amount),
        type: "expense",
        description: data.description || "Belanja",
        date: data.date || new Date().toISOString().split("T")[0],
      });
      setFromReceipt(true);
      setShowForm(true);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Gagal memindai struk");
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Transaksi</h1>
          <p className="mt-1 text-ink/50">Catat pemasukan dan pengeluaran</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="btn btn-glass"
          >
            {scanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
            {scanning ? "Memindai..." : "Scan Struk"}
          </button>
          <button
            onClick={() => {
              setFromReceipt(false);
              setForm(emptyForm());
              setShowForm(!showForm);
            }}
            className="btn btn-glass"
          >
            <Plus size={18} />
            Tambah
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleScan}
        className="hidden"
      />

      {scanError && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-[#ff453a]/30 bg-[#ff453a]/10 px-4 py-3 text-sm text-[#ff453a]">
          <span>{scanError}</span>
          <button onClick={() => setScanError(null)} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>
      )}

      {showForm && (
        <div className="glass mb-6 rounded-3xl p-6">
          <h2 className="mb-4 font-semibold text-ink/90">
            {fromReceipt ? "Transaksi dari Struk" : "Transaksi Baru"}
          </h2>

          {fromReceipt && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#0a84ff]/30 bg-[#0a84ff]/10 px-4 py-2.5 text-sm text-[#0a84ff]">
              <Sparkles size={16} />
              Hasil pindai struk — periksa lalu simpan.
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex overflow-hidden rounded-xl border border-ink/12">
                {(["expense", "income"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      form.type === t
                        ? t === "expense"
                          ? "bg-[#ff375f] text-white"
                          : "bg-[#30d158] text-white"
                        : "bg-ink/5 text-ink/55 hover:bg-ink/10"
                    }`}
                  >
                    {t === "expense" ? "Pengeluaran" : "Pemasukan"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">Jumlah (Rp)</label>
              <input
                type="number"
                required
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-ink/70">Tanggal</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-ink/70">Deskripsi</label>
              <input
                type="text"
                required
                placeholder="Mis: Makan siang, Grab, dll"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={resetForm} className="btn btn-ghost">
                Batal
              </button>
              <button type="submit" disabled={submitting} className="btn btn-glass">
                {submitting ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass rounded-3xl">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-ink/40">
            <p>Belum ada transaksi. Tambah transaksi pertamamu.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/8">
            {transactions.map((t) => {
              const color = t.type === "income" ? "#30d158" : "#0a84ff";
              const Icon = t.type === "income" ? ArrowDownLeft : ArrowUpRight;
              return (
                <div key={t.id} className="group flex items-center justify-between px-6 py-4 transition-colors hover:bg-ink/5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: color + "22" }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{t.description}</p>
                      <p className="text-xs text-ink/45">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1 text-sm font-semibold ${t.type === "income" ? "text-[#30d158]" : "text-[#ff453a]"}`}>
                      {t.type === "income" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-ink/30 opacity-0 transition-all hover:text-[#ff453a] group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
