# Panduan Development di WSL

## Workspace Utama

Gunakan repository berikut untuk seluruh development:

```bash
/home/ardhi/projects/lms-MrOle
```

Folder lama di OneDrive hanya berfungsi sebagai cadangan sementara:

```bash
/mnt/c/Users/Lenovo/OneDrive/Desktop/lms-MrOle
```

Jangan menjalankan `npm install`, dev server, test, lint, atau build dari folder OneDrive.

## Memulai Sesi

```bash
cd ~/projects/lms-MrOle
pwd
git status
git pull --ff-only origin main
npm ci
```

Output `pwd` harus diawali `/home/ardhi/`, bukan `/mnt/c/`.

Untuk membuka VS Code dari WSL:

```bash
code ~/projects/lms-MrOle
```

Pastikan indikator VS Code menampilkan koneksi WSL.

## Environment dan Key

Konfigurasi lokal disimpan dalam `.env` dengan permission terbatas:

```bash
chmod 600 .env
```

Nama variabel browser mengikuti `.env.example`:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Cloudflare Pages Functions membutuhkan runtime variables berikut:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

Cloudflare juga membutuhkan Workers AI binding bernama `AI`.

Aturan keamanan:

- Jangan commit `.env`, token Cloudflare, service-role key, SMTP key, atau credential lainnya.
- Jangan menuliskan nilai key dalam dokumentasi, issue, log, screenshot, atau chat.
- Gunakan `.env.example` hanya untuk nama variabel dan contoh placeholder.
- Simpan backup credential di password manager atau secret manager, bukan di repository.

## Alur Development

```bash
npm run dev
```

Buat commit lokal secara bertahap. Sebelum push, jalankan:

```bash
npm test
npm run lint
npm run build
git diff --check
git status
```

Push hanya setelah perubahan selesai dan seluruh pemeriksaan yang relevan lulus:

```bash
git push origin main
```

Gunakan halaman live untuk QA akhir setelah workflow deployment berhasil. Gunakan localhost WSL untuk iterasi development agar perubahan kecil tidak selalu memicu deployment produksi.

## Pemeriksaan Lokasi

Gunakan perintah berikut jika ragu workspace sedang dibuka dari mana:

```bash
pwd
df -T .
```

Workspace yang benar menggunakan filesystem `ext4`. Jika path diawali `/mnt/c/` atau filesystem menunjukkan `9p`, hentikan proses dan buka kembali repository dari `/home/ardhi/projects/lms-MrOle`.

## Pemulihan `.env`

Jika `.env` hilang, salin dari backup tepercaya tanpa menampilkan isinya, lalu kunci permission:

```bash
install -m 600 /path/backup/.env ~/projects/lms-MrOle/.env
```

Verifikasi bahwa Git tetap mengabaikannya:

```bash
git check-ignore .env
```
