import { BookOpen, TrendingUp, Award, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import { useProgress } from '../hooks/useProgress';
import { formatDate } from '../utils/format';
import Badge from '../components/common/Badge';

export default function Dashboard() {
  const { stats, scoreByCategory, chartData, loading } = useProgress();

  const statCards = [
    { label: 'Total Soal', value: stats.totalQuestions, icon: BookOpen, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Rata-rata Nilai', value: `${stats.averageScore}%`, icon: TrendingUp, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Streak Belajar', value: `${stats.streak} hari`, icon: Award, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    {
      label: 'Sesi Terakhir',
      value: stats.lastSession ? formatDate(stats.lastSession) : '-',
      icon: Clock,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Pantau perkembangan belajarmu.</p>
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
                <CardContent className="flex flex-col items-center text-center py-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
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
              <EmptyState icon={TrendingUp} title="Belum Ada Data" description="Kerjakan latihan untuk melihat grafik." />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'short' })}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric' })}
                    formatter={(val) => [`${val}%`, 'Nilai']}
                  />
                  <Bar dataKey="score" fill="var(--color-primary, #3b82f6)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
              <div className="space-y-3">
                {scoreByCategory.map((cat) => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{cat.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          cat.score >= 80 ? 'bg-green-500' : cat.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
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
