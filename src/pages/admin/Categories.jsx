import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ListTree } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import EmptyState from '../../components/feedback/EmptyState';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', display_order: 0 });

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('display_order');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', icon: '', display_order: 0 });
  };

  const handleEdit = (cat) => {
    setEditing(cat.id);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', icon: cat.icon || '', display_order: cat.display_order });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase.from('categories').update(form).eq('id', editing);
        if (error) throw error;
        toast.success('Kategori diperbarui');
      } else {
        const { error } = await supabase.from('categories').insert(form);
        if (error) throw error;
        toast.success('Kategori ditambahkan');
      }
      resetForm();
      await fetchCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.success('Kategori dihapus');
      await fetchCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kategori</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola kategori soal.</p>
        </div>
        {!editing && (
          <Button onClick={resetForm}>
            <Plus className="w-4 h-4 mr-2" /> Tambah
          </Button>
        )}
      </div>

      {(editing || (!editing && !categories.length && !loading)) && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{editing ? 'Edit Kategori' : 'Kategori Baru'}</h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama</label>
                <input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                <input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi</label>
                <textarea className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Icon</label>
                <input className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="BookOpen" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Urutan</label>
                <input type="number" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">{editing ? 'Simpan' : 'Tambah'}</Button>
                {editing && <Button variant="outline" onClick={resetForm}>Batal</Button>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState icon={ListTree} title="Belum Ada Kategori" description="Tambah kategori baru." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cat.slug} {cat.description ? `— ${cat.description}` : ''}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(cat)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
