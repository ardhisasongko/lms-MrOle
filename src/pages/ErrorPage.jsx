import { Link } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';
import Button from '../components/common/Button';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terjadi Kesalahan</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
      </p>
      <div className="flex gap-3">
        <button onClick={() => window.location.reload()}>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang
          </Button>
        </button>
        <Link to="/">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
