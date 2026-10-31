import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ClipboardText, Copy, Crown, Play, Trophy, UsersThree,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import Card, { CardContent } from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import EmptyState from '../components/feedback/EmptyState';
import Skeleton from '../components/common/Skeleton';
import { useClassDetail } from '../hooks/useClasses';
import { useCategories } from '../hooks/useCategories';
import { ClassesNotActiveState } from './Classes';
import { DIFFICULTY_LABEL } from '../utils/constants';
import { ASSIGNMENT_STATUS_LABEL, getAssignmentStatus } from '../utils/classes';
import { handleError } from '../utils/errors';
import { formatDate } from '../utils/format';

const statusVariant = { active: 'primary', overdue: 'danger', completed: 'success' };

export default function ClassDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    class: classInfo, members, assignments, leaderboard, myAttempts,
    isOwner, loading, error, notActive, createAssignment,
  } = useClassDetail(id);
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [questionCount, setQuestionCount] = useState(20);
  const [dueAt, setDueAt] = useState('');
  const [saving, setSaving] = useState(false);

  // Tugas ditandai selesai bila murid punya attempt pada kategori +
  // difficulty tugas itu (data attempt dari service quiz yang ada).
  const completedKeys = useMemo(
    () => new Set((myAttempts || []).map((a) => `${a.category_id}:${a.difficulty}`)),
    [myAttempts],
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(classInfo.joinCode);
      toast.success(`Kode ${classInfo.joinCode} tersalin — bagikan ke muridmu.`);
    } catch {
      toast.error('Gagal menyalin kode. Salin manual ya.');
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul tugas wajib diisi');
      return;
    }
    if (!categoryId) {
      toast.error('Pilih kategori tugas');
      return;
    }
    setSaving(true);
    try {
      await createAssignment({
        title,
        categoryId,
        difficulty,
        questionCount,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setTitle('');
      setDueAt('');
      toast.success('Tugas dibuat! Anggota kelas bisa langsung mengerjakannya.');
    } catch (err) {
      handleError(err, 'Gagal membuat tugas');
    } finally {
      setSaving(false);
    }
  };

  if (notActive) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link to="/classes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas
        </Link>
        <ClassesNotActiveState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState icon={UsersThree} title="Gagal Memuat" description={error} />
      </div>
    );
  }

  if (loading || !classInfo) {
    return (
      <div className="max-w-4xl mx-auto space-y-3">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <Link to="/classes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelas
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight break-words">
              {classInfo.name}
            </h1>
            {classInfo.description && (
              <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 break-words">{classInfo.description}</p>
            )}
          </div>
          <Badge variant={isOwner ? 'primary' : 'secondary'} size="sm">
            {isOwner ? 'Kelas Saya' : 'Anggota'}
          </Badge>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={copyCode}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 px-3.5 py-2 text-sm text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all"
          >
            <Copy className="w-4 h-4" />
            Kode gabung: <span className="font-bold tracking-[0.25em]">{classInfo.joinCode}</span>
            <span className="text-xs font-normal">(klik untuk menyalin)</span>
          </button>
        )}
      </div>

      <Card>
        <CardContent className="py-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Leaderboard Kelas
          </h2>
          {leaderboard.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Belum ada anggota dengan riwayat kuis. Leaderboard terisi begitu anggota mulai berlatih.
            </p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((row, i) => (
                <div
                  key={row.studentId}
                  className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5"
                >
                  <span className="w-7 text-center font-bold text-gray-500 dark:text-gray-400">
                    {i === 0 ? <Crown className="w-5 h-5 inline text-amber-500" weight="fill" /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {row.fullName || 'Anggota'}
                  </span>
                  <span className="text-xs text-gray-400">{row.quizzes} kuis</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {row.avgScore === null ? '—' : `${row.avgScore}`}
                  </span>
                  <span className="text-xs font-medium text-primary-600 dark:text-primary-400">{row.totalXp} XP</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ClipboardText className="w-5 h-5 text-primary-500" /> Tugas Kelas
          </h2>

          {isOwner && (
            <form onSubmit={handleCreateAssignment} className="space-y-3 rounded-2xl bg-gray-50 dark:bg-gray-800 p-4">
              <Input
                label="Judul tugas"
                placeholder="mis. Latihan Grammar minggu ini"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="assignment-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kategori
                  </label>
                  <select
                    id="assignment-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="block w-full rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Pilih kategori…</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="assignment-difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Level
                  </label>
                  <select
                    id="assignment-difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="block w-full rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Jumlah soal"
                  type="number"
                  min={1}
                  max={100}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                />
              </div>
              <Input
                label="Tenggat (opsional)"
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Menyimpan…' : 'Tambah Tugas'}
              </Button>
            </form>
          )}

          {assignments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isOwner
                ? 'Belum ada tugas. Buat tugas pertama dengan formulir di atas.'
                : 'Belum ada tugas dari pemilik kelas. Kamu tetap bisa latihan bebas di halaman Practice.'}
            </p>
          ) : (
            <div className="space-y-2">
              {assignments.map((a) => {
                const completed = a.categoryId
                  ? completedKeys.has(`${a.categoryId}:${a.difficulty}`)
                  : false;
                const status = getAssignmentStatus(a, new Date(), completed);
                return (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 px-3.5 py-3"
                  >
                    <div className="flex-1 min-w-[12rem] space-y-0.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">{a.title}</p>
                      <p className="text-xs text-gray-400">
                        {a.categoryName || 'Kategori'} • {DIFFICULTY_LABEL[a.difficulty] || a.difficulty}
                        {' • '}{a.questionCount} soal
                        {a.dueAt ? ` • tenggat ${formatDate(a.dueAt)}` : ''}
                      </p>
                    </div>
                    <Badge variant={statusVariant[status]} size="sm">
                      {ASSIGNMENT_STATUS_LABEL[status]}
                    </Badge>
                    {a.categoryId && (
                      <Button
                        size="sm"
                        variant={completed ? 'outline' : 'primary'}
                        className="gap-1.5"
                        onClick={() => navigate(`/practice/${a.categoryId}?difficulty=${a.difficulty}`)}
                      >
                        <Play className="w-4 h-4" weight="fill" />
                        {completed ? 'Kerjakan Lagi' : 'Kerjakan'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UsersThree className="w-5 h-5 text-primary-500" /> Anggota ({members.length})
          </h2>
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isOwner
                ? 'Belum ada murid yang gabung. Bagikan kode gabung di atas ke muridmu.'
                : 'Belum ada anggota lain di kelas ini.'}
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.studentId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-gray-800 dark:text-gray-200">
                    {m.fullName || 'Anggota kelas'}
                  </span>
                  <span className="text-xs text-gray-400">gabung {formatDate(m.joinedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
