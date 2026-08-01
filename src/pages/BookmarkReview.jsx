import { useState, useMemo } from 'react';
import { BookmarkSimple, MagnifyingGlass, Trash, CaretDown, CaretUp, GraduationCap, BookOpen, PenNib } from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import Stimulus from '../components/quiz/Stimulus';
import { useBookmarks } from '../hooks/useBookmarks';
import { DIFFICULTY_LABEL } from '../utils/constants';
import toast from 'react-hot-toast';
import { handleError } from '../utils/errors';

const difficultyIcons = {
  easy: GraduationCap,
  medium: BookOpen,
  hard: PenNib,
};

const difficultyBadge = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

function getOptions(options) {
  if (Array.isArray(options)) return options;
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      return [];
    }
  }
  return options ? Object.values(options) : [];
}

export default function BookmarkReview() {
  const { bookmarks, loading, error, toggleBookmark } = useBookmarks();
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => bookmarks.filter((b) => {
    const q = b.questions;
    if (!q) return false;
    const matchesSearch = !search ||
      (q.prompt || q.question || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.stimulus || '').toLowerCase().includes(search.toLowerCase()) ||
      q.categories?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !filterDifficulty || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  }), [bookmarks, search, filterDifficulty]);

  const handleRemove = async (questionId) => {
    try {
      await toggleBookmark(questionId);
      toast.success('Bookmark dihapus');
    } catch (err) {
      handleError(err, 'Gagal menghapus bookmark');
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState icon={BookmarkSimple} title="Gagal Memuat" description={error} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Bookmark Soal
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          Tinjau soal-soal yang sudah kamu bookmark.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari soal atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 transition-all duration-200"
          />
        </div>
        <div className="flex gap-2">
          {['easy', 'medium', 'hard'].map((d) => {
            const DiffIcon = difficultyIcons[d];
            return (
              <button
                key={d}
                onClick={() => setFilterDifficulty(filterDifficulty === d ? '' : d)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filterDifficulty === d
                    ? 'bg-primary-500 text-white shadow-clay'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <DiffIcon className="w-3.5 h-3.5" />
                {DIFFICULTY_LABEL[d]}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={BookmarkSimple}
              title={bookmarks.length === 0 ? 'Belum Ada Bookmark' : 'Tidak Ditemukan'}
              description={
                bookmarks.length === 0
                  ? 'Bookmark soal saat mengerjakan latihan untuk ditinjau nanti.'
                  : 'Tidak ada bookmark yang cocok dengan filter.'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const q = b.questions;
            const isExpanded = expandedId === b.id;
            const DiffIcon = difficultyIcons[q.difficulty] || BookOpen;

            return (
              <Card
                key={b.id}
                className="transition-all duration-200 hover:shadow-md"
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant={difficultyBadge[q.difficulty]} size="sm">
                          <DiffIcon className="w-3 h-3 inline mr-1" />
                          {DIFFICULTY_LABEL[q.difficulty]}
                        </Badge>
                        <span className="text-xs text-gray-400 min-w-0 break-words">{q.categories?.name}</span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                         {q.prompt || q.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label={isExpanded ? 'Tutup rincian soal' : 'Buka rincian soal'}
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId(isExpanded ? null : b.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
                      >
                        {isExpanded ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        aria-label="Hapus bookmark"
                        onClick={() => handleRemove(q.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                      <Stimulus>{q.stimulus}</Stimulus>
                      {/* Full question */}
                      <div>
                        <p className="sr-only">Soal</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{q.prompt || q.question}</p>
                      </div>

                      {/* Options if MCQ */}
                      {q.options && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilihan:</p>
                          <div className="space-y-1.5">
                            {getOptions(q.options).map((opt, i) => {
                              const isObjectOption = opt && typeof opt === 'object';
                              const label = isObjectOption ? opt.label : String.fromCharCode(65 + i);
                              const text = isObjectOption ? opt.text : opt;
                              const isCorrect = isObjectOption ? label === q.correct_answer : opt === q.correct_answer;
                              return (
                                <div
                                  key={i}
                                  className={`px-3 py-2 rounded-lg text-sm ${
                                    isCorrect
                                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  {label}. {text}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Correct answer */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jawaban Benar:</p>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">{q.correct_answer}</p>
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Pembahasan:</p>
                          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
