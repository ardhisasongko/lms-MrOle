import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useState, useRef, useMemo } from 'react';
import {
  CheckCircle, XCircle, ArrowLeft, ArrowRight, House, FileArrowDown,
  Trophy, TrendUp, Smiley, Clock,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { supabase } from '../services/supabase';
import { useAsync } from '../hooks/useAsync';
import Skeleton from '../components/common/Skeleton';
import { sanitize } from '../utils/sanitize';
import toast from 'react-hot-toast';

const gradeConfig = {
  excellent: { min: 80, label: 'Luar Biasa!', icon: Trophy },
  good: { min: 50, label: 'Cukup Baik', icon: TrendUp },
  tryAgain: { min: 0, label: 'Ayo Semangat!', icon: Smiley },
};

function getGrade(score) {
  if (score >= 80) return gradeConfig.excellent;
  if (score >= 50) return gradeConfig.good;
  return gradeConfig.tryAgain;
}

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'correct', label: 'Benar' },
  { key: 'wrong', label: 'Salah' },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s} detik`;
  return `${m} menit ${s} detik`;
}

export default function QuizResult() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;

  const [data, setData] = useState(result || null);
  const [answers, setAnswers] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
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
        startedAt: attempt.started_at || attempt.created_at,
        completedAt: attempt.completed_at,
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

  const filteredAnswers = useMemo(() => {
    if (filter === 'correct') return answers.filter((a) => a.isCorrect);
    if (filter === 'wrong') return answers.filter((a) => !a.isCorrect);
    return answers;
  }, [answers, filter]);

  const current = filteredAnswers[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === filteredAnswers.length - 1;
  const timeSpent = data?.startedAt && data?.completedAt
    ? (new Date(data.completedAt) - new Date(data.startedAt)) / 1000
    : null;

  const goTo = (idx) => setCurrentIndex(idx);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-72 rounded-2xl" />
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
  const wrongCount = totalCount - correctCount;
  const correctPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5" ref={resultRef}>
      {/* Score Hero */}
      <Card>
        <CardContent className="text-center py-8 space-y-4">
          <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                className="text-gray-100 dark:text-gray-700" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                strokeDasharray={`${(data.score / 100) * 326.7} 326.7`} strokeLinecap="round"
                className="transition-all duration-1000 ease-spring"
                style={{ stroke: data.score >= 80 ? '#22C55E' : data.score >= 50 ? '#F59E0B' : '#EF4444' }}
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
              <span className="text-gray-300 dark:text-gray-600"> poin</span>
            </p>
          </div>

          {/* Stats mini bar */}
          <div className="max-w-xs mx-auto space-y-2">
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
              <div className="bg-green-500 transition-all duration-700 ease-spring"
                style={{ width: `${correctPct}%` }} />
              <div className="bg-red-400 transition-all duration-700 ease-spring"
                style={{ width: `${100 - correctPct}%` }} />
            </div>
            <div className="flex justify-between text-[0.75rem] text-gray-400 dark:text-gray-500">
              <span className="tabular-nums">{correctCount} benar</span>
              {timeSpent !== null && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatTime(timeSpent)}
                </span>
              )}
              <span className="tabular-nums">{wrongCount} salah</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      {answers.length > 0 && (
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100/60 dark:bg-gray-700/40">
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? answers.length
              : f.key === 'correct' ? correctCount
              : wrongCount;
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => { setFilter(f.key); setCurrentIndex(0); }}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 ease-spring
                  ${isActive
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }
                `.trim()}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Per-Question Pagination */}
      {filteredAnswers.length > 0 && current && (
        <div className="space-y-4">
          {/* Question header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
              Soal <span className="font-medium text-gray-700 dark:text-gray-300">{currentIndex + 1}</span>
              <span className="text-gray-300 dark:text-gray-600">/{filteredAnswers.length}</span>
            </span>
            <span className={`
              inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wide
              ${current.isCorrect
                ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                : 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20'
              }
            `.trim()}>
              {current.isCorrect ? <CheckCircle className="w-3 h-3" weight="fill" /> : <XCircle className="w-3 h-3" weight="fill" />}
              {current.isCorrect ? 'Benar' : 'Salah'}
            </span>
          </div>

          <Card key={`${filter}-${currentIndex}`}>
            <CardContent className="space-y-4">
              <p className="text-[1.0625rem] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                {sanitize(current.question)}
              </p>

              <div className="space-y-2">
                <div className={`
                  flex items-start gap-2 px-4 py-3 rounded-xl border text-sm
                  ${current.isCorrect
                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                  }
                `.trim()}>
                  {current.isCorrect
                    ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-400" weight="fill" />
                    : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500 dark:text-red-400" weight="fill" />
                  }
                  <div>
                    <span className="font-medium text-gray-500 dark:text-gray-400 text-[0.8125rem]">Jawabanmu</span>
                    <p className="text-gray-900 dark:text-gray-100">{current.userAnswer}</p>
                  </div>
                </div>

                {!current.isCorrect && current.correctAnswer && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 text-sm">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-400" weight="fill" />
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400 text-[0.8125rem]">Jawaban benar</span>
                      <p className="text-green-700 dark:text-green-300 font-medium">{current.correctAnswer}</p>
                    </div>
                  </div>
                )}
              </div>

              {current.explanation && (
                <div className="text-[0.8125rem] text-gray-500 dark:text-gray-400 bg-gray-50/70 dark:bg-gray-800/50 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700/50 leading-relaxed">
                  <span className="font-medium text-gray-600 dark:text-gray-300 block mb-0.5">Penjelasan</span>
                  {current.explanation}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex - 1)} disabled={isFirst}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Sebelumnya
            </Button>

            {filteredAnswers.length > 1 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {filteredAnswers.slice(0, Math.min(filteredAnswers.length, 12)).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    className={`
                      w-2.5 h-2.5 rounded-full transition-all duration-300 ease-spring
                      ${idx === currentIndex
                        ? 'bg-primary-500 scale-125'
                        : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }
                    `.trim()}
                    aria-label={`Soal ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex + 1)} disabled={isLast}>
              Selanjutnya <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty filter state */}
      {filteredAnswers.length === 0 && answers.length > 0 && (
        <div className="text-center py-10 space-y-2">
          <Smiley className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {filter === 'wrong' ? 'Semua jawaban benar! Kerja bagus.' : 'Tidak ada hasil untuk filter ini.'}
          </p>
        </div>
      )}

      {/* Actions */}
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
