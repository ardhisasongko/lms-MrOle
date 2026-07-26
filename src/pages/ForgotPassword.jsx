import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(err.message || 'Gagal mengirim email reset password');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cek Email Kamu</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Kami sudah mengirim link reset password ke <strong>{email}</strong>
        </p>
        <Link to="/login" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lupa Password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Masukkan email kamu, kami akan kirim link reset.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="contoh@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="w-full">
          Kirim Link Reset
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Login
        </Link>
      </p>
    </div>
  );
}
