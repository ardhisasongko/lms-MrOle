# LMS Mr Ole — Arsitektur & Struktur Folder

```
src/
├── components/
│   ├── common/           # Button, Input, Modal, Card, Badge, Skeleton
│   ├── forms/            # FormInput, FormSelect, FormTextarea
│   ├── feedback/         # Toast, Alert, EmptyState, ErrorState
│   ├── navigation/       # Navbar, Sidebar, Breadcrumb
│   └── layout/           # AuthLayout, MainLayout, DashboardLayout
├── pages/
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Verify.tsx
│   ├── ForgotPassword.tsx
│   ├── ResetPassword.tsx
│   ├── Dashboard.tsx
│   ├── Practice.tsx           # Pilih kategori & level
│   ├── Quiz.tsx               # Kerjakan soal
│   ├── QuizResult.tsx         # Hasil & pembahasan
│   ├── History.tsx            # Riwayat latihan
│   ├── Profile.tsx
│   ├── Settings.tsx
│   ├── NotFound.tsx
│   └── Error.tsx
├── features/
│   ├── auth/              # AuthContext, hooks login/register
│   ├── practice/          # hooks ambil soal, submit jawaban
│   ├── dashboard/         # hooks statistik & progres
│   ├── profile/           # hooks edit profil
│   └── history/           # hooks riwayat
├── services/
│   ├── supabase.ts        # Inisialisasi Supabase client
│   └── api.ts             # Panggilan ke Cloudflare Worker (nanti)
├── hooks/
│   ├── useAuth.ts
│   ├── useCategories.ts
│   ├── useQuestions.ts
│   ├── useQuiz.ts
│   ├── useProgress.ts
│   └── useProfile.ts
├── utils/
│   ├── cn.ts              # classname utility
│   ├── format.ts          # format angka, tanggal
│   └── constants.ts
├── schemas/
│   ├── auth.ts            # Zod validasi form auth
│   └── quiz.ts            # Zod validasi quiz
├── constants/
│   └── index.ts           # Enum kategori, level, dll
├── assets/
└── styles/
    └── globals.css

functions/
└── api/                   # Cloudflare Workers (nanti untuk AI)

supabase/
├── migrations/
│   └── 001_initial.sql
└── seed/
    └── seed.sql           # Data awal kategori & soal contoh
```

## Arsitektur Hosting

```
Browser
  ↓
Cloudflare Pages (Frontend React)
  ↓
Cloudflare Workers (API endpoint, nanti untuk AI)
  ↓
Supabase (Auth, Database, Storage)
  ↓
OpenAI API (nanti untuk chatbot)
```
