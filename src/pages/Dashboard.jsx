import { BookOpen, TrendUp, Medal, Clock } from '@phosphor-icons/react';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import { useProgress } from '../hooks/useProgress';
import { formatDate } from '../utils/format';

export default function Dashboard() {
  const { stats, scoreByCategory, chartData, loading } = useProgress();

  const statCards = [
    { label: 'Total Soal', value: stats.totalQuestions, icon: BookOpen, color: 'text-primary-500 bg-primary-100 dark:bg-primary-900/30' },
    { label: 'Rata-rata Nilai', value: `${stats.averageScore}%`, icon: TrendUp, color: 'text-cta-500 bg-cta-100 dark:bg-cta-900/30' },
    { label: 'Streak Belajar', value: `${stats.streak} hari`, icon: Medal, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
    {
      label: 'Sesi Terakhir',
      value: stats.lastSession ? formatDate(stats.lastSession) : '-',
      icon: Clock,
      color: 'text-secondary-500 bg-secondary-100 dark:bg-secondary-900/30',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-[1.875rem] font-semibold tracking-tight text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1.5">Pantau perkembangan belajarmu.</p>
      </div>

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
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Grafik Perkembangan (7 Hari)</h3>
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
                        {new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                      <div className="flex-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-gradient-to-r from-primary-300 to-primary-500"
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
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
