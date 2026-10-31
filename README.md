# LMS Mr Ole

Platform latihan dan kuis Bahasa Inggris untuk siswa Indonesia — belajar lewat
soal interaktif dengan pembahasan, sambil memantau progres sendiri.

**Live:** https://lms-mrole.pages.dev

## Fitur

- **Latihan & kuis** — kategori Grammar, Vocabulary, Reading, Listening,
  Speaking, Writing dengan tingkat kesulitan; sesi kuis 20 soal yang
  dikelola server (urutan soal & opsi tersimpan sebagai snapshot).
- **Hasil & pembahasan** — skor, ringkasan jawaban benar/salah, ekspor PDF,
  dan kartu pencapaian yang bisa dibagikan (tautan publik dapat dicabut).
- **Gamifikasi** — XP, level, streak belajar harian, dan leaderboard.
- **AI chat ("Mr Ole")** — tanya jawab materi dan koreksi grammar lewat
  endpoint `functions/api/chat.js` (Cloudflare Workers AI). Endpoint ini
  mewajibkan token login Supabase yang valid.
- **Akun & peran** — register, login, verifikasi email, lupa/reset password
  (Supabase Auth); panel admin untuk kategori, bank soal, pengguna, dan log
  aktivitas.
- **Dua bahasa UI** — Indonesia & Inggris (i18next), mode gelap, mobile-first.

## Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 19, Vite 6, React Router 7, Tailwind CSS 3 |
| Backend/API | Cloudflare Pages Functions (`functions/`) |
| Database & Auth | Supabase (PostgreSQL + Auth + RLS, lihat `supabase/migrations/`) |
| AI | Cloudflare Workers AI (`@cf/meta/llama-3.2-3b-instruct`) |
| Hosting | Cloudflare Pages (auto-deploy dari `main` via `.github/workflows/deploy.yml`) |
| Testing | Vitest + Testing Library, Playwright (e2e), Lighthouse CI |

Arsitektur lengkap: [`04-arsitektur.md`](04-arsitektur.md) ·
Desain: [`DESIGN.md`](DESIGN.md) · Status: [`PROJECT-STATUS.md`](PROJECT-STATUS.md)

## Menjalankan secara lokal

Butuh Node.js 20+ dan proyek Supabase sendiri.

```bash
npm ci
cp .env.example .env   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev
```

Skema database ada di `supabase/migrations/` dan `supabase/FULL_SCHEMA.sql`;
data awal di `supabase/seed/`.

Untuk endpoint AI chat di produksi, atur di dashboard Cloudflare Pages:
runtime variables `SUPABASE_URL` & `SUPABASE_ANON_KEY`, serta binding
Workers AI bernama `AI` (lihat `.env.example`).

## Perintah

```bash
npm run lint               # ESLint (termasuk gate no-undef & react/jsx-no-undef)
npm run lint:service-seam  # pages/hooks tidak boleh import supabase langsung
npm test                   # unit test (Vitest)
npm run build              # build produksi
npm run test:e2e           # Playwright (perlu browser terpasang)
```

CI (`.github/workflows/ci.yml`) menjalankan lint, service-seam, unit test,
dan build pada setiap push/PR ke `main`.

## Lisensi

MIT — lihat [`LICENSE`](LICENSE).
