import { Link } from 'react-router-dom';
import { GraduationCap, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600">
            <GraduationCap className="w-8 h-8" />
            <span>Mr Ole</span>
          </Link>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600">
                  Dashboard
                </Link>
                <Link to="/practice" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600">
                  Latihan
                </Link>
                <Link to="/history" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600">
                  Riwayat
                </Link>
                <Link to="/chat" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600">
                  AI Chat
                </Link>
                <Link to="/profile" aria-label="Profil" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <button onClick={onLogout} aria-label="Keluar" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
                  Masuk
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-150 min-h-[44px]">
                  Daftar
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-3 space-y-2">
          {user ? (
            <>
              <Link to="/dashboard" className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">Dashboard</Link>
              <Link to="/practice" className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">Latihan</Link>
              <Link to="/history" className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">Riwayat</Link>
              <Link to="/chat" className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">AI Chat</Link>
              <Link to="/profile" className="block px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">Profil</Link>
              <button onClick={onLogout} className="block w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">Keluar</button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 min-h-[44px]">
                Masuk
              </Link>
              <Link to="/register" className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors duration-150 min-h-[44px]">
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
