import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, Clock, GridFour,
  Bookmark, ArrowsOut, ArrowsIn, Circle, Timer,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { useQuiz } from '../hooks/useQuiz';
import { useBookmarks } from '../hooks/useBookmarks';
import Stimulus from '../components/quiz/Stimulus';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/feedback/ErrorState';
import { handleError } from '../utils/errors';
import EmptyState from '../components/feedback/EmptyState';
import toast from 'react-hot-toast';

import { saveDailyProgress } from '../services/gamification';

const STORAGE_KEY = (sessionId) => `mr_ole_quiz_session_v2:${sessionId}`;
const EMPTY_QUESTIONS = [];

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function Quiz() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const isAdaptive = searchParams.get('adaptive') === 'true';
  const navigate = useNavigate();
  const location = useLocation();

  const sourceAttemptId = location.state?.sourceAttemptId || searchParams.get('source') || null;
  const retryMeta = location.state?.retryMeta;
  const timedMode = searchParams.get('timed') === 'true';
  const challengeToken = searchParams.get('challenge');
  const requestedMode = sourceAttemptId
    ? 'retry'
    : challengeToken
      ? 'challenge'
      : timedMode
        ? 'timed'
        : isAdaptive
          ? 'adaptive'
          : 'normal';
  const { startSession, saveAnswer, submitSession, starting, submitting } = useQuiz();
  const { bookmarks: persistedBookmarks, toggleBookmark: persistBookmark } = useBookmarks();
  const [session, setSession] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [requestKey, setRequestKey] = useState(0);
  const questions = session?.questions ?? EMPTY_QUESTIONS;
  const [timeLeft, setTimeLeft] = useState(null);
  const [answers, setAnswers] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef(null);
  const submitRef = useRef(null);
  const submittingRef = useRef(false);
  const saveTimersRef = useRef(new Map());
  const submitRetryRef = useRef(null);

  // The RPC is idempotent for an active matching session, which also makes
  // React StrictMode and page refreshes safe.
  useEffect(() => {
    if (!sourceAttemptId && !challengeToken && (!categoryId || !difficulty)) return undefined;
    let cancelled = false;
    setSessionError('');
    startSession({
      categoryId: sourceAttemptId ? retryMeta?.categoryId || null : categoryId || null,
      difficulty: sourceAttemptId ? retryMeta?.difficulty || null : difficulty || null,
      mode: requestedMode,
      sourceAttemptId,
      challengeToken: challengeToken || null,
    }).then((nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      const validIds = new Set(nextSession.questions.map((question) => question.id));
      const serverAnswers = Object.fromEntries(nextSession.questions
        .filter((question) => question.userAnswer !== null && question.userAnswer !== undefined)
        .map((question) => [question.id, question.userAnswer]));
      let saved = {};
      try {
        saved = JSON.parse(localStorage.getItem(STORAGE_KEY(nextSession.sessionId)) || '{}');
      } catch {
        saved = {};
      }
      const savedAnswers = Object.fromEntries(Object.entries(saved.answers || {})
        .filter(([questionId]) => validIds.has(questionId)));
      setAnswers({ ...savedAnswers, ...serverAnswers });
      setBookmarked(Object.fromEntries(Object.entries(saved.bookmarked || {})
        .filter(([questionId]) => validIds.has(questionId))));
      setCurrentIndex(Math.min(Math.max(Number(saved.currentIndex) || 0, 0), nextSession.questions.length - 1));
    }).catch((error) => {
      if (!cancelled) setSessionError(error?.message || 'Sesi kuis belum dapat dimulai.');
    });
    return () => { cancelled = true; };
  }, [categoryId, challengeToken, difficulty, requestKey, requestedMode, retryMeta?.categoryId, retryMeta?.difficulty, sourceAttemptId, startSession]);

  // Keep only lightweight progress locally; the authoritative question and
  // option order remain in the server snapshot.
  useEffect(() => {
    if (!session?.sessionId || questions.length === 0) return;
    try {
      localStorage.setItem(
        STORAGE_KEY(session.sessionId),
        JSON.stringify({ version: 2, answers, bookmarked, currentIndex, savedAt: new Date().toISOString() }),
      );
    } catch { /* storage full or unavailable */ }
  }, [answers, bookmarked, currentIndex, questions.length, session?.sessionId]);

  useEffect(() => {
    if (!questions.length || !persistedBookmarks.length) return;
    const questionIds = new Set(questions.map((question) => question.id));
    setBookmarked((current) => ({
      ...current,
      ...Object.fromEntries(persistedBookmarks
        .filter((bookmark) => questionIds.has(bookmark.question_id))
        .map((bookmark) => [bookmark.question_id, true])),
    }));
  }, [persistedBookmarks, questions]);

  // Derive timing from server timestamps so refresh cannot reset timed mode.
  useEffect(() => {
    if (!session?.startedAt) return undefined;
    const tick = () => {
      const now = Date.now();
      setElapsed(Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000)));
      const remaining = Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - now) / 1000));
      setTimeLeft(remaining);
      if (session.mode === 'timed' && remaining === 0 && !submittingRef.current) submitRef.current?.(true);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [session?.expiresAt, session?.mode, session?.startedAt]);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleAnswer = useCallback((questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (!session?.sessionId || !value) return;
    clearTimeout(saveTimersRef.current.get(questionId));
    const timer = setTimeout(() => {
      saveAnswer({ sessionId: session.sessionId, questionId, userAnswer: value })
        .catch(() => toast.error('Jawaban tersimpan di perangkat dan akan dikirim saat pengumpulan.'));
      saveTimersRef.current.delete(questionId);
    }, 600);
    saveTimersRef.current.set(questionId, timer);
  }, [saveAnswer, session?.sessionId]);

  useEffect(() => () => {
    for (const timer of saveTimersRef.current.values()) clearTimeout(timer);
    saveTimersRef.current.clear();
    clearTimeout(submitRetryRef.current);
  }, []);

  const toggleBookmark = useCallback(async () => {
    const question = questions[currentIndex];
    if (!question) return;
    const previous = Boolean(bookmarked[question.id]);
    setBookmarked((current) => ({ ...current, [question.id]: !previous }));
    try {
      await persistBookmark(question.id);
    } catch {
      setBookmarked((current) => ({ ...current, [question.id]: previous }));
      toast.error('Bookmark belum dapat diperbarui.');
    }
  }, [bookmarked, currentIndex, persistBookmark, questions]);

  const goToQuestion = useCallback((idx) => {
    setCurrentIndex(idx);
    setShowNavigator(false);
  }, []);

  const handleNext = useCallback(() => {
    const q = questions[currentIndex];
    if (!answers[q?.id]) {
      toast.error('Jawab dulu soalnya');
      return;
    }
    if (currentIndex === questions.length - 1) {
      setShowReview(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [answers, questions, currentIndex]);

  const handlePrev = useCallback(() => {
    if (currentIndex === 0) return;
    setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleSubmit = useCallback(async (fromTimer = false) => {
    if (!session?.sessionId || submittingRef.current) return;
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (session.mode !== 'timed' && unanswered.length > 0) {
      toast.error(`Masih ada ${unanswered.length} soal belum dijawab`);
      setConfirmSubmit(false);
      return;
    }
    submittingRef.current = true;
    stopTimer();
    try {
      const result = await submitSession({
        sessionId: session.sessionId,
        answers: questions.map((question) => ({
          questionId: question.id,
          userAnswer: answers[question.id] || '',
        })),
      });
      if (session.mode !== 'retry' && !result.alreadySubmitted) {
        saveDailyProgress({ answered: questions.length, correct: result?.correct || 0 });
      }
      if (!result?.attemptId) throw new Error('Gagal mendapatkan hasil');
      localStorage.removeItem(STORAGE_KEY(session.sessionId));
      const resultQuery = challengeToken
        ? `?challenge=${encodeURIComponent(challengeToken)}`
        : '';
      navigate(`/practice/${result.attemptId}/result${resultQuery}`, {
        state: {
          ...result,
          categoryId: session.categoryId,
          difficulty: session.difficulty,
          isAdaptive,
          timed: session.mode === 'timed',
          durationSeconds: elapsed,
          challengeToken,
          sessionId: session.sessionId,
          mode: session.mode,
        },
      });
    } catch (err) {
      handleError(err, fromTimer ? 'Waktu habis, tetapi jawaban belum dapat dikirim' : 'Gagal mengirim jawaban');
      if (fromTimer && Date.now() <= new Date(session.expiresAt).getTime() + 25_000) {
        clearTimeout(submitRetryRef.current);
        submitRetryRef.current = setTimeout(() => submitRef.current?.(true), 2000);
      }
    } finally {
      submittingRef.current = false;
      setConfirmSubmit(false);
    }
  }, [answers, challengeToken, elapsed, isAdaptive, navigate, questions, session, stopTimer, submitSession]);

  // Keyboard shortcuts effect deps: add handleNext for stable closure
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

  const current = questions[currentIndex];
  const options = current?.options
    ? (Array.isArray(current.options) ? current.options : current.options.options)
    : null;

  if (!difficulty && !sourceAttemptId && !challengeToken) return <Navigate to="/practice" replace />;

  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* fullscreen not supported */ }
  };

  submitRef.current = handleSubmit;

  if (starting || (!session && !sessionError)) {
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

  if (sessionError) {
    return (
      <ErrorState
        title="Sesi Belum Dapat Dimulai"
        message={sessionError}
        onRetry={() => setRequestKey((key) => key + 1)}
      />
    );
  }

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
        <div className="flex justify-between items-center text-sm gap-3 flex-wrap gap-y-1.5">
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-gray-400 dark:text-gray-500 font-medium tabular-nums">
              Soal {currentIndex + 1}
              <span className="text-gray-300 dark:text-gray-600"> dari {questions.length}</span>
            </span>
            {isAdaptive && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] font-semibold uppercase tracking-wider bg-cta-100 dark:bg-cta-900/30 text-cta-700 dark:text-cta-300 shrink-0">
                Adaptive
              </span>
            )}
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center gap-1 tabular-nums ${
               timeLeft !== null && timeLeft <= 60
                ? 'text-red-500 dark:text-red-400 font-semibold'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {(session?.mode === 'timed' || (timeLeft !== null && timeLeft <= 300)) && timeLeft !== null ? (
                <><Timer className="w-3.5 h-3.5" weight="regular" />{formatTimer(timeLeft)}</>
              ) : (
                <><Clock className="w-3.5 h-3.5" weight="regular" />{formatTimer(elapsed)}</>
              )}
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
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {idx + 1}
                    </span>
                    <span className="flex-1 min-w-0 break-words text-gray-700 dark:text-gray-300">
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

                <Stimulus
                  content={current.stimulus}
                  type={current.contentMetadata?.stimulus_type}
                />

                <p className="text-[1.0625rem] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                  {current.question}
                </p>

                {current.type === 'multiple_choice' && options ? (
                  <div className="space-y-2.5">
                    {options.map((opt, optionIndex) => {
                      const isSelected = answers[current.id] === opt.label;
                      const displayLabel = String.fromCharCode(65 + optionIndex);

                      let borderClass = 'ring-1 ring-black/[0.06] dark:ring-white/[0.08] bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300';
                      let labelClass = 'bg-primary-100/50 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
                      if (isSelected) {
                        borderClass = 'ring-2 ring-primary-400/60 bg-primary-500/8 text-primary-800 dark:text-primary-200 shadow-clay';
                        labelClass = 'bg-primary-500 text-white scale-110';
                      }

                      return (
                        <button
                          key={opt.label}
                          onClick={() => handleAnswer(current.id, opt.label)}
                          className={`
                            w-full text-left px-4 py-3.5 rounded-xl text-[0.9375rem]
                            transition-all duration-300 ease-spring
                            active:scale-[0.99] ${borderClass}
                            hover:ring-primary-300/40 hover:bg-primary-50/30 dark:hover:bg-primary-900/10
                          `.trim()}
                        >
                          <span className="inline-flex items-center gap-3">
                            <span className={`
                              w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
                              transition-all duration-300 ease-spring ${labelClass}
                            `.trim()}>
                              {displayLabel}
                            </span>
                            <span className={isSelected ? 'font-medium' : ''}>
                              {opt.text}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
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
