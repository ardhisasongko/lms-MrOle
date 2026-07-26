import { Link, Navigate } from 'react-router-dom';
import { GraduationCap, BookOpen, BarChart3, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

const features = [
  {
    icon: BookOpen,
    title: 'Latihan Soal Interaktif',
    desc: 'Grammar, Vocabulary, Reading, Listening, Speaking, dan Writing dalam satu platform.',
  },
  {
    icon: BarChart3,
    title: 'Pantau Progres Belajar',
    desc: 'Lihat perkembangan skor, statistik per kategori, dan streak belajar harian.',
  },
  {
    icon: MessageSquare,
    title: 'Chatbot AI (Segera)',
    desc: 'Tanya jawab bahasa Inggris, koreksi grammar, dan penjelasan materi dengan AI.',
  },
];

const benefits = [
  'Soal dengan tingkat kesulitan Mudah, Sedang, Sulit',
  'Pembahasan lengkap setiap soal',
  'Belajar kapan saja, di mana saja',
  'Gratis untuk siswa Indonesia',
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Belajar Bahasa Inggris
              <span className="block text-primary-200">Lebih Mudah dan Menyenangkan</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Tingkatkan kemampuan bahasa Inggris-mu dengan latihan soal interaktif,
              pembahasan detail, dan pantau progres belajarmu.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 hover:bg-primary-50 rounded-lg font-medium text-base min-h-[48px] transition-colors duration-150 w-full sm:w-auto"
              >
                Mulai Belajar Gratis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/30 text-white hover:bg-white/10 rounded-lg font-medium text-base min-h-[48px] transition-colors duration-150 w-full sm:w-auto"
              >
                Sudah Punya Akun
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 dark:from-gray-900" />
      </section>

      <section className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Semua yang kamu butuhkan untuk belajar bahasa Inggris secara mandiri
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-8">
              Kenapa Mr Ole?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 p-4">
                  <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Siap Meningkatkan Bahasa Inggris-mu?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Mulai belajar sekarang, gratis!
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-700 hover:bg-primary-50 rounded-lg font-medium text-base min-h-[48px] transition-colors duration-150"
          >
            Daftar Gratis
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-primary-400" />
            <span className="text-white font-semibold">Mr Ole</span>
          </div>
          <p>&copy; 2026 Mr Ole. Belajar Bahasa Inggris untuk siswa Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
