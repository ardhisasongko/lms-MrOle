import { useState, useEffect } from 'react';
import { Users, BookOpen, ListTree, BarChart3 } from 'lucide-react';
import Card, { CardContent } from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import { supabase } from '../../services/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, questionsRes, categoriesRes, attemptsRes] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('questions').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
        ]);
        setStats({
          users: usersRes.count || 0,
          questions: questionsRes.count || 0,
          categories: categoriesRes.count || 0,
          attempts: attemptsRes.count || 0,
        });
      } catch {
        setStats({ users: 0, questions: 0, categories: 0, attempts: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = [
    { label: 'Pengguna', value: stats?.users, icon: Users, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Soal', value: stats?.questions, icon: BookOpen, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { label: 'Kategori', value: stats?.categories, icon: ListTree, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Quiz Attempts', value: stats?.attempts, icon: BarChart3, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard Admin</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Overview aplikasi.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="flex flex-col items-center text-center py-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{item.value ?? '-'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
