import { useState, useEffect } from 'react';
import {
  Users as UsersIcon, PencilSimple, Trash, MagnifyingGlass,
  Shield, User, Calendar, Clock,
} from '@phosphor-icons/react';
import Card, { CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/feedback/EmptyState';
import ConfirmModal from '../../components/feedback/ConfirmModal';
import { getProfiles, updateProfileRole, deleteUser } from '../../services/users';
import { logAdmin } from '../../utils/logAdmin';
import toast from 'react-hot-toast';
import { handleError } from '../../utils/errors';

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
      const data = await getProfiles();
      setUsers(data);
    } catch (err) {
      handleError(err, 'Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(true);
    try {
      await updateProfileRole(userId, newRole);
      logAdmin('update', 'profiles', userId, { role: newRole });
      toast.success(`Role berhasil diubah menjadi ${newRole}`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
    } catch (err) {
      handleError(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteUser(deleteTarget);
      logAdmin('delete', 'profiles', deleteTarget);
      toast.success('User berhasil dihapus');
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      handleError(err, 'Gagal menghapus user');
    } finally {
      setDeleting(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    regular: users.filter((u) => u.role === 'user').length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
          Kelola Pengguna
        </h1>
        <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
          Kelola semua user yang terdaftar.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/20 text-center">
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total User</p>
        </div>
        <div className="p-3 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/20 text-center">
          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.admins}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
        </div>
        <div className="p-3 rounded-xl bg-cta-50/50 dark:bg-cta-900/20 text-center">
          <p className="text-xl font-bold text-cta-600 dark:text-cta-400">{stats.regular}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">User</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari nama user..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 transition-all duration-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
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
            <Card key={u.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center shrink-0 overflow-hidden">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-primary-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{u.full_name}</p>
                        <Badge variant={u.role === 'admin' ? 'primary' : 'secondary'} size="sm">
                          {u.role === 'admin' ? (
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(u.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {editingUser === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="text-xs rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 transition-all duration-200"
                          defaultValue={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={updating}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingUser(u.id)}
                          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary-500 transition-all duration-200"
                          title="Ubah role"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u.id)}
                          className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-200"
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

      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
        Menampilkan {filteredUsers.length} dari {users.length} user
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
