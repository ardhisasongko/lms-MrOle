import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockCounterClockwise as HistoryIcon, CaretLeft, CaretRight,
  ArrowSquareOut, MagnifyingGlass, Calendar, Trophy, TrendUp,
  GraduationCap, BookOpen, PenNib,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import { useHistory } from '../hooks/useHistory';
import { DIFFICULTY_LABEL } from '../utils/constants';
import { formatDate } from '../utils/format';
import { handleError } from '../utils/errors';

const difficultyIcons = {
  easy: GraduationCap,
  medium: BookOpen,
  hard: PenNib,
};

export default function History() {
  const navigate = useNavigate();
  const { attempts, loading, error, page, hasMore, categories, categoryFilter, goToPage, applyFilter } = useHistory();
  const [search, setSearch] = useState('');

  useEffect(() => { if (error) handleError(error, 'Gagal memuat riwayat.'); }, [error]);
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const scoreBadge = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  const filtered = attempts.filter((a) => {
    const matchesSearch = !search ||
      a.categories?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !difficultyFilter || a.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return b.score - a.score;
    if (sortBy === 'date') return new Date(b.completed_at) - new Date(a.completed_at);
    return 0;
  });

  const currentPage = page + 1;

  const stats = {
    total: attempts.length,
    avgScore: attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0,
    bestScore: attempts.length > 0
      ? Math.round(Math.max(...attempts.map((a) => a.score)))
      : 0,
    totalQuestions: attempts.reduce((sum, a) => sum + a.total_questions, 0),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Riwayat Latihan
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          Semua hasil latihan yang pernah kamu kerjakan.
        </p>
      </div>

      {/* Stats Summary */}
      {!loading && attempts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/20 text-center">
            <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{stats.total}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Sesi</p>
          </div>
          <div className="p-3 rounded-xl bg-cta-50/50 dark:bg-cta-900/20 text-center">
            <p className="text-xl font-bold text-cta-600 dark:text-cta-400">{stats.avgScore}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Rata-rata</p>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/20 text-center">
            <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.bestScore}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Terbaik</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary-50/50 dark:bg-secondary-900/20 text-center">
            <p className="text-xl font-bold text-secondary-600 dark:text-secondary-400">{stats.totalQuestions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Soal</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 transition-all duration-200"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyFilter('')}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              !categoryFilter
                ? 'bg-primary-500 text-white shadow-clay'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Semua
          </button>
          {categories.slice(0, 5).map((cat) => (
            <button
              key={cat.id}
              onClick={() => applyFilter(cat.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                categoryFilter === cat.id
                  ? 'bg-primary-500 text-white shadow-clay'
                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 transition-all duration-200"
        >
          <option value="date">Terbaru</option>
          <option value="score">Skor Tertinggi</option>
        </select>
      </div>

      {/* Difficulty Filter */}
      <div className="flex gap-2">
        {['easy', 'medium', 'hard'].map((d) => {
          const DiffIcon = difficultyIcons[d];
          return (
            <button
              key={d}
              onClick={() => setDifficultyFilter(difficultyFilter === d ? '' : d)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                difficultyFilter === d
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <DiffIcon className="w-3 h-3" />
              {DIFFICULTY_LABEL[d]}
            </button>
          );
        })}
      </div>

      {/* Attempts List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
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
            {sorted.map((a) => {
              const DiffIcon = difficultyIcons[a.difficulty] || BookOpen;
              return (
                <Card key={a.id} className="hover:shadow-md transition-all duration-200 group">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg ${
                        a.score >= 80 ? 'bg-gradient-to-br from-green-400 to-green-600 shadow-green-200 dark:shadow-green-900/30' :
                        a.score >= 50 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-200 dark:shadow-yellow-900/30' :
                        'bg-gradient-to-br from-red-400 to-red-600 shadow-red-200 dark:shadow-red-900/30'
                      }`}>
                        {Math.round(a.score)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {a.categories?.name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={scoreBadge(a.score)} size="sm">
                            <DiffIcon className="w-3 h-3 inline mr-1" />
                            {DIFFICULTY_LABEL[a.difficulty]}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {a.correct_answers}/{a.total_questions} benar
                          </span>
                          <span className="text-xs text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(a.completed_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/practice/${a.id}/result`)}
                      className="p-2.5 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-400 hover:text-primary-500 transition-all duration-200 group-hover:scale-105"
                    >
                      <ArrowSquareOut className="w-5 h-5" />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 0}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all duration-200"
            >
              <CaretLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Halaman {currentPage}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition-all duration-200"
            >
              <CaretRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
