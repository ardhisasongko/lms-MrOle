import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/practice', label: 'Latihan' },
  { to: '/history', label: 'Riwayat' },
  { to: '/leaderboard', label: 'Peringkat' },
  { to: '/chat', label: 'AI Chat' },
  { to: '/profile', label: 'Profil' },
  { to: '/settings', label: 'Pengaturan' },
];

export default function DashboardLayout({ user, onLogout }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const linkClass = (to) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
    location.pathname === to
      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:flex md:flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary-600">
            <GraduationCap className="w-8 h-8" />
            <span>Mr Ole</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {sidebarLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full transition-colors duration-150"
          >
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-primary-600">
            <GraduationCap className="w-7 h-7" />
            <span>Mr Ole</span>
          </Link>
          <button onClick={() => setSidebarOpen(true)} aria-label="Buka menu navigasi" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150">
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
