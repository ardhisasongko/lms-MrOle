import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useRef } from 'react';
import { CheckCircle, XCircle, ArrowLeft, House, FileArrowDown, Trophy, TrendUp, Smiley } from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { supabase } from '../services/supabase';
import { useAsync } from '../hooks/useAsync';
import Skeleton from '../components/common/Skeleton';
import { sanitize } from '../utils/sanitize';
import toast from 'react-hot-toast';

const gradeConfig = {
  excellent: { min: 80, label: 'Luar Biasa!', icon: Trophy, bar: 'w-[85%]' },
  good: { min: 50, label: 'Cukup Baik', icon: TrendUp, bar: 'w-[55%]' },
  tryAgain: { min: 0, label: 'Ayo Semangat!', icon: Smiley, bar: 'w-[30%]' },
};

function getGrade(score) {
  if (score >= 80) return gradeConfig.excellent;
  if (score >= 50) return gradeConfig.good;
  return gradeConfig.tryAgain;
}

const scoreRingColor = (score) => {
  if (score >= 80) return 'from-green-400 to-emerald-600';
  if (score >= 50) return 'from-amber-400 to-orange-500';
  return 'from-rose-400 to-red-500';
};

const statusColor = (isCorrect) =>
  isCorrect
    ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';

export default function QuizResult() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;

  const [data, setData] = useState(result || null);
  const [answers, setAnswers] = useState([]);
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef(null);

  const { loading } = useAsync(async () => {
    if (data) return;
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
  }, [attemptId]);

  const handleExportPDF = async () => {
    if (!resultRef.current) return;
    setExporting(true);
    try {
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      let heightLeft = pageHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pageHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, pageHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`quiz-result-${Math.round(data.score)}.pdf`);
    } catch {
      toast.error('Gagal mengexport PDF. Coba lagi.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto">
          <Smiley className="w-7 h-7 text-primary-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hasil tidak ditemukan</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">Mungkin sesi latihan sudah kedaluwarsa</p>
        </div>
        <Button onClick={() => navigate('/practice')}>Kembali ke Latihan</Button>
      </div>
    );
  }

  const grade = getGrade(data.score);
  const GradeIcon = grade.icon;
  const correctCount = data.correct;
  const totalCount = data.total;

  return (
    <div className="max-w-2xl mx-auto space-y-6" ref={resultRef}>
      <Card>
        <CardContent className="text-center py-10 space-y-5">
          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-100 dark:text-gray-700"
              />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(data.score / 100) * 326.7} 326.7`}
                strokeLinecap="round"
                className={`bg-gradient-to-r ${scoreRingColor(data.score)} text-transparent transition-all duration-1000 ease-spring`}
                style={{
                  stroke: data.score >= 80 ? '#22C55E' : data.score >= 50 ? '#F59E0B' : '#EF4444',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <GradeIcon className="w-7 h-7 text-gray-400 dark:text-gray-500" weight="fill" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {grade.label}
            </h1>
            <p className="text-gray-400 dark:text-gray-500">
              <span className="text-[1.25rem] font-bold tabular-nums text-gray-700 dark:text-gray-300">
                {Math.round(data.score)}
              </span>
              <span className="text-gray-300 dark:text-gray-600"> poin </span>
              &middot;{' '}
              <span className="tabular-nums">{correctCount}</span>
              <span className="text-gray-300 dark:text-gray-600">/{totalCount} benar</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {answers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[1.0625rem] font-semibold text-gray-900 dark:text-gray-100">
              Pembahasan
            </h2>
            <span className="text-[0.8125rem] text-gray-400 dark:text-gray-500 tabular-nums">
              {answers.filter(a => a.isCorrect).length} benar
            </span>
          </div>
          {answers.map((a, i) => (
            <div
              key={i}
              className="transition-all duration-400 ease-spring"
              style={{ transitionDelay: `${i * 30}ms` }}
            >
              <Card>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5
                      transition-all duration-300
                      ${a.isCorrect
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                      }
                    `.trim()}>
                      {a.isCorrect
                        ? <CheckCircle className="w-4 h-4" weight="fill" />
                        : <XCircle className="w-4 h-4" weight="fill" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.9375rem] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                        {i + 1}. {sanitize(a.question)}
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className={`
                          inline-flex items-start gap-1.5 px-3 py-1.5 rounded-lg border text-sm
                          transition-all duration-200
                          ${statusColor(a.isCorrect)}
                        `.trim()}>
                          {a.isCorrect ? (
                            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" weight="fill" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" weight="fill" />
                          )}
                          <div>
                            <span className="font-medium">Jawabanmu: </span>
                            {a.userAnswer}
                          </div>
                        </div>
                        {!a.isCorrect && a.correctAnswer && (
                          <div className="inline-flex items-start gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-300 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" weight="fill" />
                            <div>
                              <span className="font-medium">Jawaban benar: </span>
                              {a.correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>
                      {a.explanation && (
                        <p className="mt-3 text-[0.8125rem] text-gray-500 dark:text-gray-400 bg-gray-50/70 dark:bg-gray-800/50 px-3.5 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700/50 leading-relaxed">
                          {a.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-center flex-wrap pt-2">
        <Button variant="outline" onClick={() => navigate('/practice')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Latihan Lagi
        </Button>
        <Button variant="ghost" onClick={handleExportPDF} loading={exporting}>
          <FileArrowDown className="w-4 h-4 mr-1" /> Download PDF
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          <House className="w-4 h-4 mr-1" /> Dashboard
        </Button>
      </div>
    </div>
  );
}
