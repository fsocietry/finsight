#!/usr/bin/env bash
# Deploy lokal FinSight: build web (produksi) + (re)start web & worker via PM2.
#
#   npm run deploy
#
# Aman dijalankan berulang: kalau PM2 belum punya prosesnya → start; kalau sudah
# → restart dengan kode/ENV terbaru. Worker (tsx) tidak butuh build, tapi ikut
# di-restart agar memakai kode terbaru. Sesi WhatsApp tiap user tersambung ulang
# otomatis dari whatsapp/users/<userId>/ (tidak perlu scan ulang).
set -euo pipefail

cd "$(dirname "$0")/.."
PM2="npx pm2"
ECOSYSTEM="ecosystem.config.js"

echo "==> [1/3] Build produksi (prisma generate + next build)"
npm run build

echo "==> [2/3] (Re)start via PM2"
if $PM2 describe finsight-web >/dev/null 2>&1; then
  $PM2 restart "$ECOSYSTEM" --update-env
else
  $PM2 start "$ECOSYSTEM"
fi

echo "==> [3/3] Simpan daftar proses"
$PM2 save >/dev/null

echo
$PM2 status
echo
echo "✅ Deploy selesai. Web: http://localhost:3000 — logs: npm run pm2:logs"
