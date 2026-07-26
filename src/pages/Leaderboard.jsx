import { Trophy, Medal, User } from 'lucide-react';
import Card, { CardContent } from '../components/common/Card';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/feedback/EmptyState';
import { useLeaderboard } from '../hooks/useLeaderboard';

const rankColors = ['text-yellow-500', 'text-gray-400', 'text-orange-600'];

export default function Leaderboard() {
  const { rankings, loading } = useLeaderboard();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Peringkat</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Lihat skor terbaik dari semua pengguna.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : rankings.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState icon={Trophy} title="Belum Ada Data" description="Belum ada pengguna yang mengerjakan latihan." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rankings.map((user, i) => (
            <Card key={user.id} className={`${i < 3 ? 'ring-2 ring-primary-500/20' : ''}`}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="w-8 text-center shrink-0">
                  {i < 3 ? (
                    <Medal className={`w-6 h-6 mx-auto ${rankColors[i]}`} />
                  ) : (
                    <span className="text-sm font-bold text-gray-400">{i + 1}</span>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.count} sesi, {user.totalQuestions} soal</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary-600">{user.avgScore}</p>
                  <p className="text-xs text-gray-400">rata-rata</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
