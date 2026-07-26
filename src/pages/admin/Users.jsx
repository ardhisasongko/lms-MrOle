import { useState, useEffect } from 'react';
import { Users as UsersIcon, PencilSimple, Trash, MagnifyingGlass, Shield, User } from '@phosphor-icons/react';
import Card, { CardContent, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/feedback/EmptyState';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

async function logAdmin(action, table, recordId, details) {
  await supabase.rpc('log_admin_action', { p_action: action, p_table_name: table, p_record_id: recordId, p_details: details }).catch(() => {});
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch {
      toast.error('Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      logAdmin('update', 'profiles', userId, { role: newRole });
      toast.success(`Role berhasil diubah menjadi ${newRole}`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(deleteTarget);
      if (error) throw error;
      logAdmin('delete', 'profiles', deleteTarget);
      toast.success('User berhasil dihapus');
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus user');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.id?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola semua user yang terdaftar.</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <MagnifyingGlass className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau ID user..."
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState icon={UsersIcon} title="Belum Ada User" description="Belum ada user yang terdaftar." />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <Card key={u.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.full_name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">ID: {u.id}</p>
                      <p className="text-xs text-gray-400">Bergabung: {formatDate(u.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {editingUser === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 focus:border-primary-500 focus:ring-primary-500"
                          defaultValue={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updating}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <Badge variant={u.role === 'admin' ? 'primary' : 'secondary'} size="sm">
                          {u.role === 'admin' ? (
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                          ) : (
                            'User'
                          )}
                        </Badge>
                        <button
                          onClick={() => setEditingUser(u.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                          title="Ubah role"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          title="Hapus user"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-500 text-right">
        Total: {filteredUsers.length} user
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Hapus User"
        message="Apakah kamu yakin ingin menghapus user ini? Semua data terkait (riwayat quiz, streak, dll) juga akan dihapus. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
