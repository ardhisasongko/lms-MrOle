import { useState } from 'react';
import { BookOpen } from '@phosphor-icons/react';
import Badge from '../../components/common/Badge';
import CrudTable from '../../components/common/CrudTable';
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../services/questions';
import { getCategorySummary } from '../../services/categories';
import { useAsync } from '../../hooks/useAsync';
import { logAdmin } from '../../utils/logAdmin';
import { DIFFICULTY_LABEL } from '../../utils/constants';
import { sanitize } from '../../utils/sanitize';
import toast from 'react-hot-toast';

const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

function renderOptions(options) {
  if (!options) return '-';
  try {
    const parsed = typeof options === 'string' ? JSON.parse(options) : options;
    return parsed.map((o) => `${o.label}. ${o.text}`).join(' | ');
  } catch {
    return '-';
  }
}

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);

  const { loading, refetch } = useAsync(async () => {
    const cats = await getCategorySummary();
    setCategories(cats);
    const qs = await getAllQuestions();
    setQuestions(qs);
  }, []);

  const handleCreate = async (form) => {
    let options = null;
    if (form.type === 'multiple_choice') {
      try {
        const parsed = JSON.parse(form.options);
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
        for (const item of parsed) {
          if (!item.label || item.text === undefined) throw new Error();
        }
        options = parsed;
      } catch {
        toast.error('Format JSON options tidak valid.');
        return;
      }
    }
    const inserted = await createQuestion({ ...form, options });
    if (inserted) logAdmin('insert', 'questions', inserted.id, { question: form.question });
    toast.success('Soal ditambahkan');
    await refetch();
  };

  const handleUpdate = async (id, form) => {
    let options = null;
    if (form.type === 'multiple_choice') {
      try {
        const parsed = JSON.parse(form.options);
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
        for (const item of parsed) {
          if (!item.label || item.text === undefined) throw new Error();
        }
        options = parsed;
      } catch {
        toast.error('Format JSON options tidak valid.');
        return;
      }
    }
    await updateQuestion(id, { ...form, options });
    logAdmin('update', 'questions', id, { question: form.question });
    toast.success('Soal diperbarui');
    await refetch();
  };

  const handleDelete = async (id) => {
    await deleteQuestion(id);
    logAdmin('delete', 'questions', id);
    toast.success('Soal dihapus');
  };

  return (
    <CrudTable
      title="Soal"
      description="Kelola bank soal."
      icon={BookOpen}
      emptyTitle="Belum Ada Soal"
      emptyDesc="Tambah soal baru."
      items={questions}
      loading={loading}
      resetForm={() => ({
        category_id: categories[0]?.id || '', difficulty: 'easy', type: 'multiple_choice',
        question: '', options: '[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}]',
        correct_answer: '', explanation: '',
      })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      deleteTitle="Hapus Soal"
      deleteMessage="Apakah kamu yakin ingin menghapus soal ini? Tindakan ini tidak bisa dibatalkan."
      addLabel="Tambah Soal"
      renderItem={(q) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{sanitize(q.question)}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="secondary" size="sm">{q.categories?.name}</Badge>
            <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'} size="sm">{DIFFICULTY_LABEL[q.difficulty]}</Badge>
            <Badge size="sm">{q.type === 'multiple_choice' ? 'PG' : 'Isian'}</Badge>
            <span className="text-xs text-gray-500">Jawaban: {sanitize(q.correct_answer)}</span>
          </div>
          {q.type === 'multiple_choice' && (
            <p className="text-xs text-gray-400 mt-1 truncate">{renderOptions(q.options)}</p>
          )}
        </div>
      )}
      renderForm={({ form, setForm, editing, onCancel }) => (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Kategori</label>
              <select className={inputCls} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Kesulitan</label>
              <select className={inputCls} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Tipe</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="multiple_choice">Pilihan Ganda</option>
                <option value="short_answer">Isian Singkat</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Soal</label>
            <textarea className={inputCls} rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
          </div>
          {form.type === 'multiple_choice' && (
            <div className="space-y-1">
              <label className={labelCls}>Options (JSON)</label>
              <textarea className={`${inputCls} font-mono`} rows={3} value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
              <p className="text-xs text-gray-500">Format: {`[{ "label": "A", "text": "..." }]`}</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Jawaban Benar</label>
              <input className={inputCls} value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Pembahasan</label>
            <textarea className={inputCls} rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">{editing ? 'Simpan' : 'Tambah'}</button>
            {editing && <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Batal</button>}
          </div>
        </div>
      )}
    />
  );
}
