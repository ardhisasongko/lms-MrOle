import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, BookOpen, TreeStructure, ChartBar,
  Clock, ArrowRight,
} from '@phosphor-icons/react';
import Card, { CardContent, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import { getStatsCounts } from '../../services/users';
import { getAdminActivityLog } from '../../services/users';
import { useAsync } from '../../hooks/useAsync';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  const { loading } = useAsync(async (signal) => {
    try {
      const [statsData, activityRes] = await Promise.all([
        getStatsCounts(signal),
        getAdminActivityLog(signal),
      ]);
      if (!signal.aborted) {
        setStats(statsData);
        setRecentActivity(activityRes);
      }
    } catch {
      if (signal.aborted) return;
      toast.error('Gagal memuat statistik.');
      setStats({ users: 0, questions: 0, categories: 0, attempts: 0 });
    }
  }, []);

  const items = [
    { label: 'Pengguna', value: stats?.users, icon: Users, color: 'text-primary-600 bg-primary-100 dark:bg-primary-900/30', href: '/admin/users' },
    { label: 'Soal', value: stats?.questions, icon: BookOpen, color: 'text-cta-600 bg-cta-100 dark:bg-cta-900/30', href: '/admin/questions' },
    { label: 'Kategori', value: stats?.categories, icon: TreeStructure, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', href: '/admin/categories' },
    { label: 'Quiz Attempts', value: stats?.attempts, icon: ChartBar, color: 'text-secondary-600 bg-secondary-100 dark:bg-secondary-900/30', href: null },
  ];

  const quickActions = [
    { label: 'Kelola Pengguna', icon: Users, href: '/admin/users', color: 'text-primary-500' },
    { label: 'Kelola Soal', icon: BookOpen, href: '/admin/questions', color: 'text-cta-500' },
    { label: 'Kelola Kategori', icon: TreeStructure, href: '/admin/categories', color: 'text-yellow-500' },
  ];

  const actionLabel = (action) => {
    if (action === 'insert') return 'Menambah';
    if (action === 'update') return 'Memperbarui';
    if (action === 'delete') return 'Menghapus';
    return action;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.75rem] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            Dashboard Admin
          </h1>
          <p className="text-[0.9375rem] text-gray-500 dark:text-gray-400 leading-relaxed">
            Overview dan manajemen aplikasi.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className={`transition-all duration-200 hover:shadow-md ${item.href ? 'cursor-pointer' : ''}`}
                hover={!!item.href}
                onClick={() => item.href && navigate(item.href)}
              >
                <CardContent className="flex flex-col items-center text-center py-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${item.color}`}>
                    <Icon className="w-6 h-6" weight="fill" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value ?? '-'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aksi Cepat</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.href)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 ${action.color} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 text-left font-medium text-gray-700 dark:text-gray-300">
                      {action.label}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Aktivitas Terbaru</h3>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada aktivitas</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      log.action === 'insert' ? 'bg-green-500' :
                      log.action === 'update' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700 dark:text-gray-300 break-words leading-snug">
                        <span className="font-medium">{log.profiles?.full_name || 'Admin'}</span>
                        {' '}{actionLabel(log.action)}{' '}
                        <span className="font-medium">{log.table_name}</span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
