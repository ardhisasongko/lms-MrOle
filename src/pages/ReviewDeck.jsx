import { useMemo, useState } from 'react';
import { ArrowsCounterClockwise, Brain, CheckCircle, Eye, XCircle } from '@phosphor-icons/react';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import Stimulus from '../components/quiz/Stimulus';
import { useReviewDeck } from '../hooks/useReviewDeck';
import { DIFFICULTY_LABEL } from '../utils/constants';
import { formatDate } from '../utils/format';
import toast from 'react-hot-toast';

const difficultyBadge = {
  easy: 'success',
  medium: 'warning',
  hard: 'danger',
};

function getOptions(options) {
  if (Array.isArray(options)) return options;
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
      return [];
    }
  }
  return options ? Object.values(options) : [];
}

function optionParts(opt, i) {
  const isObject = opt && typeof opt === 'object';
  return {
    label: isObject ? opt.label : String.fromCharCode(65 + i),
    text: isObject ? opt.text : opt,
    value: isObject ? opt.label : opt,
  };
}

function ReviewCard({ item, onReviewed }) {
  const q = item.question;
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  if (!q) return null;

  const options = getOptions(q.options);
  const answered = selected !== null;

  return (
    <Card>
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {q.difficulty && (
            <Badge variant={difficultyBadge[q.difficulty]} size="sm">
              {DIFFICULTY_LABEL[q.difficulty]}
            </Badge>
          )}
          {q.categoryName && (
            <span className="text-xs text-gray-400 min-w-0 break-words">{q.categoryName}</span>
          )}
          <span className="text-xs text-gray-400">
            Tahap {item.stage + 1} • terakhir salah {formatDate(item.lastWrongAt)}
          </span>
        </div>

        <Stimulus>{q.stimulus}</Stimulus>
        <p className="text-[0.9375rem] text-gray-900 dark:text-gray-100 leading-relaxed">
          {q.prompt || q.question}
        </p>

        {options.length > 0 && (
          <div className="space-y-2">
            {options.map((opt, i) => {
              const { label, text, value } = optionParts(opt, i);
              const isPicked = selected === value;
              const isCorrect = value === q.correctAnswer;
              const cls = !answered
                ? 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 border border-transparent'
                : isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : isPicked
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent';
              return (
                <button
                  key={i}
                  type="button"
                  disabled={answered}
                  onClick={() => setSelected(value)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${isPicked && !answered ? 'ring-2 ring-primary-400' : ''} ${cls}`}
                >
                  <span className="font-medium mr-1.5">{label}.</span>{text}
                </button>
              );
            })}
          </div>
        )}

        {answered && !revealed && (
          <p className={`text-sm font-medium ${selected === q.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            {selected === q.correctAnswer
              ? 'Benar! Tandai "Ingat" untuk menjadwalkan ulangan berikutnya lebih jauh.'
              : `Belum tepat — jawaban benar: ${q.correctAnswer}.`}
          </p>
        )}

        {revealed && q.explanation && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Pembahasan:</p>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{q.explanation}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {!revealed && q.explanation && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setRevealed(true)}>
              <Eye className="w-4 h-4" /> Lihat Pembahasan
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => { onReviewed(item.questionId, true); toast.success('Bagus! Ulangan berikutnya dijadwalkan lebih jauh.'); }}
          >
            <CheckCircle className="w-4 h-4" weight="fill" /> Ingat
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { onReviewed(item.questionId, false); toast('Tidak apa-apa — soal ini akan muncul lagi besok.', { icon: '🔁' }); }}
          >
            <XCircle className="w-4 h-4" /> Masih Lupa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReviewDeck() {
  const { dueItems, items, dueCount, totalCount, masteredCount, loading, error, markReviewed } = useReviewDeck();
  const [reviewedCount, setReviewedCount] = useState(0);

  const nextUpcoming = useMemo(
    () => items.find((i) => !i.due && !i.mastered && i.nextReviewAt),
    [items],
  );

  const handleReviewed = (questionId, remembered) => {
    markReviewed(questionId, remembered);
    setReviewedCount((c) => c + 1);
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState icon={ArrowsCounterClockwise} title="Gagal Memuat" description={error} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Ulangan Terjadwal
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          Soal yang pernah kamu jawab salah akan muncul lagi pada jadwal yang makin jarang bila kamu
          makin ingat — cara paling efektif mengunci materi di ingatan.
        </p>
      </div>

      {!loading && totalCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary" size="sm">{dueCount} kartu jatuh tempo hari ini</Badge>
          <Badge variant="secondary" size="sm">{totalCount} soal salah tercatat</Badge>
          {masteredCount > 0 && <Badge variant="success" size="sm">{masteredCount} sudah tuntas</Badge>}
          {reviewedCount > 0 && <Badge variant="success" size="sm">{reviewedCount} direview sesi ini</Badge>}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Brain}
              title="Belum Ada Soal untuk Diulang"
              description="Kerjakan latihan dulu — setiap jawaban salahmu akan otomatis masuk ke deck ulangan ini."
            />
          </CardContent>
        </Card>
      ) : dueItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={CheckCircle}
              title="Semua Sudah Direview"
              description={nextUpcoming
                ? `Hebat! Ulangan berikutnya: ${nextUpcoming.question?.prompt || nextUpcoming.question?.question || 'soal berikutnya'} — jatuh tempo ${formatDate(nextUpcoming.nextReviewAt)}.`
                : 'Semua soal salahmu sudah tuntas atau belum jatuh tempo. Kembali lagi nanti!'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dueItems.map((item) => (
            <ReviewCard key={item.questionId} item={item} onReviewed={handleReviewed} />
          ))}
        </div>
      )}
    </div>
  );
}
