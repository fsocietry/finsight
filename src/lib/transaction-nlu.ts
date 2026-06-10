import { groq, GROQ_MODEL } from "./groq";

export type ParsedTxText = {
  is_transaction: boolean;
  type: "income" | "expense";
  amount: number;
  description: string;
  emoji: string;
  date: string; // YYYY-MM-DD
};

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/**
 * Mengklasifikasikan pesan teks: apakah pengguna SEDANG MENCATAT transaksi
 * (pemasukan/pengeluaran) dan mengekstrak nominal, deskripsi, tanggal. Dipakai
 * worker WhatsApp untuk membedakan "catat transaksi" vs "pertanyaan/chat".
 */
export async function parseTransactionText(
  message: string,
  today: Date = new Date()
): Promise<ParsedTxText> {
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prompt = `Hari ini: ${todayStr} (${HARI[today.getDay()]}). Semua nominal dalam Rupiah.

Tugasmu: tentukan apakah pesan pengguna adalah PENCATATAN transaksi keuangan pribadi (uang masuk/keluar), lalu ekstrak datanya.

Balas HANYA dengan JSON valid (tanpa teks lain), bentuk persis:
{
  "is_transaction": boolean,
  "type": "income" | "expense",
  "amount": number,
  "description": string,
  "emoji": string,
  "date": "YYYY-MM-DD"
}

Aturan:
- is_transaction=true HANYA jika pengguna mencatat uang yang masuk/keluar. Contoh true: "beli kopi 25rb", "bayar listrik 200k", "gaji masuk 5jt", "dapat bonus 1 juta", "jajan 15000".
- is_transaction=false untuk pertanyaan, sapaan, atau permintaan analisis. Contoh false: "pengeluaran bulan ini berapa?", "berapa saldoku", "halo", "tips hemat dong".
- type: "income" untuk uang MASUK (gaji, gajian, bonus, THR, dapat, terima, jual, hadiah uang, pemasukan, transfer masuk). "expense" untuk uang KELUAR (beli, bayar, belanja, jajan, top up, langganan).
- amount: angka murni tanpa pemisah ribuan. Pahami singkatan: "rb"/"ribu"/"k" = x1000; "jt"/"juta"/"m" = x1000000. Contoh: "25rb"=25000, "5jt"=5000000, "200k"=200000, "1,5jt"=1500000.
- description: ringkas, inti barang/sumber dananya (mis. "Kopi", "Listrik", "Gaji"). Awali huruf kapital.
- emoji: SATU emoji paling relevan dengan description (mis. ☕ kopi, ⚡ listrik, 💰 gaji, 🛒 belanja, 🍔 makan, 🛵 bensin). Default 💰 untuk income, 🧾 untuk expense.
- date: format YYYY-MM-DD. Pahami "hari ini"/"tadi"/"barusan"=hari ini; "kemarin"=kemarin; sebutan tanggal eksplisit dipakai apa adanya. Default hari ini (${todayStr}) jika tidak disebutkan.
- Jika is_transaction=false, field lain boleh diisi seadanya.

Pesan pengguna: "${message.replace(/"/g, "'")}"`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.1,
    max_tokens: 300,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const p = JSON.parse(raw) as Partial<ParsedTxText>;

  const amount = Number(p.amount);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || "") ? (p.date as string) : todayStr;

  return {
    is_transaction: Boolean(p.is_transaction),
    type: p.type === "income" ? "income" : "expense",
    amount: Number.isFinite(amount) ? Math.round(amount) : 0,
    description: (p.description || "").toString().slice(0, 80),
    emoji: (p.emoji || "").toString().slice(0, 8),
    date,
  };
}
