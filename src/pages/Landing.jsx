import { Link, Navigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, ArrowRight,
  Sparkle, Star, Target, Lightning, Heart, Brain, Globe,
  CheckCircle, Flame,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import { useAuth } from '../contexts/AuthContext';

const courses = [
  { icon: BookOpen, title: 'Grammar', desc: 'Tata bahasa Inggris dari dasar hingga mahir', color: '#FDBCB4', bg: '#FFF0ED' },
  { icon: Globe, title: 'Vocabulary', desc: 'Perkaya kosakata sehari-hari & akademik', color: '#ADD8E6', bg: '#EDF6FA' },
  { icon: Brain, title: 'Reading', desc: 'Pahami teks bahasa Inggris dengan cepat', color: '#C4A8FF', bg: '#F3EDFF' },
  { icon: Target, title: 'Listening', desc: 'Latihan mendengar berbagai aksen native', color: '#A8E6CF', bg: '#EDFBF4' },
  { icon: Lightning, title: 'Speaking', desc: 'Praktik pengucapan & percakapan sehari-hari', color: '#FFD6A5', bg: '#FFF8F0' },
  { icon: Heart, title: 'Writing', desc: 'Tulis esai, email & pesan profesional', color: '#FFB5C2', bg: '#FFF0F3' },
];

const testimonials = [
  { name: 'Siti Aisyah', role: 'Siswa SMA Kelas 11', avatar: 'SA', color: '#FDBCB4', text: 'Belajar jadi lebih seru! Aku nggak sadar kalau udah belajar grammar 30 menit. Nilai bahasa Inggris naik dari 65 jadi 85 dalam sebulan.' },
  { name: 'Budi Santoso', role: 'Mahasiswa Semester 3', avatar: 'BS', color: '#ADD8E6', text: 'Fitur latihan soal per kategori bantu banget persiapan TOEFL. Streak feature bikin aku makin semangat belajar tiap hari.' },
  { name: 'Dewi Lestari', role: 'Karyawan Swasta', avatar: 'DL', color: '#C4A8FF', text: 'Jadwal kerja padat, tapi Mr Ole bisa diakses kapan aja. Chatbot AI-nya cocok buat tanya-tanya cepat soal grammar.' },
];

const weeklyData = [
  { day: 'Sen', pct: 85 }, { day: 'Sel', pct: 60 }, { day: 'Rab', pct: 92 },
  { day: 'Kam', pct: 45 }, { day: 'Jum', pct: 78 }, { day: 'Sab', pct: 95 }, { day: 'Min', pct: 0 },
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FDBCB4 0%, #ADD8E6 50%, #C4A8FF 100%)' }}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[#C4A8FF] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 text-gray-700 text-sm font-medium backdrop-blur-sm mb-8 shadow-sm">
                <Sparkle className="w-4 h-4 text-primary-400" weight="fill" /> Platform Belajar Inggris #1 untuk siswa Indonesia
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-800 leading-tight">
                Belajar Inggris
                <span className="block text-white drop-shadow-sm">Jadi Petualangan Seru!</span>
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
                Mr Ole bikin belajar bahasa Inggris terasa kayak main game — latihan seru, progres terpantau, dan AI siap bantu kapan aja!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white shadow-clay-lg hover:shadow-clay-xl transition-all duration-300 ease-spring active:scale-[0.98] w-full sm:w-auto"
                  style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
                >
                  Mulai Gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/80 text-gray-700 hover:bg-white hover:text-gray-900 font-semibold text-lg backdrop-blur-sm transition-all duration-300 ease-spring w-full sm:w-auto"
                >
                  Masuk
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-[40px] shadow-clay-xl" style={{ background: 'linear-gradient(145deg, #FFF5F0, #F0F8FF)' }}>
                  <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                    <GraduationCap className="w-20 h-20 text-primary-400 mb-4" weight="fill" />
                    <div className="text-4xl font-bold text-gray-800">Mr Ole</div>
                    <div className="text-gray-500 mt-2">Learn English with Joy!</div>
                    <div className="mt-6 flex gap-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="w-3 h-3 rounded-full" style={{ background: i === 0 ? '#FDBCB4' : i === 1 ? '#ADD8E6' : '#C4A8FF' }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── STATS ─── */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: '500+', label: 'Siswa Aktif', color: '#FDBCB4' },
              { value: '250+', label: 'Bank Soal', color: '#ADD8E6' },
              { value: '6', label: 'Kategori Belajar', color: '#C4A8FF' },
              { value: '100%', label: 'Gratis!', color: '#A8E6CF' },
            ].map((stat) => (
              <Card key={stat.label} hover={false}>
                <CardContent className="text-center py-6">
                  <div className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COURSE CATALOG ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 tracking-tight">
              Pilih Petualanganmu
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              6 kategori belajar yang bakal bikin kamu makin jago bahasa Inggris
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const Icon = course.icon;
              return (
                <Card key={course.title} className="p-6 group cursor-pointer">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ease-spring"
                    style={{ background: course.bg }}
                  >
                    <Icon className="w-7 h-7" weight="fill" style={{ color: course.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{course.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{course.desc}</p>
                  <div
                    className="mt-4 h-1.5 rounded-full w-0 group-hover:w-full transition-all duration-500 ease-spring"
                    style={{ background: `linear-gradient(90deg, ${course.color}, ${course.color}88)` }}
                  />
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PROGRESS DEMO ─── */}
      <section className="py-16 sm:py-20 bg-[#F7F8FA] dark:bg-[#0F1117]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 tracking-tight">
              Pantau Progres, Tetap Semangat
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Setiap latihan tercatat — lihat perkembanganmu dari hari ke hari
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Minggu Ini</h3>
                <Badge variant="success" size="sm">+15% dari minggu lalu</Badge>
              </div>
              <div className="space-y-3">
                {weeklyData.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-semibold text-gray-400">{d.day}</span>
                    <div className="flex-1 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-spring"
                        style={{ width: `${d.pct}%`, background: d.pct > 0 ? 'linear-gradient(90deg, #FDBCB4, #ADD8E6)' : 'transparent' }}
                      />
                    </div>
                    <span className="w-10 text-sm font-bold text-gray-600 text-right">{d.pct}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-400">Streak belajar</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Flame className="w-5 h-5 text-orange-400" weight="fill" />
                    <span className="text-2xl font-bold text-gray-800">5 hari</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-400">Rata-rata skor</span>
                  <div className="text-2xl font-bold mt-1 text-primary-400">76%</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 tracking-tight">
              Kata Mereka
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Yang udah cobain Mr Ole, pada suka!
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-primary-400" weight="fill" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                    style={{ background: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES STRIP ─── */}
      <section className="py-12 bg-[#F0F8FC] dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { icon: CheckCircle, text: 'Soal Mudah-Sulit' },
              { icon: CheckCircle, text: 'Pembahasan Lengkap' },
              { icon: CheckCircle, text: 'Akses 24/7' },
              { icon: CheckCircle, text: 'Gratis 100%' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-2 text-gray-600">
                  <Icon className="w-5 h-5 text-cta-500" weight="fill" />
                  <span className="font-medium text-sm">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FDBCB4 0%, #ADD8E6 50%, #C4A8FF 100%)' }}>
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4 leading-tight tracking-tight">
            Siap Jadi Jago Inggris?
          </h2>
          <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto">
            Gratis selamanya. Mulai sekarang, nggak perlu ragu!
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center justify-center gap-2 px-10 py-5 rounded-2xl font-bold text-xl text-white shadow-clay-lg hover:shadow-clay-xl transition-all duration-300 ease-spring active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}
          >
            Daftar Gratis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary-400" weight="fill" />
              <span className="text-white font-bold">Mr Ole</span>
            </div>
            <p className="text-sm text-center sm:text-left">&copy; 2026 Mr Ole. Belajar Inggris jadi seru.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
