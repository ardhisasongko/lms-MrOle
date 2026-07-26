import { useState, useEffect } from 'react';
import { Camera, Save, User } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import { supabase } from '../services/supabase';
import { useAuth } from '../features/auth/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ fullName: '', avatarUrl: '' });

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setForm({ fullName: data.full_name || '', avatarUrl: data.avatar_url || '' });
        } else {
          setForm({ fullName: user.user_metadata?.full_name || '', avatarUrl: '' });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: form.fullName,
        avatar_url: form.avatarUrl || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(err.message || 'Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola data dirimu.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center relative">
              <User className="w-8 h-8 text-primary-600" />
              <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{form.fullName || 'Belum diisi'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <Input
              label="URL Avatar"
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            />
            <Button type="submit" loading={loading}>
              <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
