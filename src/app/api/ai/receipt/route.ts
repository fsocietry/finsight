import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { groq, GROQ_VISION_MODEL } from "@/lib/groq";

const PROMPT = `Kamu adalah pemindai struk belanja. Baca gambar struk/nota ini dan ekstrak informasinya.

Balas HANYA dengan JSON valid (tanpa teks lain) dengan bentuk persis:
{
  "is_receipt": boolean,   // true jika gambar adalah struk/nota belanja
  "merchant": string,      // nama toko/merchant, atau "Belanja" jika tidak terbaca
  "total": number,         // TOTAL akhir yang dibayar, angka saja tanpa pemisah ribuan, tanpa simbol mata uang
  "date": string           // tanggal transaksi format YYYY-MM-DD, atau "" jika tidak ada
}

Aturan:
- Mata uang umumnya Rupiah. Ambil nilai TOTAL/GRAND TOTAL akhir, bukan subtotal atau kembalian.
- "total" harus berupa angka murni, contoh: 45000 (bukan "Rp45.000").
- Jika gambar bukan struk belanja, set "is_receipt" ke false.`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { image } = await req.json();
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Gambar tidak valid" }, { status: 400 });
  }

  let parsed: { is_receipt?: boolean; merchant?: string; total?: number; date?: string };
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      temperature: 0.1,
      max_tokens: 512,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Gagal membaca struk. Coba lagi dengan foto yang lebih jelas." },
      { status: 502 }
    );
  }

  const total = Number(parsed.total);
  if (!parsed.is_receipt || !Number.isFinite(total) || total <= 0) {
    return NextResponse.json(
      { error: "Tidak menemukan struk atau total pada gambar." },
      { status: 422 }
    );
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(parsed.date || "") ? parsed.date : "";

  return NextResponse.json({
    type: "expense",
    description: (parsed.merchant || "Belanja").toString().slice(0, 80),
    amount: Math.round(total),
    date,
  });
}
