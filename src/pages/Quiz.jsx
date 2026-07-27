import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle } from '@phosphor-icons/react';
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
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // ponytail: handle both [{...}] and {options:[{...}]} formats from DB
  const options = current?.options
    ? (Array.isArray(current.options) ? current.options : current.options.options)
    : null;

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
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
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-2 rounded-full" />
        <Skeleton className="h-64 rounded-xl" />
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Soal {currentIndex + 1} dari {questions.length}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <Card key={current.id}>
        <CardContent className="space-y-6">
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {current.question}
          </p>

          {current.type === 'multiple_choice' && options ? (
            <div className="space-y-3">
              {options.map((opt) => {
                const isSelected = answers[current.id] === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleAnswer(current.id, opt.label)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className="font-medium mr-2">{opt.label}.</span> {opt.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Tulis jawabanmu..."
              value={answers[current.id] || ''}
              onChange={(e) => handleAnswer(current.id, e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:ring-primary-500"
            />
          )}

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
            </Button>
            <Button onClick={handleNext} loading={submitting && isLast}>
              {isLast ? (
                <>Selesai <CheckCircle className="w-4 h-4 ml-1" /></>
              ) : (
                <>Selanjutnya <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
