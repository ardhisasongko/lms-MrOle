import { useState } from 'react';
import { BookOpen, CheckCircle, X } from '@phosphor-icons/react';
import Badge from '../../components/common/Badge';
import CrudTable from '../../components/common/CrudTable';
import { ADMIN_QUESTION_PAGE_SIZE, getAllQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../services/questions';
import { getCategorySummary } from '../../services/categories';
import { useAsync } from '../../hooks/useAsync';
import { logAdmin } from '../../utils/logAdmin';
import { DIFFICULTY_LABEL } from '../../utils/constants';
import { sanitize } from '../../utils/sanitize';
import toast from 'react-hot-toast';

const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
const statusLabel = { draft: 'Draf', published: 'Terbit', archived: 'Arsip' };

function prepareQuestion(form) {
  const prompt = (form.prompt ?? form.question ?? '').trim();
  if (!prompt) throw new Error('Prompt soal wajib diisi.');

  let options = null;
  const correctAnswer = (form.correct_answer || '').trim();
  if (form.type === 'multiple_choice') {
    let parsed;
    try {
      parsed = typeof form.options === 'string' ? JSON.parse(form.options) : form.options;
    } catch {
      throw new Error('Format JSON pilihan tidak valid.');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Pilihan jawaban wajib diisi.');
    }

    options = parsed.map((item) => {
      if (typeof item?.label !== 'string' || typeof item?.text !== 'string') {
        throw new Error('Setiap pilihan harus memiliki label dan teks.');
      }
      const label = item.label.trim();
      const text = item.text.trim();
      if (!label || !text) throw new Error('Label dan teks pilihan tidak boleh kosong.');
      return { label, text };
    });

    const labels = options.map((item) => item.label.toLocaleLowerCase());
    const texts = options.map((item) => item.text.toLocaleLowerCase());
    if (new Set(labels).size !== labels.length || new Set(texts).size !== texts.length) {
      throw new Error('Label dan teks pilihan harus unik.');
    }
    if (options.filter((item) => item.label === correctAnswer).length !== 1) {
      throw new Error('Jawaban benar harus sama dengan tepat satu label pilihan.');
    }
  }

  return {
    category_id: form.category_id,
    difficulty: form.difficulty,
    type: form.type,
    question: prompt,
    prompt,
    stimulus: form.stimulus?.trim() || null,
    status: form.status || 'published',
    options,
    correct_answer: correctAnswer,
    explanation: (form.explanation || '').trim(),
  };
}

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
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const { loading, refetch } = useAsync(async (signal) => {
    const cats = await getCategorySummary(signal);
    if (signal.aborted) return;
    const result = await getAllQuestions({ page, signal });
    if (!signal.aborted) {
      setCategories(cats);
      setQuestions(result.data);
      setTotal(result.count);
    }
  }, [page]);

  const handleCreate = async (form) => {
    let payload;
    try {
      payload = prepareQuestion(form);
    } catch (error) {
      toast.error(error.message);
      return false;
    }
    const inserted = await createQuestion(payload);
    if (inserted) logAdmin('insert', 'questions', inserted.id, { question: payload.prompt });
    toast.success('Soal ditambahkan');
    await refetch();
    return true;
  };

  const handleUpdate = async (id, form) => {
    let payload;
    try {
      payload = prepareQuestion(form);
    } catch (error) {
      toast.error(error.message);
      return false;
    }
    await updateQuestion(id, payload);
    logAdmin('update', 'questions', id, { question: payload.prompt });
    toast.success('Soal diperbarui');
    await refetch();
    return true;
  };

  const handleDelete = async (id) => {
    await deleteQuestion(id);
    logAdmin('delete', 'questions', id);
    toast.success('Soal diarsipkan');
    await refetch();
  };

  return (
    <div className="space-y-4">
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
        question: '', prompt: '', stimulus: '', status: 'published',
        options: '[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}]',
        correct_answer: '', explanation: '',
      })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      deleteTitle="Arsipkan Soal"
      deleteMessage="Soal tidak akan dipakai lagi, tetapi riwayat sesi tetap tersimpan."
      addLabel="Tambah Soal"
      renderItem={(q) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{sanitize(q.prompt || q.question)}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="secondary" size="sm">{q.categories?.name}</Badge>
            <Badge variant={q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'} size="sm">{DIFFICULTY_LABEL[q.difficulty]}</Badge>
            <Badge size="sm">{q.type === 'multiple_choice' ? 'PG' : 'Isian'}</Badge>
            {q.status && <Badge variant={q.status === 'published' ? 'success' : 'secondary'} size="sm">{statusLabel[q.status]}</Badge>}
            <span className="text-xs text-gray-500 break-words">Jawaban: {sanitize(q.correct_answer)}</span>
          </div>
          {q.type === 'multiple_choice' && (
            <p className="text-xs text-gray-400 mt-1 break-words leading-snug">{renderOptions(q.options)}</p>
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
            <label className={labelCls}>Stimulus (opsional)</label>
            <textarea className={inputCls} rows={3} value={form.stimulus || ''} onChange={(e) => setForm({ ...form, stimulus: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Prompt soal</label>
            <textarea className={inputCls} rows={2} value={form.prompt ?? form.question ?? ''} onChange={(e) => setForm({ ...form, prompt: e.target.value })} required />
          </div>
          {form.type === 'multiple_choice' && (
            <div className="space-y-1">
              <label className={labelCls}>Options (JSON)</label>
              <textarea className={`${inputCls} font-mono`} rows={3} value={typeof form.options === 'string' ? form.options : JSON.stringify(form.options)} onChange={(e) => setForm({ ...form, options: e.target.value })} />
              <p className="text-xs text-gray-500">Format: {`[{ "label": "A", "text": "..." }]`}</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Jawaban Benar</label>
              <input className={inputCls} value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status || 'published'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draf</option>
                <option value="published">Terbit</option>
                <option value="archived">Arsip</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Pembahasan</label>
            <textarea className={inputCls} rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"><CheckCircle className="w-4 h-4" /> {editing ? 'Simpan' : 'Tambah'}</button>
            {editing && <button type="button" onClick={onCancel} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"><X className="w-4 h-4" /> Batal</button>}
          </div>
        </div>
      )}
      />
      {total > ADMIN_QUESTION_PAGE_SIZE && (
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4" aria-label="Halaman bank soal">
          <button
            type="button"
            disabled={page === 0 || loading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            className="min-h-[44px] rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Halaman {page + 1} dari {Math.ceil(total / ADMIN_QUESTION_PAGE_SIZE)}
          </span>
          <button
            type="button"
            disabled={(page + 1) * ADMIN_QUESTION_PAGE_SIZE >= total || loading}
            onClick={() => setPage((current) => current + 1)}
            className="min-h-[44px] rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
          >
            Berikutnya
          </button>
        </nav>
      )}
    </div>
  );
}
