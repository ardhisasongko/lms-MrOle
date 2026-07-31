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

GOAL
----
Semua 5 architecture candidate selesai. Database ter-migrate & ter-seed. Build & deploy ke Cloudflare Pages.

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
- Deploy manual via wrangler berhasil: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID → npx wrangler pages deploy dist --project-name lms-mrole --branch main (token Pages di "Front Err/token-cloudflare.txt", gunakan token cfut_6wMs... bukan yang lama)
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
- Perlu 2 secrets di GitHub: CLOUDFLARE_API_TOKEN (cfut_6wM... token Pages) + CLOUDFLARE_ACCOUNT_ID (dari Cloudflare Dashboard) — sudah ditambahkan user
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
- User tidak punya uang → ganti ke Brevo (gratis, 300 email/hari, tanpa domain): host smtp-relay.brevo.com, port 587, user b3f62a001@smtp-brevo.com, pass SMTP key xkeysib-...
- Fix error Brevo "Unauthorized IP address": IP AWS 54.254.203.116 (outbound Supabase) di-authorize di Brevo → Authorized IPs; SMTP keys IP blocking di-DEACTIVATE (IP Supabase dinamis, tidak bisa di-whitelist satu-satu)
- URL Configuration Supabase di-update via Management API: site_url → https://lms-mrole.pages.dev, uri_allow_list = produksi + localhost (dev). config.toml lokal di-sync
- Semua 5 template email (subject + HTML) di-pasang ke produksi via API PATCH config/auth — TERVERIFIKASI: user dapat email konfirmasi branded Mr Ole di Gmail (subject "Konfirmasi email kamu — Mr Ole", header coral, tombol hijau)
- Sender aktif: Mr Ole <ardhisasongko71@gmail.com> (email sender terverifikasi di Brevo)
- Fix node_modules korupsi (OneDrive tidak sync file): file .mjs hilang (dompurify, @supabase/postgrest-js) → build error "Failed to resolve entry". Hapus + reinstall dompurify & @supabase/supabase-js → build pass (1m30s). Root cause khas OneDrive: kalau error resolve entry lagi, reinstall paket tsb
- Commit Sesi 12: 0cbcf7e (deploy.yml env vars), 817bf60 (template email + site_url config.toml), 9310d6f (reinstall paket @supabase + dompurify)

CURRENT STATE
-------------
- Semua 5 architecture candidate SELESAI
- 13 migration sync (001–012 + seed 20250727)
- Build sukses, deploy live via wrangler manual (auto-deploy GitHub masih mati)
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
- Lighthouse audit — butuh Chrome environment
- npm install perlu dijalankan (eslint-plugin-react, happy-dom)
- ~~Re-connect auto-deploy GitHub→Cloudflare Pages (Settings → Builds & deployments)~~ 🔶 MASIH GAGAL — deploy manual via wrangler adalah metode aktif
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
- Domain sendiri untuk sender produksi (noreply@domainmu.com) — belum, butuh dana

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
- supabase/migrations/ - 14 migration files (001 to 012 + seed)
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
- Deploy: auto-deploy GitHub MATI → gunakan wrangler manual (CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
- Deploy SEKARANG: auto-deploy AKTIF via .github/workflows/deploy.yml (push ke main). Wrangler manual hanya cadangan
- GitHub secrets: CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID + VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY wajib ada di repo (Settings → Secrets → Actions)
- SMTP produksi: Brevo (gratis, 300 email/hari, kirim ke siapa pun). Sender Mr Ole <ardhisasongko71@gmail.com>. IP blocking SMTP deactivated karena IP Supabase dinamis
- Custom email template (project baru free tier) hanya bisa jika pakai custom SMTP — kebijakan Supabase sejak 3 Juni 2026
- Template email dikelola via Dashboard (Authentication → Emails) atau API PATCH config/auth; file di supabase/templates/ hanya untuk local dev via config.toml
- Token Cloudflare Pages disimpan di "Front Err/token-cloudflare.txt" (token cfut_eko... TIDAK punya izin Pages; gunakan token Pages yang tersimpan di file tsb — cfut_6wM...). File sudah masuk .gitignore
- Dashboard motivasi: hitung dari data yang sudah ada (useProgress/useStreak/chartData) — tidak menambah query supabase baru

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
- Lighthouse: butuh Chrome environment untuk jalan
- npm install butuh dijalankan ulang (korupsi node_modules di WSL)
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
