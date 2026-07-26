import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        Halaman yang kamu cari tidak ada atau telah dipindahkan.
      </p>
      <Link to="/">
        <Button>
          <Home className="w-4 h-4 mr-2" />
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  );
}
