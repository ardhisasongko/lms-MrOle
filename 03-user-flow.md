# LMS Mr Ole — User Flow

## Alur Utama

### 1. Registrasi & Login
```
Landing Page → Register → Verifikasi Email → Login → Dashboard
                ↓
           Sudah punya akun? → Login
```

### 2. Mengerjakan Latihan Soal
```
Dashboard → Pilih Kategori → Pilih Level → Mulai Quiz
                                                ↓
                                           Jawab Soal
                                                ↓
                                           Lihat Hasil
                                                ↓
                                           Lihat Pembahasan
                                                ↓
                                           Kembali ke Dashboard
```

### 3. Dashboard Progres
```
Dashboard
├── Statistik Utama (total soal, rata-rata nilai, streak)
├── Grafik Perkembangan (per minggu/bulan)
├── Skor per Kategori
└── Riwayat Latihan Terakhir
```

## Struktur Halaman

| Halaman | Route | Akses |
|---------|-------|-------|
| Landing | `/` | Publik |
| Login | `/login` | Publik |
| Register | `/register` | Publik |
| Verifikasi Email | `/verify` | Publik |
| Lupa Password | `/forgot-password` | Publik |
| Reset Password | `/reset-password` | Publik |
| Dashboard | `/dashboard` | Siswa |
| Pilih Kategori | `/practice` | Siswa |
| Kerjakan Soal | `/practice/:categoryId` | Siswa |
| Hasil Quiz | `/practice/:attemptId/result` | Siswa |
| Riwayat | `/history` | Siswa |
| Profil | `/profile` | Siswa |
| Pengaturan | `/settings` | Siswa |
| 404 | `*` | Publik |
