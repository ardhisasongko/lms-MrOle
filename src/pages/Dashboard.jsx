import { BookOpen, TrendUp, Medal, BookmarkSimple, Target, Star, Lightbulb, PlayCircle } from '@phosphor-icons/react';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import StreakCard from '../components/common/StreakCard';
import { useProgress } from '../hooks/useProgress';
import { useStreak } from '../hooks/useStreak';
import { useAuth } from '../contexts/AuthContext';
import { getBookmarkCount } from '../services/bookmarks';
import { getLocale } from '../utils/format';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { checkBadges, getDailyProgress, getRecommendations } from '../services/gamification';
import Confetti from '../components/game/Confetti';
import { playLevelUp } from '../utils/sound';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, scoreByCategory, chartData, loading } = useProgress();
  const streakData = useStreak();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevLevel, setPrevLevel] = useState(1);
  const dailyProgress = useMemo(() => getDailyProgress(), []);
  const hasPerfect = useMemo(() => stats.averageScore >= 100, [stats]);

  useEffect(() => {
    if (user?.id) {
      getBookmarkCount(user.id).then(setBookmarkCount).catch(() => {});
    }
  }, [user?.id]);

  const { xp, level, nextLevelXp, prevLevelXp } = useMemo(() => {
    if (stats.totalQuestions === 0) return { xp: 0, level: 1, nextLevelXp: 100, prevLevelXp: 0 };
    const correctAnswers = Math.round(stats.totalQuestions * (stats.averageScore / 100));
    const xp = correctAnswers * 10;
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const nextLevelXp = Math.pow(level, 2) * 100;
    const prevLevelXp = Math.pow(level - 1, 2) * 100;
    return { xp, level, nextLevelXp, prevLevelXp };
  }, [stats]);

  useEffect(() => {
    if (level > prevLevel && prevLevel > 1) {
      setShowConfetti(true);
      playLevelUp();
      setTimeout(() => setShowConfetti(false), 3000);
    }
    if (level !== prevLevel) setPrevLevel(level);
  }, [level]);

  const levelProgress = nextLevelXp > prevLevelXp ? ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100 : 0;

  const badgeList = useMemo(() => {
    if (stats.totalQuestions === 0) return [];
    const categoryCount = scoreByCategory.length;
    return checkBadges({
      total: stats.totalQuestions,
      avgScore: stats.averageScore,
      streak: streakData.currentStreak,
      hasPerfect,
      categoryCount,
      dailyDone: dailyProgress.answered >= 10,
    });
  }, [stats, streakData.currentStreak, hasPerfect, scoreByCategory, dailyProgress]);

  const recommendations = useMemo(() => getRecommendations(scoreByCategory), [scoreByCategory]);

  const motivation = useMemo(() => {
    if (loading) return null;
    if (stats.totalQuestions === 0) {
      return 'Ayo mulai! Kerjakan latihan pertamamu untuk membuka rapor belajarmu.';
    }
    if (dailyProgress.answered < 10) {
      const remaining = 10 - dailyProgress.answered;
      return `Tinggal ${remaining} soal lagi untuk menyelesaikan Quest Harian. Pertahankan streak ${streakData.currentStreak} harimu!`;
    }
    if (streakData.currentStreak >= 3) {
      return `Hebat, streak ${streakData.currentStreak} hari! Jangan putus hari ini.`;
    }
    return 'Quest harian selesai! Lanjut tantang dirimu di kategori lain.';
  }, [loading, stats.totalQuestions, dailyProgress.answered, streakData.currentStreak]);

  const improvement = useMemo(() => {
    if (chartData.length < 2) return null;
    const today = chartData[chartData.length - 1].score;
    const yesterday = chartData[chartData.length - 2].score;
    if (yesterday > 0 && today > yesterday) return today - yesterday;
    return null;
  }, [chartData]);

  const categoryInsight = useMemo(() => {
    if (scoreByCategory.length < 2) return null;
    const best = scoreByCategory.reduce((a, b) => (b.score > a.score ? b : a));
    const weak = scoreByCategory.reduce((a, b) => (b.score < a.score ? b : a));
    if (best.name === weak.name) return null;
    return { best, weak };
  }, [scoreByCategory]);

  function timeAgo(dateStr) {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'kemarin' : `${days} hari lalu`;
  }

  const statCards = [
    { label: 'Total Soal', value: stats.totalQuestions, icon: BookOpen, color: 'text-primary-500 bg-primary-100 dark:bg-primary-900/30', to: '/history' },
    { label: 'Rata-rata Nilai', value: `${stats.averageScore}%`, icon: TrendUp, color: 'text-cta-500 bg-cta-100 dark:bg-cta-900/30', to: '/history' },
    { label: 'Streak', value: `${streakData.currentStreak} hari`, icon: Medal, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', to: '/practice' },
    { label: 'Bookmark', value: bookmarkCount, icon: BookmarkSimple, color: 'text-secondary-500 bg-secondary-100 dark:bg-secondary-900/30', to: '/bookmarks' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-[1.875rem] font-semibold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5">{motivation || 'Pantau perkembangan belajarmu.'}</p>
        {!loading && stats.lastSession && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Latihan terakhir: {timeAgo(stats.lastSession)}
          </p>
        )}
      </div>

      {!loading && stats.totalQuestions > 0 && improvement && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800/30">
          <span className="text-2xl">🎉</span>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            Skormu naik {improvement} poin dibanding kemarin. Pertahankan momentummu!
          </p>
        </div>
      )}

      <Card hover={false}>
        <CardContent className="py-4 px-5 sm:px-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                <PlayCircle className="w-6 h-6 text-white" weight="fill" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {stats.totalQuestions === 0 ? 'Siap mulai belajar?' : 'Lanjut berlatih!'}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {stats.totalQuestions === 0
                    ? 'Kerjakan latihan pertamamu dan raih badge pertama.'
                    : 'Pilih kategori dan naikkan levelmu hari ini.'}
                </p>
              </div>
            </div>
            <Link
              to="/practice"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cta-500 text-white text-sm font-medium rounded-xl hover:bg-cta-600 shadow-clay transition-all duration-200 ease-spring active:scale-[0.98] shrink-0 min-h-[44px] w-full sm:w-auto"
            >
              Mulai Latihan
              <PlayCircle className="w-4 h-4" weight="fill" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {!loading && stats.totalQuestions > 0 && (
        <Link to="/practice" className="block group">
          <Card hover={false}>
            <CardContent className="py-5 px-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-clay">
                  <Star className="w-7 h-7 text-white" weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Level {level}</h2>
                    <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">{xp} XP</span>
                  </div>
                  <div className="mt-2 relative w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 ease-spring"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {xp}/{nextLevelXp} XP ke Level {level + 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                to={stat.to}
                className="group block transition-transform duration-200 ease-spring hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Card hover={false} className="h-full group-hover:shadow-md transition-shadow duration-200">
                  <CardContent className="flex flex-col items-center text-center py-5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                      <Icon className="w-5 h-5" weight="fill" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 group-hover:text-primary-500 transition-colors">{stat.label}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <StreakCard streakData={streakData} loading={loading} />

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Grafik Harian</h3>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 rounded-lg" />
            ) : chartData.every((d) => d.score === 0) ? (
              <EmptyState icon={TrendUp} title="Belum Ada Data" description="Kerjakan latihan untuk melihat grafik." />
            ) : (
              <div className="space-y-3 pt-2">
                {chartData.map((d) => {
                  const pct = d.score;
                  return (
                    <div key={d.date} className="flex items-center gap-3">
                      <span className="w-8 text-xs text-gray-400 shrink-0 text-right">
                        {new Date(d.date).toLocaleDateString(
                          getLocale(),
                          { weekday: 'short' }
                        )}
                      </span>
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-gradient-to-r from-primary-300 to-primary-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-xs font-medium text-gray-600 dark:text-gray-400 text-right shrink-0">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Skor per Kategori</h3>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 rounded-lg" />
            ) : scoreByCategory.length === 0 ? (
              <EmptyState icon={BookOpen} title="Belum Ada Data" description="Kerjakan latihan untuk melihat skor per kategori." />
            ) : (
              <>
                <div className="space-y-4">
                  {scoreByCategory.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-600 dark:text-gray-400">{cat.name}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{cat.score}%</span>
                      </div>
                      <div className="w-full bg-black/[0.04] dark:bg-white/[0.06] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            cat.score >= 80 ? 'bg-cta-500' : cat.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${cat.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {categoryInsight && (
                  <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      💪 Terkuat: <span className="font-medium text-gray-700 dark:text-gray-300">{categoryInsight.best.name}</span> ({categoryInsight.best.score}%)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🎯 Perlu ditingkatkan: <span className="font-medium text-gray-700 dark:text-gray-300">{categoryInsight.weak.name}</span> ({categoryInsight.weak.score}%)
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      {badgeList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-[0.06em] mb-3">Prestasi</h3>
          <div className="flex flex-wrap gap-3">
            {badgeList.filter((b) => b.earned).slice(0, 8).map((b) => (
              <div key={b.id} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm">
                <span className="text-lg">{b.icon}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Quest */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Star className="w-5 h-5 text-white" weight="fill" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Quest Harian</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">Jawab 10 soal hari ini</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{Math.min(dailyProgress.answered, 10)}/10</span>
            </div>
          </div>
          <div className="mt-3 w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 ease-spring"
              style={{ width: `${Math.min((dailyProgress.answered / 10) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" weight="fill" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Rekomendasi Latihan</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/practice`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm break-words leading-snug">{cat.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 break-words">Rata-rata: {cat.score}% — Perlu ditingkatkan</p>
                  </div>
                  <PlayCircle className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-primary-500 transition-colors" weight="fill" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Confetti active={showConfetti} />

      {!loading && stats.totalQuestions === 0 && (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={BookOpen}
              title="Belum Ada Aktivitas"
              description="Mulai latihan soal untuk melihat progres belajarmu."
              action={
                <a href="/practice" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                  <Target className="w-4 h-4" />
                  Mulai Latihan
                </a>
              }
            />
          </CardContent>
        </Card>
      )}

      {!loading && stats.totalQuestions > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ringkasan</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Soal:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.totalQuestions}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Streak:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{streakData.currentStreak} hari</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Bookmark:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{bookmarkCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
