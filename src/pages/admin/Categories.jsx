import { useState } from 'react';
import { TreeStructure } from '@phosphor-icons/react';
import CrudTable from '../../components/common/CrudTable';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categories';
import { useAsync } from '../../hooks/useAsync';
import { logAdmin } from '../../utils/logAdmin';
import toast from 'react-hot-toast';

const inputCls = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);

  const { loading, refetch } = useAsync(async () => {
    const cats = await getCategories();
    setCategories(cats);
  }, []);

  const handleCreate = async (form) => {
    const inserted = await createCategory(form);
    if (inserted) logAdmin('insert', 'categories', inserted.id, { name: form.name });
    toast.success('Kategori ditambahkan');
    await refetch();
  };

  const handleUpdate = async (id, form) => {
    await updateCategory(id, form);
    logAdmin('update', 'categories', id, { name: form.name });
    toast.success('Kategori diperbarui');
    await refetch();
  };

  const handleDelete = async (id) => {
    await deleteCategory(id);
    logAdmin('delete', 'categories', id);
    toast.success('Kategori dihapus');
    await refetch();
  };

  return (
    <CrudTable
      title="Kategori"
      description="Kelola kategori soal."
      icon={TreeStructure}
      emptyTitle="Belum Ada Kategori"
      emptyDesc="Tambah kategori baru."
      items={categories}
      loading={loading}
      resetForm={() => ({ name: '', slug: '', description: '', icon: '', display_order: 0 })}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      deleteTitle="Hapus Kategori"
      deleteMessage="Apakah kamu yakin ingin menghapus kategori ini? Soal dalam kategori ini mungkin perlu dipindahkan."
      renderItem={(cat) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">{cat.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{cat.slug} {cat.description ? `— ${cat.description}` : ''}</p>
        </div>
      )}
      renderForm={({ form, setForm, editing, onCancel }) => (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelCls}>Nama</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Slug</label>
            <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className={labelCls}>Deskripsi</label>
            <textarea className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Icon</label>
            <input className={inputCls} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="BookOpen" />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Urutan</label>
            <input type="number" className={inputCls} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} />
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">{editing ? 'Simpan' : 'Tambah'}</button>
            {editing && <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">Batal</button>}
          </div>
        </div>
      )}
    />
  );
}
