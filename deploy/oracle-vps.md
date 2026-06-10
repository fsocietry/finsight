# Menjalankan worker WhatsApp di Oracle Cloud (Always Free)

Worker (`npm run wa`) harus jalan 24/7 di mesin persisten. Web boleh tetap di
Vercel — keduanya berkomunikasi lewat **database** (Supabase) yang sama, jadi
worker **tidak butuh port masuk** sama sekali (hanya SSH untukmu).

> ⚠️ Jalankan worker **hanya di SATU tempat**. Kalau pindah ke VPS, **matikan
> worker di Mac** (`npx pm2 delete finsight-wa`) supaya dua worker tidak rebut
> sesi WhatsApp yang sama (bisa saling memutus / `connectionReplaced`).

---

## 1. Buat instance Always Free

1. Login [Oracle Cloud](https://cloud.oracle.com) → **Compute → Instances → Create**.
2. **Image:** Canonical **Ubuntu 22.04**.
3. **Shape:** pilih yang *Always Free eligible*:
   - `VM.Standard.A1.Flex` (ARM, mis. 1 OCPU / 6 GB) — atau
   - `VM.Standard.E2.1.Micro` (AMD, 1 GB).
4. Tambahkan **SSH key** (upload public key-mu).
5. Create. Catat **Public IP**.

Tidak perlu membuka port apa pun selain SSH (22) — worker hanya koneksi keluar.

## 2. SSH masuk & pasang Node + git

```bash
ssh ubuntu@<PUBLIC_IP>

# Node 20 (NodeSource) + git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v   # pastikan v20+
```

> Oracle Linux (bukan Ubuntu): ganti `apt-get` dengan `dnf`, user `opc`.

## 3. Clone repo & isi .env

```bash
cd ~
git clone https://github.com/fsocietry/finsight.git
cd finsight

# Buat .env — worker HANYA butuh 2 variabel ini:
cat > .env <<'EOF'
DATABASE_URL="postgresql://...samakan dengan Vercel/Supabase..."
GROQ_API_KEY="gsk_...samakan dengan punyamu..."
EOF
```

Salin nilai `DATABASE_URL` & `GROQ_API_KEY` **persis** dari `.env` lokal /
dashboard Vercel (harus DB yang sama dengan web).

## 4. Install dependency

```bash
# --include=dev wajib: worker dijalankan via tsx (devDependency)
npm install --include=dev
```

`postinstall` otomatis menjalankan `prisma generate` untuk arsitektur VPS.

## 5. Pasang service systemd (auto-restart + auto-start saat boot)

```bash
sudo cp deploy/finsight-wa.service /etc/systemd/system/finsight-wa.service
# Jika user/path beda dari default (ubuntu), edit dulu:
# sudo nano /etc/systemd/system/finsight-wa.service

sudo systemctl daemon-reload
sudo systemctl enable --now finsight-wa
```

Cek status & log:

```bash
systemctl status finsight-wa
journalctl -u finsight-wa -f      # log real-time (Ctrl+C untuk keluar)
```

## 6. Hubungkan WhatsApp

1. Matikan worker lama di Mac: `npx pm2 delete finsight-wa` (di Mac).
2. Buka web (Vercel), login, menu **WhatsApp → Hubungkan** → QR muncul.
3. Scan dari HP (nomor cadangan disarankan). Sesi tersimpan di VPS
   (`~/finsight/whatsapp/users/`), jadi scan cukup sekali — service
   menyambung ulang otomatis tiap reboot.

---

## Update kode nanti

```bash
cd ~/finsight
git pull
npm install --include=dev
sudo systemctl restart finsight-wa
```

## Alternatif: PM2 (kalau lebih suka)

```bash
npm install -g pm2
pm2 start ecosystem.config.js --only finsight-wa
pm2 save && pm2 startup   # ikuti perintah sudo yang dicetak
```

## Catatan risiko

- IP datacenter lebih rentan ditandai WhatsApp → **pakai nomor cadangan**.
- Worker tidak butuh inbound port; jangan buka port lain tanpa alasan.
