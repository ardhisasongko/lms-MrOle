import { BookOpen, TrendUp, Medal, BookmarkSimple, Target, Star } from '@phosphor-icons/react';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import StreakCard from '../components/common/StreakCard';
import { useProgress } from '../hooks/useProgress';
import { useStreak } from '../hooks/useStreak';
import { useAuth } from '../contexts/AuthContext';
import { getBookmarkCount } from '../services/bookmarks';
import { formatDate, getLocale } from '../utils/format';
import { useState, useEffect, useMemo } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const { stats, scoreByCategory, chartData, loading } = useProgress();
  const streakData = useStreak();
  const [bookmarkCount, setBookmarkCount] = useState(0);

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

  const levelProgress = nextLevelXp > prevLevelXp ? ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100 : 0;

  const statCards = [
    { label: 'Total Soal', value: stats.totalQuestions, icon: BookOpen, color: 'text-primary-500 bg-primary-100 dark:bg-primary-900/30' },
    { label: 'Rata-rata Nilai', value: `${stats.averageScore}%`, icon: TrendUp, color: 'text-cta-500 bg-cta-100 dark:bg-cta-900/30' },
    { label: 'Streak', value: `${streakData.currentStreak} hari`, icon: Medal, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'Bookmark', value: bookmarkCount, icon: BookmarkSimple, color: 'text-secondary-500 bg-secondary-100 dark:bg-secondary-900/30' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-[1.875rem] font-semibold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5">Pantau perkembangan belajarmu.</p>
      </div>

      {!loading && stats.totalQuestions > 0 && (
        <Card>
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
              <Card key={stat.label}>
                <CardContent className="flex flex-col items-center text-center py-5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                    <Icon className="w-5 h-5" weight="fill" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <StreakCard streakData={streakData} loading={loading} />

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Skor per Kategori</h3>
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
            )}
          </CardContent>
        </Card>
      </div>

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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/20">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.totalQuestions}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Soal</p>
              </div>
              <div className="p-3 rounded-xl bg-cta-50/50 dark:bg-cta-900/20">
                <p className="text-2xl font-bold text-cta-600 dark:text-cta-400">{stats.averageScore}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Rata-rata</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/20">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{streakData.currentStreak}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Streak Hari</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary-50/50 dark:bg-secondary-900/20">
                <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{bookmarkCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bookmark</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
