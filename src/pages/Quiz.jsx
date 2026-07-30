import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock, GridFour,
  Bookmark, ArrowsOut, ArrowsIn, Circle,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { useQuestions } from '../hooks/useQuestions';
import { useQuiz } from '../hooks/useQuiz';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/feedback/ErrorState';
import { handleError } from '../utils/errors';
import EmptyState from '../components/feedback/EmptyState';
import toast from 'react-hot-toast';

const STORAGE_KEY = (catId, diff, isAdaptive) => `quiz_progress_${catId}_${diff}${isAdaptive ? '_adaptive' : ''}`;

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const isAdaptive = searchParams.get('adaptive') === 'true';
  const navigate = useNavigate();
  const location = useLocation();

  const retryQuestions = location.state?.retryQuestions;
  const retryMeta = location.state?.retryMeta; // { categoryId, difficulty } for retry submission
  const effectiveCategoryId = retryQuestions ? retryMeta?.categoryId : categoryId;
  const effectiveDifficulty = retryQuestions ? retryMeta?.difficulty : difficulty;
  const { questions: fetchedQuestions, loading, error } = useQuestions(
    retryQuestions ? null : categoryId,
    retryQuestions ? null : difficulty,
  );
  const questions = retryQuestions || fetchedQuestions;
  const { submitQuiz, submitting } = useQuiz();
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef(null);
  const quizStartRef = useRef(Date.now());

  // Restore saved progress on mount (skip for retry mode)
  useEffect(() => {
    if (retryQuestions || !categoryId || !difficulty) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY(categoryId, difficulty, isAdaptive));
      if (saved) {
        const { answers: savedAnswers, bookmarked: savedBookmarked } = JSON.parse(saved);
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
          setAnswers(savedAnswers);
        }
        if (savedBookmarked) setBookmarked(savedBookmarked);
      }
    } catch { /* ignore corrupt storage */ }
  }, [categoryId, difficulty, isAdaptive, retryQuestions]);

  // Auto-save answers + bookmarked to localStorage (skip for retry mode)
  useEffect(() => {
    if (retryQuestions || !categoryId || !difficulty || questions.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY(categoryId, difficulty, isAdaptive),
        JSON.stringify({ answers, bookmarked }),
      );
    } catch { /* storage full — silent */ }
  }, [answers, bookmarked, categoryId, difficulty, isAdaptive, questions.length, retryQuestions]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - quizStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;
  const isAnswered = current ? !!answers[current.id] : false;
  const isCorrect = current && isAnswered ? answers[current.id] === current.correct_answer : false;

  // ponytail: handle both [{...}] and {options:[{...}]} formats
  const rawOptions = current?.options
    ? (Array.isArray(current.options) ? current.options : current.options.options)
    : null;

  // Shuffle options once per question (stable keyed on question id)
  const shuffledOptions = useMemo(() => {
    if (!rawOptions) return null;
    return shuffle(rawOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const options = shuffledOptions || rawOptions;

  const handleAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const toggleBookmark = useCallback(() => {
    if (!current) return;
    setBookmarked((prev) => ({ ...prev, [current.id]: !prev[current.id] }));
  }, [current]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* fullscreen not supported */ }
  };

  const goToQuestion = useCallback((idx) => {
    setCurrentIndex(idx);
    setShowNavigator(false);
  }, []);

  const handleNext = useCallback(() => {
    if (!answers[current?.id]) {
      toast.error('Jawab dulu soalnya');
      return;
    }
    if (isLast) {
      setShowReview(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [answers, current, isLast]);

  const handlePrev = useCallback(() => {
    if (isFirst) return;
    setCurrentIndex((i) => i - 1);
  }, [isFirst]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const q = questions[currentIndex];
      if (!q) return;

      if (q.type === 'multiple_choice' && q.options) {
        const opts = Array.isArray(q.options) ? q.options : q.options.options;
        const num = parseInt(e.key);
        if (num >= 1 && num <= opts.length) {
          e.preventDefault();
          handleAnswer(q.id, opts[num - 1].label);
          return;
        }
      }

      if (e.key === 'Enter' && answers[q.id]) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, questions, answers, handleAnswer, handleNext]);

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Masih ada ${unanswered.length} soal belum dijawab`);
      setConfirmSubmit(false);
      return;
    }
    stopTimer();
    try {
      if (!retryQuestions) localStorage.removeItem(STORAGE_KEY(categoryId, difficulty, isAdaptive));
      const result = await submitQuiz({
        categoryId: effectiveCategoryId || categoryId,
        difficulty: effectiveDifficulty || difficulty,
        questions,
        answers,
      });
      if (!result?.attemptId) throw new Error('Gagal mendapatkan hasil');
      navigate(`/practice/${result.attemptId}/result`, {
        state: {
          ...result,
          categoryId: effectiveCategoryId || categoryId,
          difficulty: effectiveDifficulty || difficulty,
          isAdaptive,
        },
      });
    } catch (err) {
      handleError(err, 'Gagal mengirim jawaban');
    } finally {
      setConfirmSubmit(false);
    }
  };

  if (!difficulty && !retryQuestions) return <Navigate to="/practice" replace />;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Skeleton className="h-2 rounded-full w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  if (questions.length === 0 || !current) {
    return (
      <EmptyState
        title="Tidak Ada Soal"
        description="Belum ada soal untuk kategori dan tingkat kesulitan ini."
        action={
          <Button variant="outline" onClick={() => navigate('/practice')}>
            Pilih Latihan Lain
          </Button>
        }
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header: Progress + Timer + Navigator + Fullscreen */}
      <div className="space-y-2">
        <div className="relative w-full h-2.5 bg-primary-100/60 dark:bg-gray-700/50 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary-500 rounded-full transition-all duration-500 ease-spring"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-2">
            <span className="text-gray-400 dark:text-gray-500 font-medium tabular-nums">
              Soal {currentIndex + 1}
              <span className="text-gray-300 dark:text-gray-600"> dari {questions.length}</span>
            </span>
            {isAdaptive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-semibold uppercase tracking-wider bg-cta-100 dark:bg-cta-900/30 text-cta-700 dark:text-cta-300">
                Adaptive
              </span>
            )}
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500 tabular-nums">
              <Clock className="w-3.5 h-3.5" weight="regular" />
              {formatTimer(elapsed)}
            </span>
            <span className="text-gray-400 dark:text-gray-500 tabular-nums">
              {answeredCount}/{questions.length}
            </span>
            <button
              onClick={toggleFullscreen}
              className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              aria-label={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
            >
              {isFullscreen ? <ArrowsIn className="w-4 h-4" /> : <ArrowsOut className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowNavigator((v) => !v)}
              className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              aria-label="Daftar Soal"
            >
              <GridFour className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigator Grid */}
      <div
        className={`
          grid transition-all duration-300 ease-spring overflow-hidden
          ${showNavigator ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}
        `.trim()}
      >
        <div className="overflow-hidden min-h-0">
          <Card hover={false}>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAns = !!answers[q.id];
                  const isBm = !!bookmarked[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`
                        relative w-9 h-9 rounded-lg text-sm font-medium
                        transition-all duration-200 ease-spring
                        ${isCurrent
                          ? 'bg-primary-500 text-white shadow-clay scale-110 ring-2 ring-primary-300'
                          : isAns
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `.trim()}
                      aria-label={`Lompat ke soal ${idx + 1}`}
                    >
                      {idx + 1}
                      {isBm && (
                        <Bookmark className="absolute -top-1 -right-1 w-3 h-3 text-amber-500" weight="fill" />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[0.75rem] text-gray-400 dark:text-gray-500">
                <span className="inline-block w-3 h-3 rounded bg-primary-500 align-middle mr-1" /> Sekarang &middot;
                <span className="inline-block w-3 h-3 rounded bg-primary-100 dark:bg-primary-900/30 align-middle mx-1" /> Terjawab &middot;
                <span className="inline-block w-3 h-3 rounded bg-gray-100 dark:bg-gray-700 align-middle mx-1" /> Belum
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Before Submit */}
      {showReview ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Review Jawaban
            </h2>
            <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
              {answeredCount}/{questions.length} terjawab
            </span>
          </div>

          <Card hover={false}>
            <CardContent className="py-4 max-h-96 overflow-y-auto space-y-1">
              {questions.map((q, idx) => {
                const hasAns = !!answers[q.id];
                const isBm = !!bookmarked[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIndex(idx); setShowReview(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {idx + 1}
                    </span>
                    <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
                      {q.question}
                    </span>
                    {hasAns ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-green-500" weight="fill" />
                    ) : (
                      <Circle className="w-4 h-4 shrink-0 text-gray-300 dark:text-gray-600" />
                    )}
                    {isBm && (
                      <Bookmark className="w-3 h-3 shrink-0 text-amber-500" weight="fill" />
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setShowReview(false)} size="sm">
              Kembali
            </Button>
            <Button onClick={() => setConfirmSubmit(true)} size="sm">
              Kumpulkan <CheckCircle className="w-4 h-4 ml-1" weight="fill" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Question Card */}
          <div className="transition-all duration-400 ease-spring" key={current.id}>
            <Card hover={false}>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6875rem] uppercase tracking-[0.08em] font-semibold text-primary-400 dark:text-primary-300">
                      {current.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Isian'}
                    </span>
                    <button
                      onClick={toggleBookmark}
                      className={`p-1 rounded-lg transition-all ${bookmarked[current.id] ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500'}`}
                      aria-label={bookmarked[current.id] ? 'Hapus tanda' : 'Tandai soal'}
                    >
                      <Bookmark className="w-4 h-4" weight={bookmarked[current.id] ? 'fill' : 'regular'} />
                    </button>
                  </div>
                  <span className="text-[0.6875rem] text-gray-300 dark:text-gray-600 tabular-nums">
                    {currentIndex + 1}/{questions.length}
                  </span>
                </div>

                <p className="text-[1.0625rem] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                  {current.question}
                </p>

                {isAnswered && (
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}>
                    {isCorrect
                      ? <><CheckCircle className="w-4 h-4" weight="fill" /> Jawabanmu benar!</>
                      : <><XCircle className="w-4 h-4" weight="fill" /> Jawabanmu salah. Jawaban benar: <span className="font-bold">{current.correct_answer}</span></>
                    }
                  </div>
                )}

                {current.type === 'multiple_choice' && options ? (
                  <div className="space-y-2.5">
                    {options.map((opt) => {
                      const isSelected = answers[current.id] === opt.label;
                      const isCorrectAnswer = opt.label === current.correct_answer;
                      const isWrongSelection = isSelected && !isCorrect;

                      let borderClass = 'ring-1 ring-black/[0.06] dark:ring-white/[0.08] bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300';
                      let labelClass = 'bg-primary-100/50 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
                      if (isAnswered && isCorrectAnswer) {
                        borderClass = 'ring-2 ring-green-400/60 bg-green-50/80 dark:bg-green-900/20 text-green-800 dark:text-green-200';
                        labelClass = 'bg-green-500 text-white';
                      } else if (isWrongSelection) {
                        borderClass = 'ring-2 ring-red-400/60 bg-red-50/80 dark:bg-red-900/20 text-red-800 dark:text-red-200';
                        labelClass = 'bg-red-500 text-white';
                      } else if (isSelected) {
                        borderClass = 'ring-2 ring-primary-400/60 bg-primary-500/8 text-primary-800 dark:text-primary-200 shadow-clay';
                        labelClass = 'bg-primary-500 text-white scale-110';
                      }

                      return (
                        <button
                          key={opt.label}
                          onClick={() => !isAnswered && handleAnswer(current.id, opt.label)}
                          disabled={isAnswered}
                          className={`
                            w-full text-left px-4 py-3.5 rounded-xl text-[0.9375rem]
                            transition-all duration-300 ease-spring
                            active:scale-[0.99] ${borderClass}
                            ${isAnswered ? 'cursor-default' : 'hover:ring-primary-300/40 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'}
                          `.trim()}
                        >
                          <span className="inline-flex items-center gap-3">
                            <span className={`
                              w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
                              transition-all duration-300 ease-spring ${labelClass}
                            `.trim()}>
                              {opt.label}
                            </span>
                            <span className={isSelected ? 'font-medium' : ''}>
                              {opt.text}
                            </span>
                            {isAnswered && isCorrectAnswer && (
                              <CheckCircle className="w-4 h-4 ml-auto shrink-0 text-green-600 dark:text-green-400" weight="fill" />
                            )}
                            {isWrongSelection && (
                              <XCircle className="w-4 h-4 ml-auto shrink-0 text-red-500 dark:text-red-400" weight="fill" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    {isAnswered ? (
                      <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border ${
                        isCorrect
                          ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                          : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                      }`}>
                        {isCorrect
                          ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0 text-green-600" weight="fill" />
                          : <XCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" weight="fill" />
                        }
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{answers[current.id]}</p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              Jawaban benar: <span className="font-bold">{current.correct_answer}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Tulis jawabanmu..."
                          value={answers[current.id] || ''}
                          onChange={(e) => handleAnswer(current.id, e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 dark:focus:ring-primary-800/30 transition-all duration-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && answers[current.id]) {
                              handleNext();
                            }
                          }}
                        />
                        <p className="mt-1.5 text-[0.8125rem] text-gray-400 dark:text-gray-500">
                          Tekan Enter untuk lanjut
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={handlePrev} disabled={isFirst} size="sm">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
                  </Button>

                  <Button onClick={handleNext} loading={submitting && isLast} size="sm">
                    {isLast ? (
                      <>Selesai <CheckCircle className="w-4 h-4 ml-1" weight="fill" /></>
                    ) : (
                      <>Selanjutnya <ArrowRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Confirm Submit Overlay */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm">
          <Card className="max-w-sm w-full mx-4">
            <CardContent className="text-center space-y-4 py-6">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-primary-600 dark:text-primary-300" weight="fill" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Selesai Mengerjakan?</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {answeredCount}/{questions.length} soal terjawab &middot; Waktu: {formatTimer(elapsed)}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setConfirmSubmit(false)}>
                  Lanjutkan
                </Button>
                <Button onClick={handleSubmit} loading={submitting}>
                  Ya, Kumpulkan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
