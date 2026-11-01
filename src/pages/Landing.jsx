import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap, ArrowRight,
  Sparkle, Star, CheckCircle, Flame,
  TextAa, Translate, BookOpenText, Headphones, Microphone, PencilLine,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import { useAuth } from '../contexts/AuthContext';

const courses = [
  { icon: TextAa, titleKey: 'landing.courses.grammar.title', descKey: 'landing.courses.grammar.desc', colorClass: 'text-violet-600 dark:text-violet-300', bgClass: 'bg-violet-100 dark:bg-violet-500/15', barClass: 'bg-violet-500' },
  { icon: Translate, titleKey: 'landing.courses.vocabulary.title', descKey: 'landing.courses.vocabulary.desc', colorClass: 'text-amber-600 dark:text-amber-300', bgClass: 'bg-amber-100 dark:bg-amber-500/15', barClass: 'bg-amber-500' },
  { icon: BookOpenText, titleKey: 'landing.courses.reading.title', descKey: 'landing.courses.reading.desc', colorClass: 'text-sky-600 dark:text-sky-300', bgClass: 'bg-sky-100 dark:bg-sky-500/15', barClass: 'bg-sky-500' },
  { icon: Headphones, titleKey: 'landing.courses.listening.title', descKey: 'landing.courses.listening.desc', colorClass: 'text-teal-600 dark:text-teal-300', bgClass: 'bg-teal-100 dark:bg-teal-500/15', barClass: 'bg-teal-500' },
  { icon: Microphone, titleKey: 'landing.courses.speaking.title', descKey: 'landing.courses.speaking.desc', colorClass: 'text-rose-600 dark:text-rose-300', bgClass: 'bg-rose-100 dark:bg-rose-500/15', barClass: 'bg-rose-500' },
  { icon: PencilLine, titleKey: 'landing.courses.writing.title', descKey: 'landing.courses.writing.desc', colorClass: 'text-indigo-600 dark:text-indigo-300', bgClass: 'bg-indigo-100 dark:bg-indigo-500/15', barClass: 'bg-indigo-500' },
];

const testimonials = [
  { nameKey: 'landing.testimonials.siti.name', roleKey: 'landing.testimonials.siti.role', avatarKey: 'landing.testimonials.siti.avatar', colorClass: 'bg-primary-400', textKey: 'landing.testimonials.siti.text' },
  { nameKey: 'landing.testimonials.budi.name', roleKey: 'landing.testimonials.budi.role', avatarKey: 'landing.testimonials.budi.avatar', colorClass: 'bg-secondary-400', textKey: 'landing.testimonials.budi.text' },
  { nameKey: 'landing.testimonials.dewi.name', roleKey: 'landing.testimonials.dewi.role', avatarKey: 'landing.testimonials.dewi.avatar', colorClass: 'bg-lavender-400', textKey: 'landing.testimonials.dewi.text' },
];

const weeklyData = [
  { dayKey: 'landing.progress.days.mon', pct: 85 }, { dayKey: 'landing.progress.days.tue', pct: 60 }, { dayKey: 'landing.progress.days.wed', pct: 92 },
  { dayKey: 'landing.progress.days.thu', pct: 45 }, { dayKey: 'landing.progress.days.fri', pct: 78 }, { dayKey: 'landing.progress.days.sat', pct: 95 }, { dayKey: 'landing.progress.days.sun', pct: 0 },
];

export default function Landing() {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-primary-100">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-primary-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 sm:pt-32 sm:pb-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-200 text-sm font-medium backdrop-blur-sm mb-8 shadow-sm">
                 <Sparkle className="w-4 h-4 text-primary-400" weight="fill" /> {t('landing.hero.badge')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-gray-800 leading-tight">
                {t('landing.hero.title')}
                <span className="block text-primary-600">{t('landing.hero.accent')}</span>
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
                {t('landing.hero.desc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white bg-primary-500 hover:bg-primary-600 shadow-clay-lg hover:shadow-clay-xl transition-all duration-300 ease-spring active:scale-[0.98] w-full sm:w-auto"
                >
                  {t('landing.hero.cta')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 font-semibold text-lg backdrop-blur-sm transition-all duration-300 ease-spring w-full sm:w-auto"
                >
                  {t('landing.hero.login')}
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-[40px] shadow-clay-xl bg-surface-light">
                  <div className="p-8 h-full flex flex-col justify-center items-center text-center">
                    <GraduationCap className="w-20 h-20 text-primary-400 mb-4" weight="fill" />
                    <div className="text-4xl font-bold text-gray-800">{t('app.name')}</div>
                    <div className="text-gray-500 mt-2">{t('landing.hero.cardTagline')}</div>
                    <div className="mt-6 flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary-400" />
                      <div className="w-3 h-3 rounded-full bg-secondary-400" />
                      <div className="w-3 h-3 rounded-full bg-lavender-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { valueKey: 'landing.stats.activeStudentsValue', labelKey: 'landing.stats.activeStudents', colorClass: 'text-primary-600 dark:text-primary-400' },
              { valueKey: 'landing.stats.questionBankValue', labelKey: 'landing.stats.questionBank', colorClass: 'text-secondary-600 dark:text-secondary-400' },
              { valueKey: 'landing.stats.learningCategoriesValue', labelKey: 'landing.stats.learningCategories', colorClass: 'text-lavender-600 dark:text-lavender-400' },
              { valueKey: 'landing.stats.freeValue', labelKey: 'landing.stats.free', colorClass: 'text-mint-600 dark:text-mint-400' },
            ].map((stat) => (
              <Card key={stat.labelKey} hover={false}>
                <CardContent className="text-center py-6">
                  <div className={`text-3xl sm:text-4xl font-bold mb-1 ${stat.colorClass}`}>{t(stat.valueKey)}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t(stat.labelKey)}</div>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
              {t('landing.courses.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              {t('landing.courses.desc')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, idx) => {
              const Icon = course.icon;
              return (
                <div key={course.titleKey} className="animate-fade-up" style={{ animationDelay: `${idx * 80}ms` }}>
                  <Card className="p-6 group cursor-pointer h-full hover:-translate-y-1 transition-transform duration-300 ease-spring">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ease-spring ${course.bgClass}`}
                    >
                      <Icon className={`w-7 h-7 ${course.colorClass}`} weight="fill" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t(course.titleKey)}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{t(course.descKey)}</p>
                    <div
                      className={`mt-4 h-1.5 rounded-full w-0 group-hover:w-full transition-all duration-500 ease-spring ${course.barClass} opacity-70`}
                    />
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── PROGRESS DEMO ─── */}
      <section className="py-16 sm:py-20 bg-page-alt dark:bg-gray-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
              {t('landing.progress.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              {t('landing.progress.desc')}
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{t('landing.progress.thisWeek')}</h3>
                <Badge variant="success" size="sm">{t('landing.progress.weeklyChange', { percent: 15 })}</Badge>
              </div>
              <div className="space-y-3">
                {weeklyData.map((d) => (
                  <div key={d.dayKey} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-semibold text-gray-500 dark:text-gray-400">{t(d.dayKey)}</span>
                    <div className="flex-1 h-5 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-spring bg-primary-500"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-sm font-bold text-gray-600 dark:text-gray-300 text-right">{t('landing.progress.percent', { value: d.pct })}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('landing.progress.streakLabel')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Flame className="w-5 h-5 text-orange-400" weight="fill" />
                    <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('landing.progress.streakDays', { count: 5 })}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('landing.progress.averageScore')}</span>
                  <div className="text-2xl font-bold mt-1 text-primary-400 dark:text-primary-300">{t('landing.progress.percent', { value: 76 })}</div>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 tracking-tight">
              {t('landing.testimonials.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              {t('landing.testimonials.desc')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.nameKey} className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400" weight="fill" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 italic">
                  &ldquo;{t(testimonial.textKey)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${testimonial.colorClass}`}
                  >
                    {t(testimonial.avatarKey)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t(testimonial.nameKey)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t(testimonial.roleKey)}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES STRIP ─── */}
      <section className="py-12 bg-secondary-50 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { icon: CheckCircle, textKey: 'landing.featureStrip.difficulty' },
              { icon: CheckCircle, textKey: 'landing.featureStrip.explanations' },
              { icon: CheckCircle, textKey: 'landing.featureStrip.access' },
              { icon: CheckCircle, textKey: 'landing.featureStrip.free' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.textKey} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Icon className="w-5 h-5 text-cta-500" weight="fill" />
                  <span className="font-medium text-sm">{t(item.textKey)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 sm:py-28 relative overflow-hidden bg-primary-100">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4 leading-tight tracking-tight">
            {t('landing.cta.title')}
          </h2>
          <p className="text-gray-600 text-lg mb-10 max-w-xl mx-auto">
            {t('landing.cta.desc')}
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl text-white bg-primary-500 hover:bg-primary-600 shadow-clay-lg hover:shadow-clay-xl transition-all duration-300 ease-spring active:scale-[0.98]"
          >
            {t('landing.cta.button')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary-400" weight="fill" />
              <span className="text-white font-bold">{t('app.name')}</span>
            </div>
            <p className="text-sm text-center sm:text-left">{t('landing.footer.copyright', { year: 2026 })}</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
