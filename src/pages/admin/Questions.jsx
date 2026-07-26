import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, BookOpen } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/feedback/EmptyState';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import { supabase } from '../../services/supabase';
import { DIFFICULTY_LABEL } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    category_id: '', difficulty: 'easy', type: 'multiple_choice',
    question: '', options: '[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}]',
    correct_answer: '', explanation: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: cats } = await supabase.from('categories').select('id, name').order('display_order');
        setCategories(cats || []);
        if (cats?.length) setForm((f) => ({ ...f, category_id: cats[0].id }));
        const { data: qs } = await supabase.from('questions').select('*, categories(name)').order('created_at', { ascending: false });
        setQuestions(qs || []);
      } catch {
        toast.error('Gagal memuat data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setForm({
      category_id: categories[0]?.id || '', difficulty: 'easy', type: 'multiple_choice',
      question: '', options: '[{"label":"A","text":""},{"label":"B","text":""},{"label":"C","text":""},{"label":"D","text":""}]',
      correct_answer: '', explanation: '',
    });
  };

  const handleEdit = (q) => {
    setEditing(q.id);
    setShowForm(true);
    setForm({
      category_id: q.category_id, difficulty: q.difficulty, type: q.type,
      question: q.question, options: JSON.stringify(q.options || ''), correct_answer: q.correct_answer, explanation: q.explanation,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let options = null;
    if (form.type === 'multiple_choice') {
      try { options = JSON.parse(form.options); } catch { toast.error('Format JSON options tidak valid'); return; }
    }
    const payload = { ...form, options };
    try {
      if (editing) {
        const { error } = await supabase.from('questions').update(payload).eq('id', editing);
        if (error) throw error;
        toast.success('Soal diperbarui');
      } else {
        const { error } = await supabase.from('questions').insert(payload);
        if (error) throw error;
        toast.success('Soal ditambahkan');
      }
      resetForm();
      const { data } = await supabase.from('questions').select('*, categories(name)').order('created_at', { ascending: false });
      setQuestions(data || []);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supabase.from('questions').delete().eq('id', deleteTarget);
      toast.success('Soal dihapus');
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const difficultyBadge = (d) => {
    if (d === 'easy') return 'success';
    if (d === 'medium') return 'warning';
    return 'danger';
  };

  const renderOptions = (options) => {
    if (!options) return '-';
    try {
      const parsed = typeof options === 'string' ? JSON.parse(options) : options;
      return parsed.map((o) => `${o.label}. ${o.text}`).join(' | ');
    } catch {
      return '-';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Soal</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola bank soal.</p>
        </div>
        {!editing && !showForm && (
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Soal
          </Button>
        )}
      </div>

      {(editing || showForm) && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{editing ? 'Edit Soal' : 'Soal Baru'}</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
                  <select className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kesulitan</label>
                  <select className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipe</label>
                  <select className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="short_answer">Isian Singkat</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Soal</label>
                <textarea className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
              </div>

              {form.type === 'multiple_choice' && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Options (JSON)</label>
                  <textarea className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:ring-primary-500" rows={3} value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
                  <p className="text-xs text-gray-500">Format: {`[{ "label": "A", "text": "..." }, { "label": "B", "text": "..." }]`}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jawaban Benar</label>
                  <input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pembahasan</label>
                <textarea className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} required />
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editing ? 'Simpan' : 'Tambah'}</Button>
                {editing && <Button variant="outline" onClick={resetForm}>Batal</Button>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState icon={BookOpen} title="Belum Ada Soal" description="Tambah soal baru." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{q.question}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="primary" size="sm">{q.categories?.name}</Badge>
                      <Badge variant={difficultyBadge(q.difficulty)} size="sm">{DIFFICULTY_LABEL[q.difficulty]}</Badge>
                      <Badge size="sm">{q.type === 'multiple_choice' ? 'PG' : 'Isian'}</Badge>
                      <span className="text-xs text-gray-500">Jawaban: {q.correct_answer}</span>
                    </div>
                    {q.type === 'multiple_choice' && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{renderOptions(q.options)}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => handleEdit(q)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(q.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus Soal"
        message="Apakah kamu yakin ingin menghapus soal ini? Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
