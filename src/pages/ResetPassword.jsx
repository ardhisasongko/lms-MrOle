import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeSlash, CheckCircle, LockKey } from '@phosphor-icons/react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password minimal 8 karakter');
      return;
    }
    if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      toast.error('Password harus mengandung minimal 1 huruf dan 1 angka');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      toast.error(err.message || 'Gagal mereset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Password Berhasil Diubah</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Kamu akan diarahkan ke halaman login...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reset Password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Buat password baru untuk akunmu.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            label="Password Baru"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimal 8 karakter, huruf + angka"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          >
            {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <Input
          label="Konfirmasi Password Baru"
          type="password"
          placeholder="Ulangi password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          <LockKey className="w-4 h-4" /> Simpan Password Baru
        </Button>
      </form>
    </div>
  );
}
