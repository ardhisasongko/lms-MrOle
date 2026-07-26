import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle, XCircle, ArrowLeft, House, FileArrowDown } from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { supabase } from '../services/supabase';
import Skeleton from '../components/common/Skeleton';
import { sanitize } from '../utils/sanitize';
import toast from 'react-hot-toast';

export default function QuizResult() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;

  const [data, setData] = useState(result || null);
  const [loading, setLoading] = useState(!result);
  const [answers, setAnswers] = useState([]);
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef(null);

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
        backgroundColor: '#ffffff',
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
        toast.error('Gagal memuat hasil quiz.');
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
    <div className="max-w-2xl mx-auto space-y-6" ref={resultRef}>
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
                      {i + 1}. {sanitize(a.question)}
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

      <div className="flex gap-3 justify-center flex-wrap">
        <Button variant="outline" onClick={() => navigate('/practice')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Latihan Lagi
        </Button>
        <Button variant="secondary" onClick={handleExportPDF} loading={exporting}>
          <FileArrowDown className="w-4 h-4 mr-1" /> Download PDF
        </Button>
        <Button onClick={() => navigate('/dashboard')}>
          <House className="w-4 h-4 mr-1" /> Dashboard
        </Button>
      </div>
    </div>
  );
}
