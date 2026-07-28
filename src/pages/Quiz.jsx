import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, DotsThree } from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { useQuestions } from '../hooks/useQuestions';
import { useQuiz } from '../hooks/useQuiz';
import Skeleton from '../components/common/Skeleton';
import ErrorState from '../components/feedback/ErrorState';
import EmptyState from '../components/feedback/EmptyState';
import toast from 'react-hot-toast';

export default function Quiz() {
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const difficulty = searchParams.get('difficulty');
  const navigate = useNavigate();

  const { questions, loading, error } = useQuestions(categoryId, difficulty);
  const { submitQuiz, submitting } = useQuiz();
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

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
  };

  const handleNext = () => {
    if (!answers[current?.id]) {
      toast.error('Jawab dulu soalnya');
      return;
    }
    if (isLast) {
      handleSubmit();
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
      return;
    }
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
          <span className="text-gray-400 dark:text-gray-500 tabular-nums">
            {answeredCount}/{questions.length} terjawab
          </span>
        </div>
      </div>

      <div
        className="transition-all duration-400 ease-spring"
        key={current.id}
      >
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
                {options.map((opt) => {
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
                        <span className={isSelected ? 'font-medium' : ''}>{opt.text}</span>
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

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={isFirst}
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
              </Button>

              {questions.length > 1 && questions.length <= 12 && (
                <div className="hidden sm:flex items-center gap-1.5">
                  {questions.slice(0, 9).map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(idx)}
                      className={`
                        w-2.5 h-2.5 rounded-full transition-all duration-300 ease-spring
                        ${idx === currentIndex
                          ? 'bg-primary-500 scale-125'
                          : answers[q.id]
                            ? 'bg-primary-300 dark:bg-primary-600'
                            : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }
                      `.trim()}
                      aria-label={`Soal ${idx + 1}`}
                    />
                  ))}
                  {questions.length > 9 && (
                    <span className="text-gray-300 dark:text-gray-600 ml-0.5">
                      <DotsThree className="w-4 h-4" />
                    </span>
                  )}
                </div>
              )}

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
    </div>
  );
}
