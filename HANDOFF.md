HANDOFF CONTEXT
===============

USER REQUESTS (AS-IS)
---------------------
- "mari kita mulai dari file bernama handoff"
- "kita sudah membuat halaman dashboard untuk admin di lms mrole, tetapi belum ada history nya di admin. buatkan log aktivitas admin yang mencatat aktivitas admin semisal menghapus user , menambah soal , mengubah kategori , dan lain nya, dan muncul di dashboard admin"
- "analisis architecture aplikasi lms mrole, cari celah untuk improvement, buatkan laporan visual html"
- "lanjut ke candidate #2"
- "sblm lanjut ke candidate #3, saya mau make sure selesai , kamu bilagn akses ke supabase langsung dari komponen , maksudnay gmana ?"
- "iya, kalo bisa di rubah menjadi langssung, kalo btuh install ga apa2, supaya lebih otomatis"
- "install supabase CLI"
- "rangkum semua kerjaan kita skrang, agar bisa di lanjutkan di sesi berikutnya"
- "apakah sudah di rangkum dan di tuli di file handoff"
- "lanjut ke build dan deploy"
- "catat temuan tersebut dalam file handoff"
- "What did we do so far?"
- "Continue if you have next steps, or stop and ask for clarification if you are unsure how to proceed."
- "commit and push"
- "apakah sudah beres ?"
- "tulis semua progres dan pekerjaan kedalam file handoff"

GOAL
----
Semua architecture candidate selesai, database ter-migrate dan ter-seed, share hasil quiz tersedia, serta quiz production memakai server-side session aman dengan bank 2.000 soal dan batas 20 soal per sesi non-retry.

WORK COMPLETED
--------------
=== Sesi 1 ===
- Created admin activity log system with RLS-protected admin_logs table (migration 007), Supabase trigger logging INSERT/UPDATE/DELETE on admin-managed tables, and display on admin dashboard
- Ran full architecture review using /improve-codebase-architecture — identified 5 improvement candidates (Component Optimization, Data Access Layer, Code Quality Patterns, State Management, Performance)

=== Sesi 2 ===
- Candidate #2 (Data Access Layer) — service seam between pages/hooks and Supabase
- Created service files: services/auth.js, services/streaks.js, services/storage.js
- Extended existing services: services/users.js (getProfile, upsertProfile, getLeaderboard, getAdminActivityLog), services/quiz.js (getAttempts, getAttemptDetails, getRecentAttempts)
- Refactored 5 pages + 4 hooks to use services (no direct supabase calls)
- ESLint no-restricted-imports + build check script (scripts/check-service-seam.mjs)
- Fixed seed paths in supabase/config.toml
- Candidate #3 (Code Quality Patterns) — src/utils/errors.js (normalizeError, handleError)
- Refactored 10+ catch blocks, zero console.error in src/

=== Sesi 3 ===
- Candidate #1 (Component Optimization) — React.memo on Navbar, StreakCard, ConfirmModal, ErrorState, EmptyState, LanguageSwitcher
- useCallback on 5 Quiz.jsx handlers
- Candidate #4 (State Management) — auth role merged into AuthContext; prop drilling eliminated from MainLayout/DashboardLayout
- useQuestions standardized on useAsync; useAdmin simplified
- Candidate #5 (Performance) — useMemo on filter/sort arrays in History.jsx, BookmarkReview.jsx, admin/Users.jsx
- Removed 6 unused icon imports
- All commits pushed to GitHub via SSH

=== Sesi 6 ===
- Ran Playwright tests — 18/18 PASS (mobile 375px + desktop 1280px), zero console errors, zero horizontal scroll
- Ran Lighthouse CI — fixed ALL errors:
  - ✅ SEO 1.0: added meta-description, fixed favicon 404 (inline data URI)
  - ✅ Best Practices 1.0: fixed console errors
  - ✅ Accessibility 1.0: fixed color contrast (cta-500 #22c55e → #15803d, primary-500 #ED8476 → #D96B5E)
  - ✅ Source maps: 'hidden' mode for production
- Pending: performance 0.55 — render-blocking (Google Fonts) + speed-index, akan lebih baik di Cloudflare CDN
- Committed all fixes

=== Sesi 5 ===
- Project pindah dari Windows (/mnt/c/...) ke WSL native (~/projects/lms-MrOle) — npm install 2m
- Installed Playwright v1.62.0 + browser chromium
- Created playwright.config.js — dual project: mobile (375px) + desktop (1280px)
- Created e2e/pages.spec.js — smoke tests for all public pages, responsive layout checks, console error detection
- Created .lighthouserc.js — Lighthouse CI config (performance ≥60, accessibility ≥80, best-practices ≥80, SEO ≥80)
- Created scripts/auto-fix.mjs — rule-based fixes (horizontal scroll, aria-label, alt text) + optional AI via OpenAI/Anthropic
- Created .github/workflows/ci-fix.yml — full pipeline: test → auto-fix (max 3 attempts) → PR jika gagal
- Updated package.json scripts: test:e2e, test:e2e:ui, test:lighthouse, fix:auto
- DESIGN.md: design token system documentation
- Migrated Inter font self-hosting, removed Google Fonts render-blocking
- Fixed color contrast, SEO, and console errors for Lighthouse

=== Sesi 6 ===
- Mobile Navbar: toggle dark mode + bahasa pindah ke top bar (icon only), login/register dihapus dari hamburger, hamburger hanya untuk logged-in user
- Desktop Navbar: seamless — hapus mt-4, rounded-2xl, border, shadow-clay; bg-white/70 → bg-white/20
- Navbar dark mode harmony: dark:bg-gray-950/40 agar menyatu dengan gradient AuthLayout
- Code-split: chunk pdf dipecah jadi pdf-js (jspdf) + pdf-canvas (html2canvas); chunkSizeWarningLimit → 1000
- Test 3/3 passed (src/services/__tests__/quiz.test.js)

=== Sesi 7 ===
- Quiz.jsx: instant feedback — setelah jawab soal, langsung tampil hijau (benar) / merah (salah) + jawaban benar, opsi disable
- QuizResult.jsx: score count-up animation (ease-out cubic, 800ms)
- Dashboard.jsx: Level & XP system — level dihitung dari total jawaban benar × 10, progress bar ke level berikutnya
- AuthContext: fix refresh redirect — loading initialState diubah false → true agar tidak redirect ke /login sebelum session ter-load

=== Sesi 8 (Bug Fix & Security Audit) ===
- Fix 1.1: Menambahkan import XCircle di Quiz.jsx (crash saat jawab salah)
- Fix 1.2: Menambahkan import handleError di QuizResult.jsx (crash saat export/share gagal)
- Fix 1.3: ESLint config — aktifkan js.configs.recommended + eslint-plugin-react (no-undef, react/jsx-no-undef)
- Fix 1.4: Rules of Hooks — semua useCallback/useEffect/useMemo dipindahkan sebelum early return di Quiz.jsx
- Fix 1.4: Keyboard shortcut useEffect — tambahkan handleAnswer/handleNext ke dependency array
- Fix 1.4: Test environment — ganti jsdom → happy-dom (vite.config.js)
- Fix 2.1: Migration 009 — privilege escalation role: guard trigger + WITH CHECK pada profiles_update_own
- Fix 2.2: Migration 009 — created questions_public view (future use)
- Fix 2.3: Migration 009 — perkuat submit_quiz (division-by-zero guard, dedup, question validation, search_path)
- Fix 2.3: Migration 009 — search_path pada is_admin(), handle_new_user(), log_admin_action()
- Fix 2.3: Migration 009 — is_admin() check pada log_admin_action()
- Fix 2.4: deleteUser pindah ke server function (functions/api/delete-user.js) — tidak bisa dari browser
- Fix 2.5: chat.js — verifikasi JWT Supabase + validasi panjang message (2000 char max)
- Fix 3.3: Dashboard — "Skor per Kategori" → "Grafik Harian"; Ringkasan card diubah
- Fix 3.6: IS_DEMO — dikontrol via VITE_DEMO=true eksplisit, env kosong → throw error
- Fix 4.1: Landing dark mode — tambahkan ~40 dark: kelas teks di seluruh halaman
- Fix 4.2: Kontras stat numbers (primary-300 → primary-600 dst) untuk WCAG AA
- Fix 4.3: Fix color scale — primary-600 lebih gelap dari 500; cta-500/600/700 monotonic
- Fix 4.3: safelist dikosongkan (kelas literal sudah terdeteksi Tailwind)
- Package.json: added eslint-plugin-react@^7.37.0

=== Sesi 4 ===
- Installed Supabase CLI v2.110.0 di ~/.local/bin/supabase
- supabase link ke project ref: agtchlndnwircawmdaom
- Fix migration 007: added DROP POLICY IF EXISTS guards for idempotent retries
- supabase migration repair — semua 9 migration ditandai applied & di-push
- supabase db query --linked — seed data (seed.sql + english-questions.sql) ter-load
- npm run build — sukses (4m 4s, npm slow di WSL)
- git commit + push ke main
- Cloudflare Pages auto-deploy (https://lms-mrole.pages.dev)

=== Sesi 9 (Deploy, DB Fix, UI Polish) ===
- Quiz crash (XCircle) di produksi — root cause: versi lama masih live karena auto-deploy GitHub→Cloudflare Pages MATI (berhenti di commit 9f7c472 / Sesi 7)
- Migration 008 (bookmarks) sebelumnya tidak pernah benar-benar dibuat — record tracking dihapus lalu di-repush dengan --include-all
- Verifikasi tabel bookmarks via REST (HTTP 200); migration 009 security fixes ter-apply
- Security alert Supabase: view leaderboard_ranking SECURITY DEFINER → migration 010, diganti RPC get_leaderboard() dengan SET search_path, REVOKE dari PUBLIC/anon, GRANT ke authenticated; src/services/users.js pakai supabase.rpc('get_leaderboard')
- Deploy manual via wrangler berhasil: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID → npx wrangler pages deploy dist --project-name lms-mrole --branch main; nilai secret tidak dicatat di repository
- Fix: hapus instant feedback di Quiz.jsx — tidak lagi menampilkan benar/salah saat menjawab, opsi tidak di-disable (bisa ganti jawaban), suara playCorrect/playWrong dihapus; jawaban benar hanya tampil di QuizResult
- Fix migration 011: submit_quiz error "column reference ans is ambiguous" — loop variable ans bentrok alias SQL ans di INSERT quiz_answers → ganti ke v_ans
- Fix migration 012: submit_quiz error "column reference q.id is ambiguous" — variabel q bentrok alias JOIN questions q → ganti alias ke qq
- Fix dark mode: DashboardLayout & AdminLayout tidak punya toggle dark mode sama sekali (HP siswa tidak bisa ganti tema) → tambah toggle Sun/Moon di header mobile + sidebar; useDarkMode tambah listener storage agar instance sinkron

=== Sesi 10 (Mobile Name Truncate Fix + Dashboard Motivasi Siswa) ===
- Fix truncate username/nama user di mobile: Leaderboard.jsx, admin/Users.jsx, admin/Dashboard.jsx — ganti class `truncate` → `break-words leading-snug` agar nama panjang tampil penuh (wrap), tidak kepotong
- Token Cloudflare Pages disalin dari OneDrive Desktop Windows (/mnt/c/Users/Lenovo/OneDrive/Desktop/lms-MrOle/Front Err/token-cloudflare.txt) ke ~/projects/lms-MrOle/Front Err/token-cloudflare.txt
- Front Err/token-cloudflare.txt masuk .gitignore agar tidak ter-push ke GitHub (terverifikasi via git check-ignore)
- Dashboard: kartu statistik jadi link interaktif — Level→/practice, Total Soal→/history, Rata-rata Nilai→/history, Streak→/practice, Bookmark→/bookmarks (hover effect + Card hover={false} + h-full)
- Dashboard motivasi siswa (5 saran diterapkan, semua pakai data yang sudah ada di useProgress/useStreak — arsitektur service seam utuh):
  1. CTA header dinamis sesuai kondisi: belum latihan / quest harian belum selesai (sisa X soal) / streak ≥3 / quest selesai
  2. Banner CTA "Mulai Latihan" selalu terlihat di atas dashboard (bukan hanya saat data kosong)
  3. Insight "Skor per Kategori": baris 💪 Terkuat & 🎯 Perlu ditingkatkan
  4. Banner pujian kenaikan skor: "Skormu naik X poin dibanding kemarin" (hitung dari chartData hari ini vs kemarin)
  5. Info "Latihan terakhir: X menit/jam/hari lalu" (timeAgo dari stats.lastSession)
- Fix banner CTA mobile: layout sebelumnya 1 baris menumpuk → di HP jadi 2 baris (ikon+teks atas, tombol lebar penuh di bawah); desktop tetap 1 baris (flex-col sm:flex-row + w-full sm:w-auto)
- Commit Sesi 10: 45b7e88 (dashboard motivasi + stat cards + truncate fix), d0ded7b (fix banner CTA mobile)
- Deploy live via wrangler manual: https://lms-mrole.pages.dev

=== Sesi 11 (Auto-Deploy GitHub → Cloudflare Pages FIXED) ===
- Auto-deploy GitHub→Cloudflare Pages sudah diperbaiki dan BERFUNGSI — akar masalah: package-lock.json tidak sinkron dengan package.json, sehingga step `npm ci` di GitHub Actions gagal (exit code 1 dalam ~10 detik). Bukan masalah koneksi Cloudflare
- Buat .github/workflows/deploy.yml — workflow deploy otomatis: push ke main → npm ci → npm run build → deploy via cloudflare/pages-action@v1 (projectName lms-mrole, directory dist)
- Perlu 2 secrets di GitHub: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID — sudah ditambahkan user; nilai secret tidak dicatat di repository
- Regenerasi package-lock.json (npm install) agar sinkron → `npm ci` lokal berhasil
- Commit: 26faba4 (workflow deploy), 7d364fe (handoff Sesi 10), 7a24493 (regenerate package-lock)
- Workflow run #3 SUCCESS — auto-deploy aktif, https://lms-mrole.pages.dev HTTP 200
- Sejak ini: TIDAK perlu wrangler manual lagi; setiap push ke main auto-build + auto-deploy

=== Sesi 12 (Git Sync, Fix Build Produksi, Custom Email Templates, SMTP Brevo) ===
- Git sync: local kalah 18 commit dari remote + 15 file modified + 6 untracked. Awalnya commit lalu merge (74f5178) tapi muncul 7 konflik → user memutuskan RESET HARD ke origin/main, hanya file non-gitignored yang dipertahankan (.opencode/opencode-vision.json di-backup & di-restore; Front Err/ + *.zip yang gitignored dihapus). Local kini persis remote (9ec3c4f)
- Fix Build Produksi: error "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured" di bundle produksi — root cause: .env gitignored, deploy.yml tidak menyuntik env vars di CI. Fix: tambah env VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY di step build deploy.yml (dari GitHub secrets), user sudah menambahkan 2 secrets. Commit 0cbcf7e. Produksi lms-mrole.pages.dev HTTP 200, error hilang
- Email konfirmasi custom brand "Mr Ole": dibuat 5 template HTML di supabase/templates/ (confirm, reset-password, magic-link, invite, email-change) dengan warna brand (primary #D96B5E, cta hijau) + variabel {{ .ConfirmationURL }}/{{ .SiteURL }}
- Supabase free tier (project baru sejak 3 Juni 2026) TIDAK bisa kustom template dengan default SMTP — harus pakai custom SMTP (berlaku di free tier juga)
- Setup SMTP Resend pertama (onboarding@resend.dev) — berhasil tapi resend.dev hanya bisa kirim ke email akun sendiri (403 untuk email lain), butuh domain verified untuk produksi
- User tidak punya uang → ganti ke Brevo (gratis, 300 email/hari, tanpa domain): host smtp-relay.brevo.com, port 587; kredensial disimpan di secret manager dan tidak di repository
- Fix error Brevo "Unauthorized IP address": IP AWS 54.254.203.116 (outbound Supabase) di-authorize di Brevo → Authorized IPs; SMTP keys IP blocking di-DEACTIVATE (IP Supabase dinamis, tidak bisa di-whitelist satu-satu)
- URL Configuration Supabase di-update via Management API: site_url → https://lms-mrole.pages.dev, uri_allow_list = produksi + localhost (dev). config.toml lokal di-sync
- Semua 5 template email (subject + HTML) di-pasang ke produksi via API PATCH config/auth — TERVERIFIKASI: user dapat email konfirmasi branded Mr Ole di Gmail (subject "Konfirmasi email kamu — Mr Ole", header coral, tombol hijau)
- Sender aktif: Mr Ole <ardhisasongko71@gmail.com> (email sender terverifikasi di Brevo)
- Fix node_modules korupsi (OneDrive tidak sync file): file .mjs hilang (dompurify, @supabase/postgrest-js) → build error "Failed to resolve entry". Hapus + reinstall dompurify & @supabase/supabase-js → build pass (1m30s). Root cause khas OneDrive: kalau error resolve entry lagi, reinstall paket tsb
- Commit Sesi 12: 0cbcf7e (deploy.yml env vars), 817bf60 (template email + site_url config.toml), 9310d6f (reinstall paket @supabase + dompurify)

=== Sesi 13 (Runtime Config dan AI Chat Mobile) ===
- Memperbaiki authenticated AI chat serta verifikasi JWT di Cloudflare Function; menambahkan test API chat
- Menambahkan runtime public config endpoint agar konfigurasi Supabase dapat dimuat saat aplikasi berjalan, tidak hanya saat build
- Menambahkan dukungan runtime config bootstrap di Vite
- Mengoptimalkan layout chat pada mobile dan mencegah input/kontrol saling menimpa
- Commit terkait: 79b80c1, aab6f57, 2451623, a767f18, 96fb5ae, 3e964e1

=== Sesi 14 (Share Hasil Quiz) ===
- Menambahkan achievement card dan modal share hasil quiz
- Menambahkan public quiz share/challenge route, service share, migration 013_quiz_shares.sql, RLS/RPC terkait, dan regression tests
- Menambahkan share format Feed 1080x1350 dan Story 1080x1920
- Menyimpan pilihan format share pengguna secara lokal
- Memperbarui copy Bahasa Indonesia/Inggris, DESIGN.md, navigasi, dan layout hasil quiz
- Commit: 2ec7da1 (shareable quiz achievements), c576405 (Story share format)

=== Sesi 15 (Secure Quiz Sessions dan Bank 2.000 Soal) ===
- Mengganti alur quiz lama menjadi server-side quiz session melalui RPC start_quiz_session, save_quiz_session_answer, dan submit_quiz_session
- Sesi normal, adaptive, timed, dan challenge selalu 20 soal; retry hanya soal salah dengan batas 1-20
- Soal memiliki cooldown 5 menit per pengguna; fallback memilih soal yang paling lama ditampilkan
- Urutan soal dan opsi diacak satu kali lalu disimpan sebagai snapshot sesi
- correct_answer dan explanation tidak pernah dikirim sebelum submit; direct insert quiz_attempts/quiz_answers dan RPC submit_quiz lama dicabut
- Submit dibuat idempotent, timed submit aman, dan snapshot hasil tetap dapat dibaca oleh pemiliknya
- Memisahkan stimulus (Teks/Transkrip) dari prompt Pertanyaan melalui komponen Stimulus
- Menambahkan generator/validator scripts/generate-question-bank.mjs
- Menambahkan bank v2 tepat 2.000 soal published dengan source_key unik; distribusi tiap category+difficulty 111-112 soal
- Bank v1 dan data legacy diarsipkan, tidak dihapus
- Menambahkan pagination/pengelolaan bank soal admin serta penyesuaian bookmark dan result review
- Migration baru 202608010001 sampai 202608010008 sudah di-push dan remote database dinyatakan up to date
- Verifikasi database/RPC: normal 20 soal unik tanpa jawaban, overlap cooldown 0, retry 14 soal salah, challenge 20 soal, submit idempotent, timed kosong skor 0/20
- Verifikasi saat implementasi: unit 25/25, E2E lokal 18/18, E2E live mobile+desktop 18/18, build dan service seam lulus
- Commit: 15d5667 (secure quiz sessions)

=== Sesi 16 (Guard Jumlah Soal dan Deploy Live) ===
- Menyelidiki laporan Grammar menampilkan lebih dari 250 soal; database dan RPC tetap terbukti mengembalikan 20 soal
- Jalur render Quiz hanya menggunakan questions dari start_quiz_session; count bank di Practice tidak diteruskan sebagai jumlah sesi
- Akar laporan browser tidak dapat dipastikan tanpa screenshot/Network response; kandidat utama adalah tab/bundle lama atau payload sesi abnormal
- Menambahkan validasi di src/services/quiz.js: non-retry wajib tepat 20, retry wajib 1-20, dan panjang snapshot wajib sama dengan question_count
- Payload abnormal seperti 251 soal sekarang ditolak dengan pesan untuk memulai sesi baru, bukan dipotong diam-diam atau dirender
- Menambahkan regression test untuk payload 251 soal dan retry dua soal
- Verifikasi final: full unit test 27/27, production build lulus, service seam lulus, lint 0 error (10 warning lama)
- Commit c630fd8 sudah di-push ke main; local main sinkron dengan origin/main
- Live https://lms-mrole.pages.dev sudah diverifikasi memuat quiz service chunk dengan guard terbaru aktif

=== Sesi 17 (Candidate 01 Architecture Audit - Secure Bookmark Reviews) ===
- Scope dipilih dari docs/architecture-review-2026-08-01.html: menutup answer leak melalui bookmark tanpa menghilangkan fitur bookmark saat quiz aktif
- Root cause terkonfirmasi: policy questions_select_authorized memberi SELECT base questions kepada pemilik bookmark, sementara base row berisi correct_answer dan explanation
- Menambahkan migration additive 202608010009_secure_bookmark_reviews.sql; migration lama tidak diubah
- Policy questions_select_authorized baru hanya mengizinkan admin atau pengguna yang sudah memiliki quiz_answer dari attempt miliknya; cabang bookmark dihapus
- Menambahkan SECURITY DEFINER RPC get_bookmark_reviews() dengan search_path terkunci dan EXECUTE hanya untuk authenticated
- RPC mengembalikan prompt/stimulus/opsi bookmark, tetapi correct_answer dan explanation NULL sampai pengguna memiliki completed attempt untuk question tersebut
- Quiz sekarang mengambil bookmark ID ringan saja; halaman BookmarkReview memakai RPC review khusus melalui useBookmarks({ review: true })
- UI BookmarkReview menampilkan locked state dan tidak memberi highlight jawaban sebelum answer_available=true
- Regression tests baru: src/services/bookmarks.test.js dan src/pages/BookmarkReview.test.jsx
- Verifikasi checkpoint: focused tests 7/7, full suite 31/31, lint 0 error (10 warning lama), service seam lulus, production build lulus, git diff --check lulus
- supabase db push --dry-run lulus dan hanya mendeteksi migration 202608010009 sebagai pending
- Migration 202608010009 sudah diterapkan ke remote; remote sempat aman tetapi review independen menemukan completion lama masih dapat membuka jawaban ketika question yang sama muncul di sesi aktif baru
- Blocker ditangani tanpa mengubah migration applied: migration baru 202608010010_block_active_bookmark_answers.sql menolak akses base question dan answer release jika question berada di sesi aktif pengguna
- RPC revisi memakai correct_answer dari snapshot sesi submitted terbaru; current explanation masih fallback live karena snapshot saat ini belum menyimpan explanation
- Migration 010 memakai index quiz_session_questions(question_id, session_id) yang sudah ada dan helper SECURITY DEFINER has_active_quiz_question() agar policy tidak membutuhkan grant SELECT ke snapshot table
- Migration 202608010010 sudah diterapkan ke remote; supabase db push --dry-run sesudahnya menyatakan remote database up to date
- Anonymous invocation untuk get_bookmark_reviews dan has_active_quiz_question sama-sama ditolak HTTP 401
- Adversarial integration test dijalankan transaksional di remote dan seluruh fixture di-ROLLBACK: active_direct_answer_blocked=true, active_review_locked=true, submitted_snapshot_unlocked=true
- supabase db lint --linked: No schema errors found
- Catatan operasional: satu pemanggilan migration list terakhir gagal koneksi dan meminta SUPABASE_DB_PASSWORD, tetapi migration list sebelumnya menampilkan local/remote 202608010009 sinkron, migration 010 berhasil applied, dry-run sesudah push up to date, dan query integration terhadap fungsi 010 lulus
- Candidate 01 di-commit sebagai 64920d7 (fix: secure bookmark answer reviews) dan dipush ke main
- Cloudflare auto-deploy terverifikasi aktif: index-DZmSsTO3.js memuat BookmarkReview-CnkGcSVg.js dengan locked-state dan bookmarks-BjbiaLSw.js dengan get_bookmark_reviews
- Candidate 01 selesai end-to-end pada database remote, repository, dan frontend live; residual verification hanya journey authenticated manual jika kredensial test tersedia

=== Sesi 18 (Quiz Timer Tetap Berjalan Setelah Submit Gagal) ===
- Memperbaiki bug timer yang berhenti permanen setelah submit manual gagal karena network/server error
- Root cause pertama: handleSubmit selalu memanggil stopTimer() sebelum request selesai
- Root cause tambahan ditemukan regression test: Button onClick={handleSubmit} meneruskan React click event sebagai argumen fromTimer, sehingga submit manual selalu dianggap auto-submit
- Fix minimal: tombol manual memanggil handleSubmit() tanpa event; timer hanya dihentikan sebelum request untuk auto-submit fromTimer dan dihentikan setelah submit sukses
- Jika submit manual gagal, interval tetap aktif; pada timed mode expiry tetap dapat memicu auto-submit/retry yang sudah ada
- Menambahkan fake-timer regression test yang memulai pada 00:10, memaksa submit gagal, maju 2 detik, dan memastikan UI menjadi 00:12 tanpa duplicate submit
- Verifikasi: focused Quiz tests 4/4, full suite 32/32, lint 0 error (10 warning lama), service seam lulus, git diff --check lulus, production build lulus
- Commit 5e7d67a (fix: keep quiz timer running after submit failure) sudah dipush ke main dan auto-deploy aktif
- Live source map Quiz-RRbk4gu9.js memuat manual submit wrapper, conditional fromTimer stop, dan stopTimer setelah submit sukses

=== Sesi 19 (Open Graph dan WhatsApp Link Preview) ===
- Tujuan: URL homepage dan public quiz share menampilkan gambar preview saat ditempel ke WhatsApp Status atau media sosial
- Menambahkan Social Link Preview specification ke DESIGN.md
- Menambahkan metadata statis canonical, Open Graph, Twitter Card, image dimensions/type/alt ke index.html
- Membuat generator reproducible scripts/generate-social-preview.mjs dan npm script social:generate tanpa dependency baru
- Menghasilkan public/social-preview.png: PNG RGB 1200x630, 245773 bytes, memakai visual soft structuralism Mr Ole dan safe area social crop
- Menambahkan Cloudflare Pages Function functions/s/[token].js untuk mengganti metadata sebelum React dimuat; title/description mengikuti score, correct/total, category, dan display_name yang diizinkan snapshot share
- Metadata database di-escape; token dibatasi format 22 karakter; Supabase RPC dibatasi timeout 2.5 detik; invalid/revoked/error memakai generic fallback
- Halaman public share diberi noindex,nofollow agar nama/skor tidak masuk mesin pencari tetapi crawler sosial tetap dapat membaca OG metadata
- Cache hardening: conditional asset headers dibuang, ETag/Last-Modified root asset tidak diteruskan, response metadata memakai max-age 300 + must-revalidate agar revocation tidak dilewati oleh 304 SPA asset
- Menambahkan tests functions/s/[token].test.js untuk dynamic escaped metadata, generic invalid-token fallback, Twitter alt/robots, dan ETag regression
- Cloudflare Pages runtime lokal terverifikasi: /s/invalid-token HTTP 200 dengan metadata dinamis dan /social-preview.png HTTP 200 image/png
- Verifikasi checkpoint: related social tests 7/7 dan final function tests 3/3, full suite final 35/35, lint 0 error (10 warning lama), service seam lulus, production build lulus, git diff --check lulus
- Review independen menemukan blocker ETag dan timeout; keduanya sudah diperbaiki sebelum commit
- Commit d2fcb4a (feat: add social link previews) sudah dipush ke main dan auto-deploy aktif
- Verifikasi live: homepage mengandung og:image absolut; /s/invalid-token mengandung generic server-rendered metadata + noindex dan header X-Social-Preview=generic; /social-preview.png HTTP 200 image/png 245773 bytes
- Fitur selesai untuk static image preview dan dynamic title/description. Personalized smoke test masih membutuhkan satu token share aktif; WhatsApp dapat mempertahankan cache preview lama sehingga URL/token baru disarankan saat pengujian

=== Sesi 20 (Architecture Roadmap Continuation Checkpoint) ===
- Tidak ada perubahan aplikasi pada sesi perencanaan ini; checkpoint dibuat agar agent berikutnya dapat langsung melanjutkan tanpa audit ulang
- Pekerjaan arsitektur yang sudah selesai dan live:
  1. Secure server-side quiz sessions + bank 2.000 soal: 15d5667
  2. Guard jumlah soal non-retry 20 dan retry 1-20: c630fd8
  3. Candidate 01 bookmark answer leak: 64920d7, migration 202608010009 + 202608010010 remote
  4. Quiz timer tetap berjalan setelah submit manual gagal: 5e7d67a
  5. Open Graph/WhatsApp social preview: d2fcb4a; rollout dicatat di 9d9c056
- Verification baseline terbaru: unit tests 35/35, production build lulus, lint 0 error (10 warning lama), service seam lulus
- Estimasi program arsitektur tersisa: sekitar 16-27 hari engineer, dikerjakan bertahap dan tidak sebagai satu rewrite besar
- Urutan pekerjaan tersisa yang disetujui untuk dibahas/dikerjakan:
  1. Pertahankan provenance soal saat admin mengedit (0.5-1 hari, risiko rendah)
  2. Perbaiki kontrak/refetch/race condition useAsync (1.5-2.5 hari, risiko menengah karena banyak consumer)
  3. Perbaiki delete-user Cloudflare Function (0.5-1.5 hari, risiko menengah)
  4. Jadikan migration satu-satunya schema authority dan pisahkan legacy seed (2-4 hari)
  5. Tambahkan database constraints inti secara additive + data profiling (3-5 hari)
  6. Jadikan admin mutation dan audit transaksional (4-7 hari)
  7. Bentuk server-owned learner summary/history read models (5-8 hari)
  8. Perkeras AI quota dan avatar storage policies (3-5 hari)
  9. Jadikan unit/lint/service-seam/migration replay/RLS/E2E sebagai release gate (4-7 hari)
- NEXT ACTION yang direkomendasikan: provenance soal admin
- Root cause provenance: prepareQuestion() di src/pages/admin/Questions.jsx selalu mengirim content_hash=null, batch_id=null, batch_metadata={}, dan source_key=null untuk create maupun update; edit soal generated menghapus identitas sumber
- Rencana provenance: pisahkan payload create/update, update biasa tidak mengirim field provenance, tambah regression test, jalankan questions:check + full tests/build, update handoff/report, commit/push, verifikasi live
- Setelah provenance selesai, lakukan useAsync pada sesi khusus; jangan digabung karena useAsync memiliki leverage ke banyak halaman dan memerlukan concurrency/unmount tests
- Residual social-preview verification: static/generic live sudah terbukti; personalized metadata memerlukan satu token share aktif. Jika WhatsApp menunjukkan preview lama, uji URL/token baru karena cache crawler

=== Sesi 21 (Preserve Generated Question Provenance) ===
- Memperbaiki admin question editor yang sebelumnya selalu mengirim content_hash=null, batch_id=null, batch_metadata={}, dan source_key=null pada create maupun update
- Fix minimal: payload editor sekarang hanya berisi field yang memang dapat diedit; create manual memakai default database dan update generated tidak menyentuh provenance
- Default database terverifikasi: content_hash/batch_id/source_key nullable dan batch_metadata default {}
- Menambahkan src/pages/admin/Questions.test.jsx yang menguji payload create dan update aktual melalui interface CrudTable
- Test update memakai fixture source key format generator english-bank:grammar:easy:001 dan memastikan empat field provenance tidak dikirim
- Review independen: no blocking findings; satu temuan low tentang realism fixture diperbaiki sebelum final verification
- npm run questions:check lulus: 2.000 valid questions, 2.000 unique content hashes, dan 2.000 unique source keys
- Verifikasi: focused tests 2/2, full suite 37/37, lint 0 error (10 warning lama), service seam lulus, production build lulus, git diff --check lulus
- Commit 7acd52c (fix: preserve generated question provenance) sudah dipush ke main dan auto-deploy aktif
- Live source map Questions-ClL-5xQS.js terverifikasi tidak mengandung content_hash:null, batch_id:null, atau source_key:null pada payload editor
- Pekerjaan berikutnya: perbaiki useAsync dalam sesi khusus dengan tests refetch completion, overlapping request, stale response, dan unmount safety

=== Sesi 22 (Race-Safe useAsync dan Scoped Read Lifecycle) ===
- Audit menyeluruh menemukan 10 production consumer useAsync dan masalah utama: refetch mengembalikan cleanup function, overlap request saling menimpa, loading/error dapat diselesaikan request lama, manual refetch tidak terlindungi saat unmount
- useAsync diperdalam tanpa mengubah interface publik { loading, error, refetch }; error tetap string dan event-handler argument tetap diabaikan aman
- refetch sekarang Promise yang benar-benar menunggu operasi; latest execution wins melalui request generation + AbortController
- Promise.race dengan abort sentinel memastikan refetch lama tetap settle meskipun callback/transport lama hang
- Dependency cleanup, manual overlap, StrictMode discarded read, dan unmount membatalkan active signal tanpa menampilkan abort sebagai error pengguna
- AbortSignal diteruskan ke seluruh read service terkait menggunakan Supabase .abortSignal(signal): categories, questions, bookmarks, quiz result/recent attempts, streaks, leaderboard, admin stats/activity
- Seluruh consumer memeriksa signal sebelum menulis React state atau session cache; mutation create/update/delete tetap berada di luar read cancellation
- Admin Categories/Questions await refetch sekarang benar-benar menunggu refresh list selesai
- User-scoped progress/streak/bookmarks/bookmark count dikosongkan saat identity berubah; transport user lama dibatalkan
- Bookmark memakai loaded scope ownership; klik sebelum scope siap reject agar optimistic UI rollback, dan mutation user lama tidak dapat mengubah/refetch list user baru setelah await
- QuizResult membersihkan summary, answers, filter, challenge/share state ketika attempt route berubah; request attempt lama tidak dapat menimpa route baru
- Menambahkan useAsync tests untuk awaitable refetch, overlapping latest-wins, hung superseded settlement, dependency/unmount abort, dan string error contract
- Menambahkan useBookmarks ownership tests untuk loading-time rejection dan account switch selama pending mutation
- Review independen dilakukan tiga putaran: blocker transport abort dan auth ownership ditemukan, diperbaiki, lalu final review menyatakan merge-ready tanpa blocker/high-risk regression
- Verifikasi final: focused affected suite 29/29, full suite 44/44 saat dijalankan sendiri, lint 0 error (10 warning lama), service seam lulus, production build lulus, git diff --check lulus
- Catatan test runner: menjalankan full suite paralel dengan lint/build pernah menyebabkan dua timeout UI 5 detik tanpa assertion failure; rerun npm test sendiri lulus 44/44
- Commit cfeb9df (fix: make async reads race safe) sudah dipush ke main dan auto-deploy aktif
- Live source maps: useAsync-bIEXAxw-.js memuat Promise.race + AbortController; useBookmarks-Cby6frsP.js memuat loadedScope dan operationScope post-await guard
- Pekerjaan berikutnya sesuai roadmap: harden functions/api/delete-user.js (apikey headers, UUID validation, self-delete/last-admin governance, function tests, trusted audit)

=== Sesi 23 (Atomic Admin User Deletion) ===
- Audit endpoint menemukan auth/profile requests tanpa apikey, target tanpa UUID validation, self-delete dan last-admin deletion tidak dicegah, serta audit delete hanya fire-and-forget dari browser
- Endpoint kini memvalidasi body/UUID, membedakan invalid credentials dari auth outage, menormalisasi UUID, mengirim anon apikey saat validasi token, dan menyimpan service-role key hanya di Pages Function
- Self-delete ditolak dan seluruh authorization target diulang di database berdasarkan actor JWT yang tervalidasi
- Migration remote 202608020001 membuat delete_user_as_admin service-role-only: advisory lock, actor admin recheck, last-admin guard, trusted audit insert, dan DELETE auth.users berada dalam satu transaksi
- Migration remote 202608020002 menambah statement-level advisory lock untuk menghindari lock inversion serta menjaga invariant last-admin pada role demotion concurrent
- prepare_user_deletion service-role-only mengotorisasi actor/target dan mengembalikan seluruh storage.objects milik target sebelum deletion
- Endpoint membersihkan owned Storage objects melalui Storage API resmi per bucket dalam batch 100, kemudian atomic RPC mengulang governance sebelum delete
- admin_logs tidak lagi cascade-delete saat actor dihapus; actor_id dibackfill/disimpan dalam details untuk audit attribution yang durable
- Client-side logAdmin delete dihapus agar tidak ada audit duplikat/non-atomic
- FULL_SCHEMA.sql baseline 001-007 yang obsolete dipensiunkan fail-fast; setup baru wajib memakai seluruh versioned migrations
- Menambahkan 9 function tests: malformed/invalid UUID, anon apikey, self-delete, trusted RPC auth, last-admin mapping, UUID normalization, storage cleanup, atomic RPC contract, sanitized failures
- Tiga putaran independent security review menutup authorization bypass, concurrent admin race, audit durability, lock inversion, dan avatar-owner deletion; final review merge-ready tanpa blocker/high-risk regression
- Verifikasi: focused 9/9, full suite 53/53 pada rerun, production build lulus, lint 0 error (10 warning lama), service seam lulus, remote db lint bersih, diff check lulus
- Migration 202608020001 dan 202608020002 sudah aktif di database remote sebelum function deploy
- Commit 6c32102 (fix: secure admin user deletion) sudah di main/origin; function code live terverifikasi melalui invalid UUID 400
- Cloudflare production bindings SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY ditambahkan manual dan aktif setelah redeploy
- Residual risk diterima: Storage cleanup dan database transaction tidak dapat atomic lintas layanan; final RPC tetap fail-closed untuk account/admin governance
- Live verification: invalid UUID menghasilkan 400 sebelum auth; UUID valid tanpa token menghasilkan 401 Unauthorized, membuktikan function baru dan runtime bindings aktif
- Pekerjaan berikutnya: lanjutkan roadmap database constraints/admin transactions/read models

=== Sesi 24 (System Progress Overview) ===
- Membuat laporan perbandingan keseluruhan sistem di docs/system-comparison-2026-08-02.html
- Laporan memakai Engineering Readiness Index, bukan Lighthouse, uptime, coverage, SLA, atau penetration-test score
- Metodologi: 10 domain berbobot sama; skor hanya dinaikkan berdasarkan bukti repository, migration remote, tests, build/lint, independent review, atau live probe
- Baseline audit: 48,8%; kondisi terkini: 87,3%; peningkatan +38,5 poin persentase atau +78,9% relatif
- Domain yang dibandingkan: assessment integrity, data security, admin governance, async reliability, provenance, deployment/runtime, tests/verification, database authority, operations/observability, dan product/UX completeness
- Tabel laporan mencatat skor before/after/delta, perubahan utama, dan status kuat/berproses untuk setiap domain
- Evidence ledger menampilkan 2.000 soal aktif, 53/53 tests, kontrak 20 soal, hardening migrations, lint/build gates, dan live probes
- Remaining 13% difokuskan pada database constraints, server-owned learner/history read models, migration replay, RLS matrix, release gate, monitoring, dan restore drill
- HTML mandiri tanpa dependency runtime/CDN, memakai token visual DESIGN.md dan responsive table/bar visualization
- Layout diverifikasi dengan Playwright pada 375px, 768px, dan 1280px tanpa horizontal overflow
- File dibuka di browser Windows untuk review pengguna
- docs/system-comparison-2026-08-02.html masih untracked/belum di-commit pada akhir sesi ini
- HANDOFF.md juga berubah lokal untuk checkpoint Sesi 24 dan belum di-commit
- Commit remote terakhir tetap 3918676 (docs: confirm deletion endpoint rollout); application commit terakhir 6c32102
- Artefak untracked yang tidak boleh ikut commit tetap: .opencode/opencode-vision.json, Front Err/, dan stitch_website_redesign_project.zip
- Langkah awal sesi berikutnya: review laporan HTML bersama pengguna; jika disetujui, stage hanya HANDOFF.md + docs/system-comparison-2026-08-02.html, lalu commit/push

CURRENT STATE
-------------
- Semua 5 architecture candidate SELESAI
- Migration legacy 001-013 dan secure quiz migrations 202608010001-202608010010 tersedia; remote database sudah up to date pada dry-run terakhir
- AUTO-DEPLOY GitHub → Cloudflare Pages SUDAH AKTIF (workflow deploy.yml, run success) — tidak perlu wrangler manual lagi
- Build produksi SUDAH diberi env vars VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY dari GitHub secrets (deploy.yml) — error Supabase di produksi hilang
- SMTP Brevo AKTIF (gratis, 300 email/hari, kirim ke siapa pun): smtp-relay.brevo.com:587, sender Mr Ole <ardhisasongko71@gmail.com>. IP blocking SMTP deactivated
- 5 template email branded Mr Ole TERPASANG di produksi (subject + HTML): confirm, reset-password, magic-link, invite, email-change — email konfirmasi tampil branded di Gmail
- site_url Supabase = https://lms-mrole.pages.dev (redirect email konfirmasi ke produksi, bukan localhost)
- Supabase CLI ter-install & ter-link
- Quiz: tanpa instant feedback, tanpa crash, submit_quiz tanpa error ambigu
- Dark mode toggle tersedia di Navbar, DashboardLayout, AdminLayout, Settings
- Dashboard motivasi siswa: CTA dinamis, banner Mulai Latihan selalu terlihat, insight kategori, pujian kenaikan skor, info latihan terakhir
- Stat cards dashboard interaktif (link ke /history, /practice, /bookmarks)
- Username/nama user tampil penuh di mobile (tanpa truncate) di Leaderboard, admin Users, admin Dashboard log
- Share hasil quiz mendukung Feed, Story, public share, dan challenge
- Bank aktif berisi tepat 2.000 soal v2 published; setiap cell category+difficulty 111-112 soal
- Quiz memakai snapshot server-side yang aman; mode non-retry tepat 20 soal dan retry 1-20 soal
- Guard jumlah soal sudah aktif di live deployment pada commit c630fd8
- HEAD aplikasi terbaru yang sudah live: 6c32102
- Candidate 01 bookmark answer leak sudah ditutup pada database remote dan frontend locked-review sudah live
- Open Graph/Twitter social preview sudah live untuk homepage dan public quiz share; gambar memakai public/social-preview.png

PENDING TASKS
-------------
- ~~Fill in Supabase access token~~ ✅
- ~~supabase link + push + seed~~ ✅
- ~~Candidate #1 (Component Optimization)~~ ✅
- ~~Candidate #4 (State Management)~~ ✅
- ~~Candidate #5 (Performance)~~ ✅
- ~~Build & deploy~~ ✅
- ~~Project pindah dari /mnt/c/ ke ~/projects/lms-MrOle (WSL native)~~ ✅
- ~~Mobile layout check — user menemukan beberapa tempat yg tidak pas di mobile~~ ✅
- ~~DESIGN.md — belum ada, UI tidak punya token system~~ ✅
- ~~Large chunk warning — pdf-*.js, perlu code-split~~ ✅
- ~~Test suite — vitest ada tapi belum dijalankan~~ ✅
- ~~ESLint — 6 error conditional hooks di Quiz.jsx~~ ✅
- ~~Quiz crash karena XCircle tidak di-import~~ ✅
- ~~Privilege escalation role (user bisa jadi admin)~~ ✅
- ~~Lighthouse audit~~ ✅
- ~~npm install dan sinkronisasi dependency~~ ✅
- ~~Re-connect auto-deploy GitHub→Cloudflare Pages~~ ✅
- ~~Quiz crash XCircle di produksi~~ ✅
- ~~Tabel bookmarks hilang (404)~~ ✅
- ~~Leaderboard view SECURITY DEFINER~~ ✅
- ~~Instant feedback dihapus dari quiz~~ ✅
- ~~submit_quiz ambiguous (ans, q)~~ ✅
- ~~Dark mode toggle di Dashboard/Admin layout~~ ✅
- ~~Fix truncate username/nama user di mobile (Leaderboard, admin Users, admin Dashboard log)~~ ✅
- ~~Dashboard motivasi siswa (CTA dinamis, banner Mulai Latihan, insight kategori, pujian skor, info latihan terakhir)~~ ✅
- ~~Stat cards dashboard jadi link interaktif~~ ✅
- ~~Banner CTA responsive di HP (2 baris)~~ ✅
- ~~Auto-deploy GitHub→Cloudflare Pages (root cause: package-lock.json tidak sinkron → npm ci gagal)~~ ✅
- ~~Workflow deploy.yml (push ke main → build + deploy otomatis)~~ ✅
- ~~Env vars Supabase di build produksi (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY dari GitHub secrets)~~ ✅
- ~~Custom email templates branded Mr Ole (5 template + subject)~~ ✅
- ~~SMTP custom (Resend → Brevo gratis, kirim ke siapa pun)~~ ✅
- ~~Brevo IP blocking (authorize IP AWS + deactivate SMTP keys)~~ ✅
- ~~site_url produksi (lms-mrole.pages.dev)~~ ✅
- ~~node_modules korupsi OneDrive (reinstall dompurify + @supabase)~~ ✅
- ~~Share hasil quiz Feed + Story + public challenge~~ ✅
- ~~Secure server-side quiz sessions~~ ✅
- ~~Bank soal v2 tepat 2.000 published~~ ✅
- ~~Batas keras sesi non-retry 20 soal dan retry 1-20~~ ✅
- ~~Candidate 01: tutup bookmark answer leak pada RLS/RPC remote~~ ✅
- ~~Deploy frontend secure bookmark review dan verifikasi bundle live~~ ✅
- Domain sendiri untuk sender produksi (noreply@domainmu.com) — belum, butuh dana
- Jika laporan 250+ soal muncul lagi, ambil screenshot teks "Soal X dari Y", URL lengkap, dan response Network start_quiz_session untuk memastikan sumber browser
- Workflow CI + Auto-Fix pernah merah hanya pada langkah pembuatan failure-report PR; build, Playwright, Lighthouse, dan deploy tetap berhasil

KEY FILES
---------
- src/services/ - Data access layer (users.js, quiz.js, auth.js, storage.js, streaks.js)
- src/utils/errors.js - Error handling utilities
- eslint.config.js - ESLint config + service seam enforcement + recommended rules
- scripts/check-service-seam.mjs - Build-time service seam check
- scripts/auto-fix.mjs - AI + rule-based auto-fixer for CI pipeline
- playwright.config.js - Playwright config (mobile 375px + desktop 1280px)
- e2e/pages.spec.js - E2E smoke tests for public pages + responsive checks
- .lighthouserc.js - Lighthouse CI config for performance/accessibility/SEO
- .github/workflows/ci-fix.yml - Full CI pipeline: test → auto-fix → loop guard → PR
- .github/workflows/deploy.yml - Auto-deploy ke Cloudflare Pages (push ke main)
- supabase/config.toml - Supabase CLI config
- supabase/seed/ - Seed data (seed.sql, english-questions.sql)
- supabase/migrations/ - Migration legacy 001-013 dan secure quiz migrations 202608010001-202608010008
- functions/api/chat.js - Cloudflare Pages Function for AI chat
- functions/api/delete-user.js - Cloudflare Function for admin user deletion
- supabase/migrations/009_security_fixes.sql - Security hardening migration
- supabase/migrations/010_leaderboard_rpc.sql - RPC get_leaderboard() pengganti view SECURITY DEFINER
- supabase/migrations/011_fix_submit_quiz_ambiguous.sql - Fix ambiguous 'ans' reference
- supabase/migrations/012_fix_submit_quiz_q_ambiguous.sql - Fix ambiguous 'q' reference
- src/hooks/useDarkMode.js - Dark mode hook + storage sync listener
- src/components/layout/DashboardLayout.jsx - Toggle dark mode di header mobile + sidebar
- src/components/layout/AdminLayout.jsx - Toggle dark mode di header mobile + sidebar
- supabase/templates/ - 5 template email branded Mr Ole (confirm, reset-password, magic-link, invite, email-change)
- .github/workflows/deploy.yml - Auto-deploy + env vars Supabase dari GitHub secrets
- src/components/share/AchievementCard.jsx - Render achievement card Feed/Story
- src/components/share/ShareResultModal.jsx - Pemilihan format dan aksi share hasil
- src/pages/PublicQuizShare.jsx - Halaman share publik dan entry challenge
- src/services/shares.js - Service public share/challenge
- supabase/migrations/013_quiz_shares.sql - Skema dan RPC share quiz
- src/pages/Quiz.jsx - Lifecycle server-side quiz session dan render maksimal sesuai kontrak sesi
- src/hooks/useQuiz.js - Boundary start/save/submit session
- src/services/quiz.js - Mapping, sanitasi, dan validasi jumlah soal session
- src/components/quiz/Stimulus.jsx - Render stimulus terpisah dari prompt
- scripts/generate-question-bank.mjs - Generator dan validator bank 2.000 soal
- supabase/migrations/202608010001_secure_quiz_sessions.sql - Tabel, constraint, dan RPC session
- supabase/migrations/202608010005_lock_down_question_answers.sql - Lockdown akses jawaban
- supabase/migrations/202608010006_harden_quiz_session_submission.sql - Submit aman dan idempotent
- supabase/migrations/202608010008_question_bank_2000_v2.sql - Bank soal aktif v2
- supabase/migrations/202608010009_secure_bookmark_reviews.sql - Menghapus bookmark access dari base questions dan menambah controlled review RPC
- supabase/migrations/202608010010_block_active_bookmark_answers.sql - Memblokir historical completion saat question aktif dan memakai submitted snapshot answer

IMPORTANT DECISIONS
-------------------
- Data access layer: pages/hooks must go through services/ only
- Two-layer enforcement: ESLint + build script
- Supabase CLI over custom script for DB management
- Error handling: services throw → hooks capture → pages display via handleError()
- Ponytail philosophy: minimal code, YAGNI, reuse, stdlib first
- Service seam: pages and hooks must not import supabase directly
- Type safety: no as any, no @ts-ignore, no @ts-expect-error
- Bugfix rule: fix minimally, never refactor while fixing
- IS_DEMO controlled by explicit VITE_DEMO=true flag, not by missing env vars
- deleteUser moved to server-side Cloudflare Function (service_role key required)
- Deploy SEKARANG: auto-deploy AKTIF via .github/workflows/deploy.yml (push ke main). Wrangler manual hanya cadangan
- GitHub secrets: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID + VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY wajib ada di repo (Settings → Secrets → Actions)
- SMTP produksi: Brevo (gratis, 300 email/hari, kirim ke siapa pun). Sender Mr Ole <ardhisasongko71@gmail.com>. IP blocking SMTP deactivated karena IP Supabase dinamis
- Custom email template (project baru free tier) hanya bisa jika pakai custom SMTP — kebijakan Supabase sejak 3 Juni 2026
- Template email dikelola via Dashboard (Authentication → Emails) atau API PATCH config/auth; file di supabase/templates/ hanya untuk local dev via config.toml
- Kredensial Cloudflare Pages disimpan di GitHub secrets; file kredensial lokal di Front Err/ diabaikan Git dan tidak boleh di-commit
- Dashboard motivasi: hitung dari data yang sudah ada (useProgress/useStreak/chartData) — tidak menambah query supabase baru
- Quiz session: server snapshot adalah sumber kebenaran; localStorage hanya menyimpan progress ringan (jawaban, bookmark, currentIndex)
- Jangan memotong payload sesi abnormal di client; tolak seluruh sesi agar submit dan penilaian tidak berbeda dari snapshot server
- Batas sesi: normal/adaptive/timed/challenge tepat 20, retry 1-20
- Huruf A/B/C/D hanya label tampilan; penilaian memakai label immutable dari opsi snapshot

EXPLICIT CONSTRAINTS
--------------------
- Ponytail philosophy: minimal code, YAGNI, reuse, stdlib first
- Service seam: pages and hooks must not import supabase or call supabase.from/rpc/auth directly
- Type safety: no as any, no @ts-ignore, no @ts-expect-error
- Bugfix rule: fix minimally, never refactor while fixing
- Category-domain matching for task delegation

CONTEXT FOR CONTINUATION
----------------------
- All 5 architecture candidates completed and pushed to main
- Supabase fully configured and seeded
- Build passes, deployed via Cloudflare Pages auto-deploy from GitHub
- Playwright + Lighthouse CI + auto-fix pipeline + DESIGN.md sudah di-setup
- Mobile layout fixes: toggle dark mode + bahasa pindah ke top bar navbar (icon), login/register di hero
- Desktop navbar: seamless tanpa mt-4/rounded/border/shadow
- Navbar dark mode: harmonis dengan bg-gray-950/40
- Code-split: pdf chunk dipecah jadi pdf-js + pdf-canvas
- ESLint: 6 error hooks sudah diperbaiki, recommended rules + react plugin diaktifkan
- Lighthouse CI sudah tersedia dan pernah lulus; Chromium tersedia melalui Playwright
- Dependency sudah terpasang dan sinkron; jika node_modules kembali korup, reinstall paket yang gagal di-resolve
- Deploy aktif: auto-deploy GitHub→Cloudflare Pages SUDAH AKTIF via deploy.yml (push ke main). Wrangler manual hanya cadangan
- Quiz tanpa instant feedback; jawaban benar hanya muncul di halaman hasil
- submit_quiz sudah bebas error ambigu (migration 011 + 012)
- Dark mode toggle tersedia di semua layout + sinkron antar komponen
- Dashboard motivasi: kartu statistik klikable; banner Mulai Latihan responsive (2 baris di HP); CTA teks dinamis; insight kategori terkuat/terlemah; pujian kenaikan skor; info latihan terakhir
- Nama user tampil penuh (break-words) di mobile — tidak ada truncate
- Auto-deploy GitHub→Cloudflare Pages AKTIF (workflow deploy.yml). Root cause lama (npm ci gagal karena lock tidak sinkron) sudah diperbaiki
- Langkah deploy cepat: git push ke main → otomatis build + deploy (tanpa wrangler manual)
- Build produksi sudah inject env vars Supabase dari GitHub secrets (deploy.yml)
- Email produksi aktif via Brevo SMTP: 5 template branded Mr Ole terpasang, terkirim ke siapa pun, site_url sudah produksi
- Kalau error build "Failed to resolve entry for package X" → OneDrive tidak sync node_modules; hapus & reinstall paket tsb (dompurify, @supabase/*)
- TODO produksi: beli domain → verifikasi di Brevo → ganti sender ke noreply@domainmu.com
- Share hasil quiz aktif: Feed 1080x1350, Story 1080x1920, public link, dan challenge
- Secure quiz session aktif di produksi: server snapshot, jawaban terkunci sebelum submit, cooldown 5 menit, submit idempotent
- Bank aktif: 2.000 soal v2 published, source_key unik, 111-112 soal per category+difficulty
- Kontrak jumlah soal: non-retry tepat 20; retry 1-20; client menolak payload yang tidak cocok dengan question_count
- Commit aplikasi terbaru 6c32102 sudah di main, origin/main, dan live Cloudflare Pages
- Unit suite terbaru 53/53 lulus pada rerun; build production dan service seam lulus; lint tidak memiliki error
- Artefak untracked .opencode/opencode-vision.json, Front Err/, dan stitch_website_redesign_project.zip tidak termasuk commit aplikasi
- Candidate 01 status: complete melalui commit 64920d7; backend migration 009+010 remote, adversarial test 3/3, frontend/tests committed dan bundle live terverifikasi
- Verification Candidate 01 lokal: full unit suite 31/31, focused 7/7, lint 0 error (10 warning lama), service seam lulus, build production lulus, db lint remote lulus
- Quiz timer failure fix status: complete dan live melalui 5e7d67a; regression test fake timer termasuk dalam full suite 32/32
- Social link preview status: complete dan live melalui d2fcb4a; static OG image + server-rendered /s/:token metadata, cache/revocation hardening, dan 3 function regression tests
- Generated question provenance fix: complete dan live melalui 7acd52c; generator check 2.000/2.000 dan create/update payload regression tests lulus
- Race-safe useAsync refactor: complete dan live melalui cfeb9df; 10 consumers scoped, Supabase reads abortable, auth/bookmark ownership races covered
- Admin user deletion hardening: complete dan live melalui 6c32102 + migrations 202608020001-002; Pages Function bindings aktif dan probe auth 401 lulus
- System progress comparison: docs/system-comparison-2026-08-02.html selesai dan responsive, tetapi belum di-commit
