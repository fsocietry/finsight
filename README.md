# FinSight

**Kelola keuangan pribadi lebih cerdas dengan AI.** Aplikasi web untuk mencatat pemasukan & pengeluaran, menganalisis keuangan, scan struk belanja otomatis, dan ngobrol dengan asisten finansial AI — dengan tampilan bergaya *macOS liquid glass*, tema terang/gelap, dan responsif di HP, tablet, maupun desktop.

## ✨ Fitur

- 📊 **Dashboard** — ringkasan saldo, pemasukan, pengeluaran, dan grafik bulan berjalan.
- 💸 **Transaksi** — catat pemasukan/pengeluaran dengan cepat.
- 📷 **Scan Struk (AI)** — foto struk belanja, AI otomatis membaca merchant, total, dan tanggal lalu mengisi form transaksi untuk kamu periksa & simpan.
- 📈 **Analitik** — rincian pengeluaran, tingkat tabungan, dan distribusi pengeluaran.
- 🤖 **AI Chat** — asisten keuangan yang menjawab pertanyaan berdasarkan data transaksimu (khusus topik keuangan).
- 🌗 **Tema terang & gelap** dengan toggle, tersimpan otomatis.
- 📱 **Responsif** — sidebar menjadi menu burger di layar HP/tablet.

## 🛠️ Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack) + React 19
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Prisma 7](https://www.prisma.io/) + PostgreSQL (driver adapter `@prisma/adapter-pg`)
- [NextAuth.js](https://next-auth.js.org/) — login Google OAuth
- [Groq](https://groq.com/) — AI chat (Llama 3.3) & vision untuk scan struk (Llama 4 Scout)
- [Recharts](https://recharts.org/) untuk grafik, [lucide-react](https://lucide.dev/) untuk ikon

## 🚀 Menjalankan Secara Lokal

### Prasyarat
- Node.js 18+ dan npm
- Database PostgreSQL (mis. [Supabase](https://supabase.com/) / Neon / lokal)
- Google OAuth Client ID & Secret
- Groq API key (gratis di [console.groq.com](https://console.groq.com/))

### Langkah

```bash
# 1. Install dependency
npm install

# 2. Buat file .env (lihat tabel di bawah), lalu sinkronkan schema ke database
npx prisma db push

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## 🔑 Environment Variables

Buat file `.env` di root proyek:

| Variabel | Keterangan |
| --- | --- |
| `DATABASE_URL` | Connection string PostgreSQL |
| `NEXTAUTH_URL` | URL aplikasi (lokal: `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | String acak (buat dengan `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GROQ_API_KEY` | API key Groq untuk fitur AI |

> **Google OAuth:** tambahkan `http://localhost:3000/api/auth/callback/google` ke *Authorized redirect URIs* di Google Cloud Console.

## ☁️ Deploy ke Vercel

1. Push repo ini ke GitHub, lalu import ke [Vercel](https://vercel.com/).
2. Isi semua environment variable di atas pada **Project Settings → Environment Variables**.
3. Set `NEXTAUTH_URL` ke domain produksimu, mis. `https://finsight.vercel.app`.
4. Tambahkan redirect URI produksi di Google Cloud Console:
   `https://<domain-kamu>/api/auth/callback/google`
5. Deploy. Script `build` sudah menjalankan `prisma generate` secara otomatis.

> Database PostgreSQL harus bisa diakses dari internet (Supabase/Neon sudah memenuhi).

## 📁 Struktur Singkat

```
src/
├── app/              # Halaman & API route (App Router)
│   ├── (auth)/login  # Halaman login
│   ├── dashboard/    # Dashboard
│   ├── transactions/ # Transaksi + scan struk
│   ├── analytics/    # Analitik
│   ├── chat/         # AI chat
│   └── api/          # Route handler (transactions, ai/chat, ai/receipt, auth)
├── components/       # Komponen UI (layout, charts, theme, ui)
├── lib/              # Prisma, auth, groq, util
└── types/            # Tipe TypeScript
prisma/schema.prisma  # Skema database
```
