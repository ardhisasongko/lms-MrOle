import { Link } from 'react-router-dom';
import { Home, RefreshCw } from 'lucide-react';

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Terjadi Kesalahan</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
        Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm min-h-[44px] border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
        >
          <RefreshCw className="w-4 h-4" />
          Muat Ulang
        </button>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium text-sm min-h-[44px] transition-colors duration-150"
        >
          <Home className="w-4 h-4" />
          Beranda
        </Link>
      </div>
    </div>
  );
}
