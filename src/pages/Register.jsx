import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeSlash, UserPlus } from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });

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
      await register(form.email, form.password, form.fullName);
      toast.success('Akun berhasil dibuat! Cek email untuk verifikasi.');
    } catch (err) {
      toast.error(err.message || 'Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Daftar Akun</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Buat akun baru untuk mulai belajar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          placeholder="Masukkan nama lengkap"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="contoh@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="relative">
          <Input
            label="Password"
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
          label="Konfirmasi Password"
          type="password"
          placeholder="Ulangi password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          <UserPlus className="w-4 h-4" /> Daftar
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Sudah punya akun?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Masuk
        </Link>
      </p>
    </div>
  );
}
