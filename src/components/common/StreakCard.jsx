import { Flame, Calendar, Trophy } from '@phosphor-icons/react';
import Card, { CardContent } from './Card';
import Skeleton from './Skeleton';

export default function StreakCard({ streakData, loading }) {
  if (loading) {
    return <Skeleton className="h-32 rounded-2xl" />;
  }

  const { currentStreak, longestStreak, todayDone, weekActivity, totalDays } = streakData;

  return (
    <Card className="overflow-hidden">
      <CardContent className="py-5">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            currentStreak > 0
              ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
          }`}>
            <Flame className="w-7 h-7" weight={currentStreak > 0 ? 'fill' : 'regular'} />
          </div>
          <div className="flex-1">
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">
              {currentStreak}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentStreak === 1 ? 'hari berturut-turut' : 'hari berturut-turut'}
            </p>
          </div>
          {!todayDone && (
            <div className="px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
              Hari ini belum
            </div>
          )}
          {todayDone && (
            <div className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
              Selesai!
            </div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {weekActivity.map((day) => {
            const dayName = new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' });
            return (
              <div key={day.date} className="flex flex-col items-center gap-1">
                <span className="text-[0.625rem] text-gray-400 dark:text-gray-500">{dayName}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[0.625rem] font-medium transition-all ${
                  day.done
                    ? 'bg-cta-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'
                }`}>
                  {day.done ? day.questions : ''}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Trophy className="w-3.5 h-3.5 text-yellow-500" weight="fill" />
            <span>Terpanjang: <strong className="text-gray-700 dark:text-gray-300">{longestStreak}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5 text-secondary-500" />
            <span>Total: <strong className="text-gray-700 dark:text-gray-300">{totalDays}</strong> hari</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
