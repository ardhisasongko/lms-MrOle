import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, History, MessageSquare, User, Settings, GraduationCap, Trophy } from 'lucide-react';
import { cn } from '../../utils/cn';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/practice', label: 'Latihan', icon: BookOpen },
  { to: '/history', label: 'Riwayat', icon: History },
  { to: '/leaderboard', label: 'Peringkat', icon: Trophy },
  { to: '/chat', label: 'AI Chat', icon: MessageSquare },
  { to: '/profile', label: 'Profil', icon: User },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
];

export default function DashboardLayout({ user, onLogout }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary-600">
            <GraduationCap className="w-8 h-8" />
            <span>Mr Ole</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full"
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
          <div className="flex gap-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'p-2 rounded-lg',
                    isActive ? 'text-primary-600' : 'text-gray-500'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </div>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
