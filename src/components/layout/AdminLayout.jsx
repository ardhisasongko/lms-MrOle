import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { GraduationCap, ArrowLeft, List, X } from '@phosphor-icons/react';
import { cn } from '../../utils/cn';

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/users', label: 'User' },
  { to: '/admin/questions', label: 'Soal' },
  { to: '/admin/categories', label: 'Kategori' },
];

export default function AdminLayout() {
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
    <div className="min-h-screen flex bg-page-light dark:bg-page-dark">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r border-black/[0.04] dark:border-white/[0.06] transform transition-transform duration-300 ease-spring md:relative md:translate-x-0 md:flex md:flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-start justify-between px-5 py-6">
          <div>
            <div className="flex items-center gap-2.5 text-xl font-bold text-primary-500">
              <GraduationCap className="w-8 h-8" weight="fill" />
              <span>Mr Ole</span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.08em] text-gray-400 mt-1.5 block">Panel Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} aria-label="Tutup menu" className="md:hidden p-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">
            <X className="w-5 h-5 text-gray-500" weight="regular" />
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {sidebarLinks.map((link) => (
            <Link key={link.to} to={link.to} className={linkClass(link.to)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.06]">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" weight="regular" /> Kembali ke Aplikasi
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.06] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" className="text-gray-500 p-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring" aria-label="Kembali ke Aplikasi">
              <ArrowLeft className="w-5 h-5" weight="regular" />
            </Link>
            <span className="font-semibold text-primary-500">Panel Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} aria-label="Buka menu navigasi" className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">
            <List className="w-6 h-6 text-gray-600 dark:text-gray-400" weight="regular" />
          </button>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
