import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { supabase } from '../services/supabase';
import Skeleton from '../components/common/Skeleton';

export default function QuizResult() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;

  const [data, setData] = useState(result || null);
  const [loading, setLoading] = useState(!result);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    if (data) return;
    (async () => {
      try {
        const { data: attempt } = await supabase
          .from('quiz_attempts')
          .select('*, quiz_answers(*, questions(*))')
          .eq('id', attemptId)
          .single();
        if (attempt) {
          setData({
            score: attempt.score,
            correct: attempt.correct_answers,
            total: attempt.total_questions,
          });
          setAnswers(attempt.quiz_answers.filter((a) => a.questions).map((a) => ({
            question: a.questions.question,
            userAnswer: a.user_answer,
            correctAnswer: a.questions.correct_answer,
            explanation: a.questions.explanation,
            isCorrect: a.is_correct,
          })));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId, data]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Hasil tidak ditemukan</h2>
        <Button onClick={() => navigate('/practice')}>Kembali ke Latihan</Button>
      </div>
    );
  }

  const grade = data.score >= 80 ? 'bg-green-500' : data.score >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardContent className="text-center py-8">
          <div className={`w-24 h-24 rounded-full ${grade} flex items-center justify-center mx-auto mb-4`}>
            <span className="text-3xl font-bold text-white">{Math.round(data.score)}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {data.score >= 80 ? 'Luar Biasa!' : data.score >= 50 ? 'Cukup Baik' : 'Ayo Semangat!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {data.correct} dari {data.total} soal benar
          </p>
        </CardContent>
      </Card>

      {answers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Pembahasan</h2>
          {answers.map((a, i) => (
            <Card key={i}>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  {a.isCorrect
                    ? <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  }
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      {i + 1}. {a.question}
                    </p>
                    <div className="mt-2 text-sm space-y-1">
                      <p className={a.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        Jawabanmu: {a.userAnswer}
                      </p>
                      {!a.isCorrect && (
                        <p className="text-green-600">Jawaban benar: {a.correctAnswer}</p>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {a.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={() => navigate('/practice')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Latihan Lagi
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          <Home className="w-4 h-4 mr-1" /> Dashboard
        </Button>
      </div>
    </div>
  );
}
