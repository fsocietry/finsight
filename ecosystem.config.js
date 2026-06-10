// PM2 process manager — menjaga web FinSight & worker WhatsApp tetap berjalan.
//
// Pakai:
//   npm run build              # build web untuk produksi (sekali, & tiap ada perubahan)
//   npx pm2 start ecosystem.config.js
//   npx pm2 status             # lihat status
//   npx pm2 logs               # lihat log gabungan
//   npx pm2 restart all        # restart keduanya
//   npx pm2 save               # simpan daftar proses (untuk auto-start saat boot)
//
// Catatan: keduanya membaca .env sendiri (Next otomatis; worker via dotenv).
const path = require("path");

module.exports = {
  apps: [
    {
      name: "finsight-web",
      // Jalankan `next start` (mode produksi). Wajib `npm run build` lebih dulu.
      script: path.join(__dirname, "node_modules/next/dist/bin/next"),
      args: "start",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 15,
      env: { NODE_ENV: "production", PORT: "3000" },
    },
    {
      name: "finsight-wa",
      // Worker WhatsApp multi-akun (Baileys) dijalankan via tsx.
      script: path.join(__dirname, "node_modules/tsx/dist/cli.mjs"),
      args: "whatsapp/worker.ts",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 15,
      restart_delay: 3000, // jeda agar tidak spam reconnect ke WhatsApp
      env: { NODE_ENV: "production" },
    },
  ],
};
