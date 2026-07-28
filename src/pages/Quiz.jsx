import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, Clock, GridFour,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { useQuestions } from '../hooks/useQuestions';
import { useQuiz } from '../hooks/useQuiz';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/feedback/ErrorState';
import EmptyState from '../components/feedback/EmptyState';
import toast from 'react-hot-toast';

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function Quiz() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const navigate = useNavigate();

  const { questions, loading, error } = useQuestions(categoryId, difficulty);
  const { submitQuiz, submitting } = useQuiz();
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showNavigator, setShowNavigator] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const timerRef = useRef(null);
  const quizStartRef = useRef(Date.now());

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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT') return;
      const q = questions[currentIndex];
      if (!q) return;

      // 1/2/3/4 for multiple choice
      if (q.type === 'multiple_choice' && q.options) {
        const opts = Array.isArray(q.options) ? q.options : q.options.options;
        const num = parseInt(e.key);
        if (num >= 1 && num <= opts.length) {
          e.preventDefault();
          handleAnswer(q.id, opts[num - 1].label);
          return;
        }
      }

      // Enter to continue (if answer exists)
      if (e.key === 'Enter' && answers[q.id]) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, questions, answers]);

  if (!difficulty) return <Navigate to="/practice" replace />;

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  // ponytail: handle both [{...}] and {options:[{...}]} formats from DB
  const options = current?.options
    ? (Array.isArray(current.options) ? current.options : current.options.options)
    : null;

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goToQuestion = (idx) => {
    setCurrentIndex(idx);
    setShowNavigator(false);
  };

  const handleNext = () => {
    if (!answers[current?.id]) {
      toast.error('Jawab dulu soalnya');
      return;
    }
    if (isLast) {
      setConfirmSubmit(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (isFirst) return;
    setCurrentIndex((i) => i - 1);
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Masih ada ${unanswered.length} soal belum dijawab`);
      setConfirmSubmit(false);
      return;
    }
    stopTimer();
    try {
      const result = await submitQuiz({
        categoryId,
        difficulty,
        questions,
        answers,
      });
      navigate(`/practice/${result.attemptId}/result`, { state: result });
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim jawaban');
    } finally {
      setConfirmSubmit(false);
    }
  };

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
      {/* Header: Progress + Timer + Navigator */}
      <div className="space-y-2">
        <div className="relative w-full h-2.5 bg-primary-100/60 dark:bg-gray-700/50 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary-500 rounded-full transition-all duration-500 ease-spring"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400 dark:text-gray-500 font-medium tabular-nums">
            Soal {currentIndex + 1}
            <span className="text-gray-300 dark:text-gray-600"> dari {questions.length}</span>
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
                  const isAnswered = !!answers[q.id];
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`
                        w-9 h-9 rounded-lg text-sm font-medium
                        transition-all duration-200 ease-spring
                        ${isCurrent
                          ? 'bg-primary-500 text-white shadow-clay scale-110 ring-2 ring-primary-300'
                          : isAnswered
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `.trim()}
                      aria-label={`Lompat ke soal ${idx + 1}`}
                    >
                      {idx + 1}
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

      {/* Question Card */}
      <div className="transition-all duration-400 ease-spring" key={current.id}>
        <Card hover={false}>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[0.6875rem] uppercase tracking-[0.08em] font-semibold text-primary-400 dark:text-primary-300">
                {current.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Isian'}
              </span>
              <span className="text-[0.6875rem] text-gray-300 dark:text-gray-600 tabular-nums">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>

            <p className="text-[1.0625rem] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
              {current.question}
            </p>

            {current.type === 'multiple_choice' && options ? (
              <div className="space-y-2.5">
                {options.map((opt, oi) => {
                  const isSelected = answers[current.id] === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleAnswer(current.id, opt.label)}
                      className={`
                        w-full text-left px-4 py-3.5 rounded-xl text-[0.9375rem]
                        transition-all duration-300 ease-spring
                        active:scale-[0.99]
                        ${isSelected
                          ? 'bg-primary-500/8 text-primary-800 dark:text-primary-200 ring-2 ring-primary-400/60 shadow-clay'
                          : 'bg-white dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 ring-1 ring-black/[0.06] dark:ring-white/[0.08] hover:ring-primary-300/40 hover:bg-primary-50/30 dark:hover:bg-primary-900/10'
                        }
                      `.trim()}
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className={`
                          w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold
                          transition-all duration-300 ease-spring
                          ${isSelected
                            ? 'bg-primary-500 text-white scale-110'
                            : 'bg-primary-100/50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          }
                        `.trim()}>
                          {opt.label}
                        </span>
                        <span className={isSelected ? 'font-medium' : ''}>
                          {opt.text}
                        </span>
                      </span>
                      {oi < 9 && (
                        <span className="ml-2 text-[0.6875rem] text-gray-300 dark:text-gray-600 italic">
                          ({oi + 1})
                        </span>
                      )}
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
