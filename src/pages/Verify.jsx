import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function Verify() {
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto">
        <Mail className="w-8 h-8 text-primary-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Cek Email Kamu</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Kami sudah mengirim email verifikasi. Klik link di email untuk mengaktifkan akunmu.
        </p>
      </div>
      <Link to="/login">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Login
        </Button>
      </Link>
    </div>
  );
}
