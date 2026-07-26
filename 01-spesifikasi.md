# LMS Mr Ole — Spesifikasi Proyek

## Ringkasan Produk
LMS untuk siswa Indonesia belajar bahasa Inggris melalui latihan soal dan penjelasan interaktif, dilengkapi dashboard progres belajar.

## Target Pengguna
Siswa Indonesia (pelajar/mahasiswa/umum) yang ingin belajar bahasa Inggris secara mandiri.

## Role Pengguna
| Role | Akses |
|------|-------|
| `siswa` | Mengerjakan soal, lihat progres, edit profil |

*(Admin akan ditambahkan di fase selanjutnya)*

## Fitur Utama

### Fase 1 — Fondasi & Auth
- Landing page
- Register, Login, Logout
- Verifikasi email
- Lupa & reset password
- Dashboard siswa

### Fase 2 — Latihan Soal
- Kategori soal: Grammar, Vocabulary, Reading, Listening, Speaking, Writing
- Pilih kategori & tingkat kesulitan (Mudah/Sedang/Sulit)
- Kerjakan soal (pilihan ganda, isian singkat)
- Lihat skor & pembahasan setelah selesai
- Riwayat pengerjaan

### Fase 3 — Progres & Statistik
- Dashboard progres (grafik perkembangan)
- Skor per kategori
- Total soal dikerjakan
- Rata-rata nilai
- Streak belajar

### Fase 4 — Chatbot AI (Mendatang)
- Tanya jawab bahasa Inggris
- Koreksi grammar
- Penjelasan materi

## Tech Stack
| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS 3 |
| Backend/API | Cloudflare Workers / Pages Functions |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Hosting | Cloudflare Pages |
| AI | Google Gemini API (via Cloudflare Worker) |
| Ikon | Lucide React |
| Grafik | Recharts |

## Tema Visual
- Modern, edukatif, profesional
- Mobile-first
- Dark mode
- Bahasa Indonesia (tampilan) + Inggris (materi)
