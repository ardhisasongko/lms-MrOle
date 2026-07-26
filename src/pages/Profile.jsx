import { useState, useEffect, useRef } from 'react';
import { Camera, FloppyDisk, User, Upload } from '@phosphor-icons/react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Skeleton from '../components/common/Skeleton';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

export default function Profile() {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ fullName: '', avatarUrl: '' });

  useEffect(() => {
    if (!user) return;
    if (IS_DEMO) {
      setForm({ fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '', avatarUrl: '' });
      setFetching(false);
      return;
    }
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
          setForm({ fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '', avatarUrl: '' });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setForm({ fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || '', avatarUrl: '' });
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran maksimal 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Hanya file gambar');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      setForm((prev) => ({ ...prev, avatarUrl: publicUrl }));
      toast.success('Foto profil diupload');
    } catch (err) {
      if (err.message?.includes('bucket') || err.message?.includes('not found')) {
        toast.error('Bucket storage "avatars" belum dibuat. Buat dulu di Supabase Dashboard > Storage.');
      } else {
        toast.error(err.message || 'Gagal upload');
      }
    } finally {
      setUploading(false);
    }
  };

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

  if (fetching) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-4 w-56 rounded" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola data dirimu.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center relative overflow-hidden shrink-0">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Avatar" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary-600" />
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-150"
              >
                <Camera className="w-5 h-5 text-white" />
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
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto Profil</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} loading={uploading}>
                  <Upload className="w-4 h-4 mr-2" /> Pilih Gambar
                </Button>
                {form.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, avatarUrl: '' }))}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">Maksimal 2MB, format JPG/PNG</p>
            </div>
            <Button type="submit" loading={loading}>
              <FloppyDisk className="w-4 h-4 mr-2" /> Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
