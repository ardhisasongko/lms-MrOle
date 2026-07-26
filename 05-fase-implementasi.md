# LMS Mr Ole — Fase Implementasi

## Fase 1 — Fondasi
- [ ] Inisialisasi project (Vite + React + Tailwind)
- [ ] Struktur folder
- [ ] Design system (warna, font, spacing)
- [ ] Layout (AuthLayout, MainLayout, DashboardLayout)
- [ ] Landing page
- [ ] Routing + protected routes
- [ ] Halaman error (404, error)

## Fase 2 — Autentikasi
- [ ] Setup Supabase project
- [ ] Migration tabel `profiles` + RLS
- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Verifikasi email
- [ ] Lupa & reset password
- [ ] Profil pengguna (edit nama, avatar)

## Fase 3 — Latihan Soal
- [ ] Migration tabel `categories`, `questions`
- [ ] Seed data (kategori + soal contoh)
- [ ] Halaman pilih kategori & level
- [ ] Halaman kerjakan soal
- [ ] Submit jawaban + hitung skor
- [ ] Halaman hasil & pembahasan
- [ ] Migration tabel `quiz_attempts`, `quiz_answers`

## Fase 4 — Dashboard Progres
- [ ] Migration tabel `learning_streaks` + RLS
- [ ] Statistik utama (total soal, rata-rata, streak)
- [ ] Grafik perkembangan (Recharts)
- [ ] Skor per kategori
- [ ] Riwayat latihan
- [ ] Filter & pagination riwayat

## Fase 5 — Admin (Mendatang)
- [ ] Role admin
- [ ] Manajemen soal (CRUD)
- [ ] Manajemen kategori
- [ ] Lihat statistik pengguna

## Fase 6 — Chatbot AI
- [x] Cloudflare Worker + Gemini API (`functions/api/chat.js`)
- [x] Chat interface (`src/pages/Chat.jsx`)
- [x] Koreksi grammar
- [x] Tanya jawab materi
- [ ] Daftar API key gratis di https://aistudio.google.com/apikey
