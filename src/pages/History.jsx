import { useNavigate } from 'react-router-dom';
import { ClockCounterClockwise as HistoryIcon, CaretLeft, CaretRight, ArrowSquareOut } from '@phosphor-icons/react';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import Badge from '../components/common/Badge';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import { useHistory } from '../hooks/useHistory';
import { DIFFICULTY_LABEL } from '../utils/constants';
import { formatDate } from '../utils/format';

export default function History() {
  const navigate = useNavigate();
  const { attempts, loading, page, hasMore, categories, categoryFilter, goToPage, applyFilter } = useHistory();

  const scoreBadge = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const currentPage = page + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Riwayat Latihan</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Semua hasil latihan yang pernah kamu kerjakan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyFilter('')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              !categoryFilter ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => applyFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                categoryFilter === cat.id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={HistoryIcon}
              title="Belum Ada Riwayat"
              description="Kerjakan latihan soal untuk melihat riwayat."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {attempts.map((a) => (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                      a.score >= 80 ? 'bg-green-500' : a.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      {Math.round(a.score)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {a.categories?.name || 'Unknown'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={scoreBadge(a.score)} size="sm">
                          {DIFFICULTY_LABEL[a.difficulty] || a.difficulty}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {a.correct_answers}/{a.total_questions} benar
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(a.completed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/practice/${a.id}/result`)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors duration-150"
                  >
                    <ArrowSquareOut className="w-4 h-4" />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors duration-150"
            >
              <CaretLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Halaman {currentPage}</span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors duration-150"
            >
              <CaretRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
