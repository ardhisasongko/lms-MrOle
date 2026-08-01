import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, useRef, useMemo, useEffect } from 'react';
import {
  CheckCircle, XCircle, ArrowLeft, ArrowRight, House, FileArrowDown,
  Trophy, TrendUp, Smiley, ArrowsClockwise, ShareNetwork, Timer,
  Lightbulb, ChartBar, WarningCircle,
} from '@phosphor-icons/react';
import Confetti from '../components/game/Confetti';
import Card, { CardContent } from '../components/common/Card';
import Button from '../components/common/Button';
import { getAttemptDetails } from '../services/quiz';
import { useAsync } from '../hooks/useAsync';
import Skeleton from '../components/common/Skeleton';
import { sanitize } from '../utils/sanitize';
import { handleError } from '../utils/errors';
import toast from 'react-hot-toast';
import ShareResultModal from '../components/share/ShareResultModal';
import { createQuizShare, getPublicQuizShare, revokeQuizShare } from '../services/shares';
import { useTranslation } from 'react-i18next';

const gradeConfig = {
  excellent: {
    label: 'result.titleExcellent',
    message: 'result.grade.excellent.message',
    recommendation: 'result.grade.excellent.recommendation',
    icon: Trophy,
  },
  good: {
    label: 'result.grade.good.label',
    message: 'result.grade.good.message',
    recommendation: 'result.grade.good.recommendation',
    icon: TrendUp,
  },
  tryAgain: {
    label: 'result.titleTryAgain',
    message: 'result.grade.tryAgain.message',
    recommendation: 'result.grade.tryAgain.recommendation',
    icon: Smiley,
  },
};

function getGrade(score) {
  if (score >= 80) return gradeConfig.excellent;
  if (score >= 50) return gradeConfig.good;
  return gradeConfig.tryAgain;
}

const FILTERS = [
  { key: 'all', label: 'result.filter.all' },
  { key: 'correct', label: 'result.filter.correct' },
  { key: 'wrong', label: 'result.filter.wrong' },
];
function formatCompactTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, '0');
  return `${m}:${s}`;
}

export default function QuizResult() {
  const { t } = useTranslation();
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const result = location.state;

  const [data, setData] = useState(result || null);
  const [answers, setAnswers] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [challengeShare, setChallengeShare] = useState(null);
  const resultRef = useRef(null);
  const timed = data?.timed;
  useEffect(() => {
    if (!data) return;
    const target = Math.round(data.score);
    let confettiTimeout;
    if (target >= 80) {
      setShowConfetti(true);
      confettiTimeout = setTimeout(() => setShowConfetti(false), 4000);
    }
    const duration = 800;
    const start = performance.now();
    let frameId;
    const frame = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(confettiTimeout);
    };
  }, [data]);

  const { loading, error: detailsError, refetch: refetchDetails } = useAsync(async () => {
    const attempt = await getAttemptDetails(attemptId);
    if (attempt) {
      const serverData = {
        score: attempt.score,
        correct: attempt.correct_answers,
        total: attempt.total_questions,
        startedAt: attempt.started_at || null,
        completedAt: attempt.completed_at,
        categoryId: attempt.category_id,
        difficulty: attempt.difficulty,
      };
      setData((current) => current ? { ...serverData, ...current } : serverData);
      setAnswers(attempt.quiz_answers.filter((a) => a.questions).map((a) => ({
        id: a.questions.id,
        question: a.questions.question,
        options: a.questions.options,
        type: a.questions.type,
        userAnswer: a.user_answer,
        correctAnswer: a.questions.correct_answer,
        explanation: a.questions.explanation,
        isCorrect: a.is_correct,
      })));
    }
  }, [attemptId]);

  const challengeToken = data?.challengeToken || searchParams.get('challenge');

  useEffect(() => {
    if (!challengeToken) return;
    let cancelled = false;
    getPublicQuizShare(challengeToken)
      .then((share) => {
        if (!cancelled) setChallengeShare(share);
      })
      .catch(() => {
        if (!cancelled) setChallengeShare(null);
      });
    return () => { cancelled = true; };
  }, [challengeToken]);

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
      pdf.save(t('result.pdfFilename', { score: Math.round(data.score) }));
    } catch (err) {
      handleError(err, t('result.error.exportPdf'));
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
  const timeSpent = data?.durationSeconds ?? (data?.startedAt && data?.completedAt
    ? (new Date(data.completedAt) - new Date(data.startedAt)) / 1000
    : null);

  const goTo = (idx) => setCurrentIndex(idx);

  const typeStats = useMemo(() => {
    const stats = {};
    for (const a of answers) {
      const t = a.type || 'multiple_choice';
      if (!stats[t]) stats[t] = { total: 0, correct: 0 };
      stats[t].total++;
      if (a.isCorrect) stats[t].correct++;
    }
    return stats;
  }, [answers]);

  const typeLabel = {
    multiple_choice: 'result.type.multipleChoice',
    short_answer: 'result.type.fillIn',
    isian: 'result.type.fillIn',
  };

  const handleRetryWrong = () => {
    const retryQuestions = answers
      .filter((a) => !a.isCorrect)
      .map((a) => ({
        id: a.id,
        type: a.type || 'multiple_choice',
        question: a.question,
        options: a.options,
        correct_answer: a.correctAnswer,
        explanation: a.explanation || '',
      }));
    if (retryQuestions.length === 0) {
      toast.error(t('result.nextStep.retryUnavailable'));
      return;
    }
    navigate('/practice/retry', {
      state: {
        retryQuestions,
        retryMeta: { categoryId: data?.categoryId, difficulty: data?.difficulty },
      },
    });
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const share = await createQuizShare(attemptId, false);
      setShareData({
        ...share,
        durationSeconds: timeSpent,
        url: `${window.location.origin}/s/${share.token}`,
      });
      setShareOpen(true);
    } catch (err) {
      handleError(err, t('result.error.share'));
    } finally {
      setSharing(false);
    }
  };

  const handleShowNameChange = async (showName) => {
    setPrivacyLoading(true);
    try {
      const share = await createQuizShare(attemptId, showName);
      setShareData((current) => ({
        ...share,
        durationSeconds: current?.durationSeconds ?? timeSpent,
        url: `${window.location.origin}/s/${share.token}`,
      }));
    } catch (err) {
      handleError(err, t('result.error.namePreference'));
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handleRevokeShare = async () => {
    if (!shareData?.token) return;
    setRevokeLoading(true);
    try {
      await revokeQuizShare(shareData.token);
      setShareOpen(false);
      setShareData(null);
      toast.success(t('result.share.revoked'));
    } catch (err) {
      handleError(err, t('result.error.revokeShare'));
    } finally {
      setRevokeLoading(false);
    }
  };

  if (loading && !data) {
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('result.notFound')}</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('result.notFoundDescription')}</p>
        </div>
        <Button onClick={() => navigate('/practice')}>{t('result.backToPractice')}</Button>
      </div>
    );
  }

  const grade = getGrade(data.score);
  const GradeIcon = grade.icon;
  const correctCount = data.correct;
  const totalCount = data.total;
  const wrongCount = totalCount - correctCount;
  const correctPct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const scoreTone = data.score >= 80
    ? 'text-green-500'
    : data.score >= 50
      ? 'text-amber-500'
      : 'text-primary-500';

  return (
    <div className="max-w-2xl mx-auto space-y-5" ref={resultRef}>
      {/* Score Hero */}
      <Card hover={false}>
        <CardContent className="py-6 sm:py-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                  className="text-gray-100 dark:text-gray-700" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray={`${(data.score / 100) * 326.7} 326.7`} strokeLinecap="round"
                  className={`${scoreTone} transition-all duration-1000 ease-spring`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <strong className="text-3xl font-semibold leading-none tabular-nums text-gray-900 dark:text-gray-100">
                  {animatedScore}
                </strong>
                <span className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-gray-400">
                  {t('result.points')}
                </span>
              </div>
            </div>
            <div className="max-w-sm space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                <GradeIcon className="h-4 w-4" weight="fill" /> {t('result.practiceResult')}
              </span>
              <h1 className="text-[1.75rem] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                {t(grade.label)}
              </h1>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {t(grade.message)}
              </p>
              {timed && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                  <Timer className="w-3.5 h-3.5" weight="fill" /> {t('result.timedChallenge')}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 divide-x divide-black/[0.06] rounded-2xl bg-gray-50 px-2 py-4 dark:divide-white/[0.08] dark:bg-gray-700/30">
            <div className="px-2 text-center">
              <strong className="block text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {correctCount}/{totalCount}
              </strong>
              <span className="text-[0.6875rem] text-gray-400 dark:text-gray-500">{t('result.stats.correct')}</span>
            </div>
            <div className="px-2 text-center">
              <strong className="block text-lg font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                {correctPct}%
              </strong>
              <span className="text-[0.6875rem] text-gray-400 dark:text-gray-500">{t('result.stats.accuracy')}</span>
            </div>
            <div className="px-2 text-center">
              <strong className="block truncate text-sm font-semibold leading-7 tabular-nums text-gray-900 dark:text-gray-100">
                {timeSpent !== null ? formatCompactTime(timeSpent) : '—'}
              </strong>
              <span className="text-[0.6875rem] text-gray-400 dark:text-gray-500">{t('result.stats.duration')}</span>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-red-100 dark:bg-red-900/20" aria-label={t('result.correctPercentage', { percent: correctPct })}>
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700 ease-spring"
              style={{ width: `${correctPct}%` }}
            />
          </div>

          <Button className="mt-5 w-full gap-2" size="lg" onClick={handleShare} loading={sharing}>
            <ShareNetwork className="h-5 w-5" weight="bold" /> {t('result.shareAchievement')}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <Card hover={false}>
          <CardContent className="space-y-3 py-5" role="status" aria-label={t('result.review.loading')}>
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </CardContent>
        </Card>
      )}

      {detailsError && !loading && (
        <Card hover={false}>
          <CardContent className="py-5 text-center">
            <WarningCircle className="mx-auto h-8 w-8 text-primary-500" weight="fill" />
            <h2 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{t('result.review.errorTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('result.review.errorDescription')}</p>
            <Button variant="outline" className="mt-4" onClick={refetchDetails}>{t('result.retry')}</Button>
          </CardContent>
        </Card>
      )}

      {challengeShare && (
        <Card hover={false}>
          <CardContent className="py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-600 dark:text-primary-300">
                  {t('result.challenge.title')}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('result.challenge.friendScore', {
                    name: challengeShare.displayName || t('result.challenge.friendFallback'),
                    score: Math.round(Number(challengeShare.score)),
                  })}
                </p>
              </div>
              <div className="flex items-end gap-3 tabular-nums">
                <span className="text-sm text-gray-400">{t('result.challenge.yourScore')}</span>
                <strong className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                  {Math.round(Number(data.score))}
                </strong>
                <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                  Number(data.score) >= Number(challengeShare.score)
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                }`}>
                  {Number(data.score) >= Number(challengeShare.score)
                    ? `+${Math.round(Number(data.score) - Number(challengeShare.score))}`
                    : Math.round(Number(data.score) - Number(challengeShare.score))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card hover={false}>
        <CardContent className="py-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
              <Lightbulb className="h-5 w-5" weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300">
                {t('result.nextStep.label')}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                {wrongCount > 0 ? t('result.nextStep.fixWrong', { count: wrongCount }) : t('result.nextStep.continueProgress')}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {t(grade.recommendation)}
              </p>
              <Button
                variant="secondary"
                className="mt-4 w-full gap-2 sm:w-auto"
                onClick={wrongCount > 0 ? handleRetryWrong : () => navigate('/practice')}
                loading={wrongCount > 0 && loading}
                disabled={wrongCount > 0 && (!answers.length || Boolean(detailsError))}
              >
                {wrongCount > 0
                  ? <><ArrowsClockwise className="h-4 w-4" /> {t('result.nextStep.retryWrong')}</>
                  : <><ArrowRight className="h-4 w-4" /> {t('result.nextStep.chooseNext')}</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics by type */}
      {Object.keys(typeStats).length > 0 && (
        <Card hover={false}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2">
              <ChartBar className="h-5 w-5 text-secondary-600 dark:text-secondary-300" weight="fill" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('result.insights.title')}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(typeStats).map(([type, st]) => {
                const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
                return (
                  <div key={type} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                         {typeLabel[type] ? t(typeLabel[type]) : type}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 tabular-nums">
                        {st.correct}/{st.total}
                      </span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <div
                        className="bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[0.75rem] text-gray-400 dark:text-gray-500 tabular-nums">
                       {t('result.insights.correctPercentage', { percent: pct })}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      {answers.length > 0 && (
        <div className="space-y-3 pt-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{t('result.review.title')}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('result.review.description')}</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-gray-100/60 p-1 dark:bg-gray-700/40">
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
                    min-h-[44px] flex-1 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium leading-tight
                    transition-all duration-200 ease-spring
                    ${isActive
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }
                  `.trim()}
                >
                  {t(f.label)}
                  <span className="ml-1 tabular-nums opacity-60 shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Question Pagination */}
      {filteredAnswers.length > 0 && current && (
        <div className="space-y-4">
          {/* Question header */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 dark:text-gray-500 tabular-nums">
               {t('result.question')} <span className="font-medium text-gray-700 dark:text-gray-300">{currentIndex + 1}</span>
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
               {current.isCorrect ? t('result.status.correct') : t('result.status.wrong')}
            </span>
          </div>

          <Card key={`${filter}-${currentIndex}`}>
            <CardContent className="space-y-5">
              {/* Soal */}
              <p className="text-[1.0625rem] font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                {sanitize(current.question)}
              </p>

              {/* Opsi Pilihan (khusus multiple_choice) */}
              {current.type === 'multiple_choice' && Array.isArray(current.options) && (
                <div className="space-y-2">
                  {current.options.map((opt) => {
                    const isUserAnswer = current.userAnswer === opt.label;
                    const isCorrectAnswer = current.correctAnswer === opt.label;
                    const isWrongSelection = isUserAnswer && !current.isCorrect;

                    let borderStyle = 'border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800/50';
                    let labelStyle = 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
                    let icon = null;

                    if (isCorrectAnswer) {
                      borderStyle = 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10';
                      labelStyle = 'bg-green-500 text-white';
                      icon = <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" weight="fill" />;
                    }
                    if (isWrongSelection) {
                      borderStyle = 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10';
                      labelStyle = 'bg-red-500 text-white';
                      icon = <XCircle className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" weight="fill" />;
                    }

                    return (
                      <div
                        key={opt.label}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl border text-sm
                          transition-all duration-200
                          ${borderStyle}
                        `.trim()}
                      >
                        <span className={`
                          w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
                          transition-all duration-200
                          ${labelStyle}
                        `.trim()}>
                          {opt.label}
                        </span>
                        <span className="flex-1 min-w-0 break-words text-gray-700 dark:text-gray-300">{opt.text}</span>
                        {icon && (
                          <span className="flex items-center">{icon}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Jawaban User (untuk isian / ringkasan) */}
              {current.type !== 'multiple_choice' && (
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
                       <span className="font-medium text-gray-500 dark:text-gray-400 text-[0.8125rem]">{t('result.yourAnswer')}</span>
                      <p className="text-gray-900 dark:text-gray-100">{current.userAnswer}</p>
                    </div>
                  </div>

                  {!current.isCorrect && current.correctAnswer && (
                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 text-sm">
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600 dark:text-green-400" weight="fill" />
                      <div>
                         <span className="font-medium text-gray-500 dark:text-gray-400 text-[0.8125rem]">{t('result.correctAnswer')}</span>
                        <p className="text-green-700 dark:text-green-300 font-medium">{current.correctAnswer}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pembahasan */}
              {current.explanation && (
                <div className="bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/30 px-4 py-3.5 rounded-xl leading-relaxed">
                  <span className="font-semibold text-amber-700 dark:text-amber-400 text-[0.8125rem] uppercase tracking-[0.04em] block mb-1.5">
                     {t('result.discussion')}
                  </span>
                  <p className="text-[0.875rem] text-gray-600 dark:text-gray-300">
                    {current.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex - 1)} disabled={isFirst}>
               <ArrowLeft className="w-4 h-4 mr-1" /> {t('result.previous')}
            </Button>

            {filteredAnswers.length > 1 && (
              <div className="hidden sm:flex items-center gap-1.5">
                {filteredAnswers.slice(0, Math.min(filteredAnswers.length, 12)).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goTo(idx)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                    aria-label={t('result.questionNumber', { number: idx + 1 })}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ease-spring ${
                      idx === currentIndex
                        ? 'scale-125 bg-primary-500'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  </button>
                ))}
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => goTo(currentIndex + 1)} disabled={isLast}>
               {t('result.next')} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Empty filter state */}
      {filteredAnswers.length === 0 && answers.length > 0 && (
        <div className="text-center py-10 space-y-2">
          <Smiley className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
             {filter === 'wrong' ? t('result.empty.allCorrect') : t('result.empty.filter')}
          </p>
        </div>
      )}

      {/* Secondary actions */}
      <Card hover={false}>
        <CardContent className="py-5">
           <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('result.actions.title')}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/practice')}>
               <ArrowLeft className="h-4 w-4" /> {t('result.actions.otherPractice')}
            </Button>
            <Button variant="ghost" className="w-full gap-2" onClick={handleExportPDF} loading={exporting}>
               <FileArrowDown className="h-4 w-4" /> {t('result.downloadPdf')}
            </Button>
            <Button variant="ghost" className="w-full gap-2" onClick={() => navigate('/dashboard')}>
               <House className="h-4 w-4" /> {t('result.dashboard')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Confetti active={showConfetti} />
      <ShareResultModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        share={shareData || {}}
        onShowNameChange={handleShowNameChange}
        privacyLoading={privacyLoading}
        onRevoke={handleRevokeShare}
        revokeLoading={revokeLoading}
      />
    </div>
  );
}
