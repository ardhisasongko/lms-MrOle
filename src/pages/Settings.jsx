import { Link } from 'react-router-dom';
import { User, Moon, Sun, ChevronRight } from 'lucide-react';
import Card, { CardContent, CardHeader } from '../components/common/Card';
import { useAuth } from '../features/auth/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Settings() {
  const { user } = useAuth();
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pengaturan</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola preferensi akunmu.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Akun</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link
            to="/profile"
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Profil</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tampilan</h2>
        </CardHeader>
        <CardContent>
          <button
            onClick={toggle}
            className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {isDark ? <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-gray-100">Tema Gelap</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{isDark ? 'Aktif' : 'Nonaktif'}</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${isDark ? 'bg-primary-600' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isDark ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
