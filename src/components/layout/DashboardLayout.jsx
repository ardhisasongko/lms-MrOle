import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Shield, X, List } from '@phosphor-icons/react';
import { cn } from '../../utils/cn';
import { useAdmin } from '../../hooks/useAdmin';

const sidebarLinks = [
  { to: '/dashboard', key: 'nav.dashboard' },
  { to: '/practice', key: 'nav.practice' },
  { to: '/history', key: 'nav.history' },
  { to: '/leaderboard', key: 'nav.leaderboard' },
  { to: '/chat', key: 'nav.chat' },
  { to: '/profile', key: 'nav.profile' },
  { to: '/settings', key: 'nav.settings' },
];

export default function DashboardLayout({ user, onLogout }) {
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const linkClass = (to) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-spring',
    location.pathname === to
      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-clay'
      : 'text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-page-light dark:bg-page-dark">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-black/[0.04] dark:border-white/[0.06] transform transition-transform duration-300 ease-spring md:relative md:translate-x-0 md:flex md:flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="flex items-center justify-between px-5 py-6">
            <Link to="/dashboard" className="flex items-center gap-2.5 text-xl font-bold text-primary-500">
              <GraduationCap className="w-8 h-8" weight="fill" />
              <span>Mr Ole</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" className="md:hidden p-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">
              <X className="w-5 h-5 text-gray-500" weight="regular" />
            </button>
          </div>
          <nav className="flex-1 px-3 space-y-0.5">
            {sidebarLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {t(link.key)}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={linkClass('/admin')}>
                <Shield className="w-4 h-4" weight="fill" /> Panel Admin
              </Link>
            )}
          </nav>
          <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] w-full transition-all duration-200 ease-spring"
            >
              {t('nav.logout')}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 py-3 flex items-center justify-between shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold text-primary-500">
              <GraduationCap className="w-6 h-6" weight="fill" />
              <span>Mr Ole</span>
            </Link>
            <button onClick={() => setSidebarOpen(true)} aria-label="Buka menu navigasi" className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">
              <List className="w-6 h-6 text-gray-600 dark:text-gray-400" weight="regular" />
            </button>
          </div>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
