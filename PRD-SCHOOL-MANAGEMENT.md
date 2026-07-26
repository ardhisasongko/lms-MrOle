# PRD: School Management System (SMS)

## 1. Overview

| Item | Detail |
|------|--------|
| **Nama** | SchoolHub (working title) |
| **Purpose** | All-in-one school management platform — admin, teacher, student, parent |
| **Tech Stack** | React 19 + Supabase + Tailwind CSS (sama dengan LMS Mr Ole) |
| **Scaffolding** | Reuse dari lms-MrOle |
| **Target User** | SD/SMP/SMA di Indonesia |

---

## 2. User Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full system access, multi-branch |
| **Admin Sekolah** | School-level management |
| **Guru/Dosen** | Classes, grades, attendance, materials |
| **Siswa** | Assignments, grades, schedule, fees |
| **Orang Tua** | Monitor children, payments, communication |

---

## 3. Core Modules

### 3.1 Student Information System (SIS)

| Feature | Priority | Notes |
|---------|----------|-------|
| Student profiles | 🔴 Must | biodata, photo, documents, health records |
| Enrollment / registration | 🔴 Must | online form, document upload |
| Bulk import (CSV) | 🔴 Must | for existing data migration |
| Alumni tracking | 🟡 Nice | post-graduation engagement |
| Transfer certificate | 🟡 Nice | auto-generate PDF |

### 3.2 Attendance

| Feature | Priority | Notes |
|---------|----------|-------|
| Daily attendance (one-tap) | 🔴 Must | teacher marks via mobile/web |
| Real-time parent notification | 🔴 Must | SMS/WA/push when absent |
| Period-wise tracking | 🟡 Nice | per subject attendance |
| QR code / biometric | 🟡 Nice | future integration |
| Attendance reports | 🔴 Must | daily, weekly, monthly, yearly |

### 3.3 Timetable & Scheduling

| Feature | Priority | Notes |
|---------|----------|-------|
| Class timetable builder | 🔴 Must | drag-and-drop |
| Auto-schedule with conflict detection | 🔴 Must | room + teacher + time |
| Teacher substitution | 🟡 Nice | when teacher absent |
| Exam schedule | 🔴 Must | tied to exam module |

### 3.4 Fee Management

| Feature | Priority | Notes |
|---------|----------|-------|
| Fee structures (per class/type) | 🔴 Must | tuition, activity, lab, etc |
| Invoice generation | 🔴 Must | auto per student/class |
| Online payment (Midtrans/Xendit) | 🔴 Must | Indonesian payment gateways |
| Receipt auto-generation | 🔴 Must | PDF download |
| Outstanding tracking | 🔴 Must | dashboard + reminders |
| Sibling / merit discounts | 🟡 Nice | auto-apply rules |
| Installment plans | 🟡 Nice | split payment schedule |

### 3.5 Examination & Grading

| Feature | Priority | Notes |
|---------|----------|-------|
| Exam creation & scheduling | 🔴 Must | mid-term, final, quiz |
| Mark entry (bulk) | 🔴 Must | teacher inputs per class |
| Grading engine | 🔴 Must | GPA, percentage, custom rubric |
| Report card generation | 🔴 Must | branded PDF per student |
| Grade analysis | 🔴 Must | per class, per subject, trends |
| Report card templates | 🟡 Nice | customizable design |

### 3.6 Online Exam (500 Concurrent Students)

| Feature | Priority | Notes |
|---------|----------|-------|
| Real-time exam sessions | 🔴 Must | 500 siswa ujian bersamaan |
| MCQ auto-grade | 🔴 Must | instant scoring |
| Essay manual grade | 🔴 Must | teacher input |
| Synchronized timer | 🔴 Must | server-side countdown |
| Auto-save answers | 🔴 Must | tiap 30 detik ke Supabase |
| Force submit on timeout | 🔴 Must | server-side cron |
| Anti-cheat: tab switch detection | 🔴 Must | log + count switches |
| Anti-cheat: clipboard block | 🔴 Must | prevent copy-paste |
| Anti-cheat: right-click block | 🔴 Must | prevent context menu |
| Question randomization | 🔴 Must | shuffle per student |
| Option randomization | 🔴 Must | shuffle A/B/C/D per student |
| Question pool | 🔴 Must | N dari pool besar |

#### Architecture (500 Concurrent)

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React + WebSocket (Supabase Realtime)           │
│  - Exam timer (client + server sync)             │
│  - Auto-save answers ke Supabase                 │
│  - Tab switch detection                          │
│  - Force submit on timeout                       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              SUPABASE (Backend)                   │
│  ┌─────────────────────────────────────────┐     │
│  │  PostgreSQL                              │     │
│  │  - exams (config, time limit, shuffle)   │     │
│  │  - exam_questions (question pool)        │     │
│  │  - exam_sessions (per student state)     │     │
│  │  - exam_answers (auto-save per question) │     │
│  │  - exam_submissions (final submit)       │     │
│  └─────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────┐     │
│  │  Edge Functions (serverless)             │     │
│  │  - start-exam → create session, shuffle  │     │
│  │  - save-answer → upsert per question     │     │
│  │  - submit-exam → lock + calculate score  │     │
│  │  - exam-results → grade + rank           │     │
│  └─────────────────────────────────────────┘     │
│  ┌─────────────────────────────────────────┐     │
│  │  Realtime (WebSocket)                    │     │
│  │  - Exam status broadcast                 │     │
│  │  - Timer sync                            │     │
│  │  - Force submit trigger                  │     │
│  └─────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
```

#### Database Schema (Exam Module)

```sql
-- Exam definition
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  class_id UUID REFERENCES classes(id),
  time_limit_minutes INT NOT NULL DEFAULT 60,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  shuffle_questions BOOLEAN DEFAULT true,
  shuffle_options BOOLEAN DEFAULT true,
  max_attempts INT DEFAULT 1,
  passing_score INT DEFAULT 70,
  status TEXT DEFAULT 'draft', -- draft, published, active, closed
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Question bank per exam
CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- mcq, essay, true_false
  options JSONB, -- [{label: "A", text: "..."}, ...]
  correct_answer TEXT,
  points INT DEFAULT 1,
  explanation TEXT,
  order_index INT
);

-- Per-student exam session
CREATE TABLE exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_remaining_seconds INT,
  status TEXT DEFAULT 'in_progress', -- in_progress, submitted, timed_out
  tab_switch_count INT DEFAULT 0,
  UNIQUE(exam_id, student_id)
);

-- Auto-saved answers (real-time upsert)
CREATE TABLE exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES exam_sessions(id),
  question_id UUID REFERENCES exam_questions(id),
  answer TEXT,
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- Final submission
CREATE TABLE exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES exam_sessions(id),
  total_score INT,
  max_score INT,
  percentage DECIMAL(5,2),
  is_passed BOOLEAN,
  graded_by UUID REFERENCES profiles(id),
  graded_at TIMESTAMPTZ,
  feedback TEXT
);
```

#### Edge Functions

```javascript
// 1. Start Exam
// - Create exam_session
// - Shuffle questions for this student
// - Return shuffled question list + server time

// 2. Auto-Save Answer
// - Upsert exam_answers (session_id, question_id, answer)
// - Update saved_at timestamp
// - Called tiap 30 detik atau saat user ganti jawaban

// 3. Submit Exam
// - Lock session (status = submitted)
// - Calculate score (MCQ auto, essay pending)
// - Insert exam_submission
// - Return results

// 4. Force Submit (server-side cron)
// - Check exam_sessions where time_remaining <= 0
// - Auto-submit semua yang belum submit
// - Run setiap menit
```

#### Anti-Cheat Features

| Feature | Implementation |
|---------|----------------|
| **Tab switch detection** | `document.visibilitychange` event → log ke server, count switches |
| **Clipboard block** | `oncopy`, `onpaste`, `oncut` → prevent + log |
| **Right-click block** | `oncontextmenu` → prevent default |
| **Time sync** | Server timestamp sebagai source of truth, client timer = display only |
| **Randomized questions** | Shuffle order per student saat start |
| **Randomized options** | Shuffle A/B/C/D per student |
| **Question pool** | Ambil N dari pool besar (tiap siswa dapat urutan berbeda) |
| **Auto-submit** | Server-side timer, force submit saat end_time reached |

#### Scalability Considerations

| Concern | Solution |
|---------|----------|
| **500 concurrent writes** | Supabase handles ~500 concurrent connections (free tier). Pro tier = 500+ |
| **Auto-save 500 students x 30s** | ~17 writes/second — within Supabase limits |
| **Realtime broadcast** | Supabase Realtime supports broadcast channels |
| **Query performance** | Index on `(exam_id, student_id)`, `(session_id, question_id)` |
| **Data loss prevention** | Client auto-save + server-side force submit |
| **Offline resilience** | Cache answers in localStorage, sync when online |

#### Load Test Strategy

| Test | Target | Tool |
|------|--------|------|
| Concurrent exam start | 500 students start dalam 1 menit | k6 / Artillery |
| Auto-save throughput | 500 x 2 saves/menit = ~17 writes/detik | Supabase metrics |
| Realtime latency | < 2 detik untuk force submit | WebSocket ping |
| Timer accuracy | Drift < 5 detik antara server-client | Manual test |

### 3.7 Learning Management (LMS)

| Feature | Priority | Notes |
|---------|----------|-------|
| Course materials upload | 🔴 Must | docs, videos, links |
| Assignments & submission | 🔴 Must | upload + deadline + grading |
| Quiz / online exam | 🔴 Must | MCQ auto-grade |
| AI tutor chatbot | 🟡 Nice | like LMS Mr Ole |
| Discussion forum | 🟡 Nice | per class/subject |
| Live class integration | 🟢 Future | Zoom/Meet link |

### 3.8 Parent & Teacher Communication

| Feature | Priority | Notes |
|---------|----------|-------|
| Announcements / bulletin | 🔴 Must | school-wide or class-specific |
| In-app messaging | 🔴 Must | parent ↔ teacher |
| Push notifications | 🔴 Must | attendance, grades, fees, events |
| SMS / WhatsApp integration | 🟡 Nice | bulk notification |
| Event calendar | 🔴 Must | school events, holidays |
| Parent portal | 🔴 Must | view child's progress, fees, schedule |

### 3.9 HR & Staff Management

| Feature | Priority | Notes |
|---------|----------|-------|
| Staff profiles | 🔴 Must | teachers, admin, staff |
| Leave management | 🔴 Must | apply + approve workflow |
| Payroll (basic) | 🟡 Nice | salary calculation, payslip |
| Staff attendance | 🔴 Must | teacher/staff check-in |
| Document management | 🟡 Nice | contracts, certificates |

### 3.10 Library Management

| Feature | Priority | Notes |
|---------|----------|-------|
| Book catalog | 🟡 Nice | title, author, stock |
| Borrowing system | 🟡 Nice | check-in/out, due dates |
| Fine calculation | 🟢 Future | overdue penalties |

### 3.11 Transport Management

| Feature | Priority | Notes |
|---------|----------|-------|
| Route management | 🟡 Nice | bus routes, stops |
| Student-route assignment | 🟡 Nice | which student on which bus |
| GPS tracking | 🟢 Future | real-time bus location |

### 3.12 Reports & Analytics

| Feature | Priority | Notes |
|---------|----------|-------|
| Dashboard (role-based) | 🔴 Must | admin, teacher, parent, student views |
| Academic reports | 🔴 Must | class performance, trends |
| Financial reports | 🔴 Must | collection rate, outstanding |
| Attendance reports | 🔴 Must | per class, per student |
| Export (PDF/Excel) | 🔴 Must | all reports |
| AI-powered insights | 🟡 Nice | at-risk student detection |

---

## 4. Database Schema (Core Tables)

```sql
-- User Management
profiles          → all users (admin, teacher, student, parent)

-- Academic
students          → student-specific data
classes           → class/grade levels
class_students    → student-class enrollment
subjects          → school subjects
teachers          → teacher-specific data
subjects_teachers → subject-teacher assignment
timetables        → class schedules

-- Attendance
attendance        → daily attendance records

-- Finance
fees              → fee structures
invoices          → student invoices
payments          → payment records

-- Examination
exams             → exam definitions
exam_schedules    → exam timetable
grades            → student marks per exam
exam_questions    → question bank
exam_sessions     → per-student exam state
exam_answers      → auto-saved answers
exam_submissions  → final submission + score

-- Learning
assignments       → homework/tasks
submissions       → student assignment submissions

-- Communication
announcements     → school announcements
messages          → parent-teacher messaging
events            → school calendar events

-- Library
library_books     → book catalog
borrowings        → book borrow records
```

---

## 5. Scaffolding (Reuse dari lms-MrOle)

```
src/
├── components/
│   ├── common/        → Button, Card, Input, Badge, Skeleton, CrudTable
│   ├── feedback/      → EmptyState, ErrorState, ConfirmModal
│   ├── layout/        → MainLayout, AuthLayout, DashboardLayout, AdminLayout
│   └── navigation/    → Navbar, Sidebar, LanguageSwitcher
├── contexts/          → AuthContext
├── hooks/             → useAuth, useAdmin, useCRUD (pattern)
├── services/          → supabase.js + per-module services
├── utils/             → cn.js, format.js, sanitize.js, rateLimit.js
├── i18n/              → id.json, en.json
└── styles/            → globals.css, tailwind.config.js
```

---

## 6. MVP Scope (Phase 1)

| # | Module | Estimasi |
|---|--------|----------|
| 1 | Auth + User Roles | 1-2 hari |
| 2 | Student Info System | 2-3 hari |
| 3 | Attendance | 2-3 hari |
| 4 | Timetable | 2-3 hari |
| 5 | Fee Management | 3-4 hari |
| 6 | Exam & Grading (with online exam 500 concurrent) | 5-6 hari |
| 7 | LMS (materials + assignments) | 3-4 hari |
| 8 | Communication (announcements + messaging) | 2-3 hari |

**Total MVP: ~21-30 hari** (dengan scaffolding existing)

---

## 7. Future Phases

| Phase | Modules |
|-------|---------|
| **Phase 2** | Library, HR/Payroll, Transport, Report Cards PDF |
| **Phase 3** | Mobile app (React Native), WhatsApp integration |
| **Phase 4** | AI analytics, GPS tracking, Biometric attendance |

---

## 8. References

- [School-Core](https://school-core.com/) — Complete School Operating System
- [Lorefy School](https://lorefy.in/school-learning-management-system/) — ERP + LMS + CRM
- [EazyEdu](https://eazyedu.org/) — AI-Powered School ERP (30+ modules)
- [EdFleet](https://edfleet.com/blog/school-management-system-features/) — 13 Critical Features
- [Clast.io](https://clast.io/blog/School-Management-System) — Complete 2026 Guide
- [SchoolUnique](https://schoolunique.app/) — School Management ERP
- [DreamClass](https://www.dreamclass.io/the-ultimate-guide-to-choosing-a-school-management-system/) — SMS Guide

---

*Document created: 27 Juli 2026*
*Last updated: 27 Juli 2026*
