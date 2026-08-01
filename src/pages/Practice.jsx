import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Book, FileText, Headphones, Microphone, PenNib,
  CaretRight, GraduationCap, MagnifyingGlass, Star, MagicWand, Timer,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { useCategories } from '../hooks/useCategories';
import { useAuth } from '../contexts/AuthContext';
import { getQuestionCountsByCategory } from '../services/questions';
import { getLastScores } from '../services/quiz';
import { getRecommendedDifficulty } from '../services/adaptive';
import { DIFFICULTY_LABEL } from '../utils/constants';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/feedback/ErrorState';
import EmptyState from '../components/feedback/EmptyState';
import toast from 'react-hot-toast';

const iconMap = {
  BookOpen, Book, FileText, Headphones, Microphone, PenNib,
};

const difficulties = ['easy', 'medium', 'hard'];

const difficultyMeta = {
  easy: { icon: GraduationCap, label: DIFFICULTY_LABEL.easy },
  medium: { icon: BookOpen, label: DIFFICULTY_LABEL.medium },
  hard: { icon: PenNib, label: DIFFICULTY_LABEL.hard },
};

export default function Practice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, loading, error } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const [questionCounts, setQuestionCounts] = useState({});
  const [lastScores, setLastScores] = useState({});
  const [adaptiveScores, setAdaptiveScores] = useState({});
  const [useAdaptive, setUseAdaptive] = useState(false);
  const [useTimed, setUseTimed] = useState(false);

  const fetchExtras = useCallback(async () => {
    try {
      const [counts, scores] = await Promise.all([
        getQuestionCountsByCategory(),
        user?.id ? getLastScores(user.id) : Promise.resolve({}),
      ]);
      setQuestionCounts(counts);
      setLastScores(scores);

      if (user?.id) {
        const adaptiveResults = {};
        for (const cat of categories || []) {
          try {
            const rec = await getRecommendedDifficulty(user.id, cat.id);
            if (rec) adaptiveResults[cat.id] = rec;
          } catch { /* recommendation is optional */ }
        }
        setAdaptiveScores(adaptiveResults);
      }
    } catch {
      // silent — counts/scores are optional enhancements
    }
  }, [user?.id, categories]);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  const handleSelectCategory = (id) => {
    if (selectedCategory === id) {
      setSelectedCategory(null);
      setSelectedDifficulty('');
    } else {
      setSelectedCategory(id);
      setSelectedDifficulty('');
    }
  };

  const handleStart = () => {
    if (!selectedCategory) {
      toast.error('Pilih kategori');
      return;
    }
    const params = [];
    const targetDifficulty = useAdaptive && adaptiveScores[selectedCategory]
      ? adaptiveScores[selectedCategory]
      : selectedDifficulty || 'easy';
    const available = questionCounts[`${selectedCategory}:${targetDifficulty}`];
    if (available !== undefined && available < 20) {
      toast.error(`Bank soal ${DIFFICULTY_LABEL[targetDifficulty]} belum memiliki 20 soal terpublikasi.`);
      return;
    }
    if (useAdaptive && adaptiveScores[selectedCategory]) {
      params.push(`difficulty=${adaptiveScores[selectedCategory]}`, 'adaptive=true');
    } else if (useTimed) {
      params.push(`difficulty=${selectedDifficulty || 'easy'}`, 'timed=true');
    } else {
      if (!selectedDifficulty) {
        toast.error('Pilih tingkat kesulitan');
        return;
      }
      params.push(`difficulty=${selectedDifficulty}`);
    }
    navigate(`/practice/${selectedCategory}?${params.join('&')}`);
  };

  const filtered = search
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  if (error) return <ErrorState message={error} />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Latihan Soal
          </h1>
          <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            Pilih kategori dan tingkat kesulitan untuk memulai.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 dark:focus:ring-primary-800/30 transition-all duration-200"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setUseAdaptive(!useAdaptive)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              useAdaptive
                ? 'bg-cta-500 text-white shadow-clay'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <MagicWand className="w-4 h-4" />
            Adaptive
          </button>
          <button
            onClick={() => { setUseTimed(!useTimed); if (!useTimed) setUseAdaptive(false); }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              useTimed
                ? 'bg-amber-500 text-white shadow-clay'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Timer className="w-4 h-4" />
            Timed (5 menit)
          </button>
          <button
            onClick={() => { setUseAdaptive(false); setUseTimed(false); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Normal
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Kategori Tidak Ditemukan"
          description={`Tidak ada kategori dengan nama "${search}"`}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch('')}>
                Hapus Pencarian
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cat, idx) => {
            const Icon = iconMap[cat.icon] || BookOpen;
            const isSelected = selectedCategory === cat.id;

            const scoreKey = (d) => `${cat.id}:${d}`;
            const targetDifficulty = useAdaptive ? adaptiveScores[cat.id] : selectedDifficulty;
            const targetCount = targetDifficulty ? questionCounts[scoreKey(targetDifficulty)] : undefined;
            const poolReady = targetCount === undefined || targetCount >= 20;
            return (
              <Card
                key={cat.id}
                className={`
                  cursor-pointer select-none
                  transition-all duration-300 ease-spring
                  hover:-translate-y-0.5
                  ${isSelected ? 'ring-2 ring-primary-400/70' : 'ring-1 ring-black/[0.03] dark:ring-white/[0.05]'}
                `.trim()}
                style={{ transitionDelay: `${idx * 40}ms` }}
                hover={false}
              >
                <div onClick={() => handleSelectCategory(cat.id)}>
                  <CardContent className="flex items-center gap-3.5 py-[18px]">
                    <div className={`
                      w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                      transition-all duration-300 ease-spring
                      ${isSelected
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 scale-110'
                        : 'bg-primary-50/50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500'
                      }
                    `.trim()}>
                      <Icon className="w-5.5 h-5.5" weight={isSelected ? 'fill' : 'regular'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[0.9375rem] text-gray-900 dark:text-gray-100 break-words leading-snug">
                        {cat.name}
                      </p>
                      <p className="text-[0.8125rem] text-gray-400 dark:text-gray-500 leading-snug line-clamp-2">
                        {cat.description}
                      </p>
                      {/* Last score per category - any difficulty */}
                      {(() => {
                        const scores = difficulties
                          .map((d) => lastScores[scoreKey(d)])
                          .filter(Boolean);
                        if (scores.length === 0) return null;
                        const best = Math.max(...scores.map((s) => s.score));
                        return (
                          <span className="inline-flex items-center gap-1 mt-1 text-[0.6875rem] text-amber-600 dark:text-amber-400">
                            <Star className="w-3 h-3" weight="fill" />
                            Nilai terbaik: {Math.round(best)}
                          </span>
                        );
                      })()}
                      {useAdaptive && adaptiveScores[cat.id] && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[0.6875rem] text-cta-600 dark:text-cta-400">
                          <MagicWand className="w-3 h-3" weight="fill" />
                          Rekomendasi: {DIFFICULTY_LABEL[adaptiveScores[cat.id]]}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-spring ${
                    isSelected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden min-h-0">
                    <div className="border-t border-black/[0.04] dark:border-white/[0.06] mx-5 sm:mx-6" />
                    <div className="px-5 sm:px-6 py-4 space-y-4">
                      {!useAdaptive && (
                        <div className="flex flex-wrap gap-2">
                          {difficulties.map((d) => {
                            const DiffIcon = difficultyMeta[d].icon;
                            const isActive = selectedDifficulty === d;
                            const count = questionCounts[scoreKey(d)];
                            return (
                              <button
                                key={d}
                                onClick={(e) => { e.stopPropagation(); setSelectedDifficulty(d); }}
                                className={`
                                  inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
                                  transition-all duration-300 ease-spring
                                  active:scale-[0.97]
                                  ${isActive
                                    ? 'bg-primary-500 text-white shadow-clay-lg scale-[1.02]'
                                    : 'bg-primary-50/60 dark:bg-gray-700/40 text-gray-600 dark:text-gray-300 hover:bg-primary-100/60 dark:hover:bg-gray-600/40 hover:text-gray-800 dark:hover:text-gray-100'
                                  }
                                `.trim()}
                              >
                                <DiffIcon className="w-4 h-4" weight={isActive ? 'fill' : 'regular'} />
                                {DIFFICULTY_LABEL[d]}
                                {count !== undefined && (
                                  <span className="text-[0.6875rem] opacity-60">{count} soal</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {useAdaptive && adaptiveScores[selectedCategory] && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-cta-50 dark:bg-cta-900/20 text-cta-700 dark:text-cta-300 text-sm">
                          <MagicWand className="w-4 h-4" weight="fill" />
                          <span>
                            Kesulitan rekomendasi: <strong>{DIFFICULTY_LABEL[adaptiveScores[selectedCategory]]}</strong>
                          </span>
                        </div>
                      )}
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleStart(); }}
                        disabled={(!useAdaptive && !selectedDifficulty) || !poolReady}
                        size="sm"
                        className="gap-2"
                      >
                        Mulai Kerjakan
                        <CaretRight className="w-4 h-4" weight="bold" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
