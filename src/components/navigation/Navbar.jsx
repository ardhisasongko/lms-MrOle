import { Link } from 'react-router-dom';
import { GraduationCap, SignOut, User, Moon, Sun, Shield } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAdmin } from '../../hooks/useAdmin';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark, toggle } = useDarkMode();
  const { t } = useTranslation();
  const { isAdmin } = useAdmin();

  return (
    <nav className="sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="flex items-center justify-between h-16 px-5 rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-white/10 shadow-clay">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-500">
            <GraduationCap className="w-7 h-7" weight="fill" />
            <span>Mr Ole</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <LanguageSwitcher />
            <button
              onClick={toggle}
              aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
              className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring"
            >
              {isDark ? <Sun className="w-5 h-5 text-gray-400" weight="regular" /> : <Moon className="w-5 h-5 text-gray-600" weight="regular" />}
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring">
                  {t('nav.dashboard')}
                </Link>
                <Link to="/practice" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring">
                  {t('nav.practice')}
                </Link>
                <Link to="/history" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring">
                  {t('nav.history')}
                </Link>
                <Link to="/leaderboard" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring">
                  {t('nav.leaderboard')}
                </Link>
                <Link to="/chat" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring">
                  {t('nav.chat')}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-500 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring flex items-center gap-1.5">
                    <Shield className="w-4 h-4" weight="fill" />
                    Admin
                  </Link>
                )}
                <Link to="/profile" aria-label={t('nav.profile')} className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" weight="regular" />
                </Link>
                <button onClick={onLogout} aria-label={t('nav.logout')} className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">
                  <SignOut className="w-5 h-5 text-gray-600 dark:text-gray-400" weight="regular" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-xl bg-cta-500 text-white hover:bg-cta-600 shadow-clay transition-all duration-200 ease-spring active:scale-[0.98] min-h-[44px]">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Tutup menu' : 'Buka menu'}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring"
          >
            <div className="relative w-5 h-5">
              <span className={`absolute block w-5 h-px bg-gray-600 dark:bg-gray-400 transition-all duration-300 ease-spring ${isOpen ? 'top-1/2 rotate-45' : 'top-1'}`} />
              <span className={`absolute block w-5 h-px bg-gray-600 dark:bg-gray-400 transition-all duration-300 ease-spring ${isOpen ? 'opacity-0' : 'top-1/2 -translate-y-1/2'}`} />
              <span className={`absolute block w-5 h-px bg-gray-600 dark:bg-gray-400 transition-all duration-300 ease-spring ${isOpen ? 'top-1/2 -rotate-45' : 'bottom-1'}`} />
            </div>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden fixed inset-0 top-0 z-40 backdrop-blur-3xl bg-white/80 dark:bg-gray-900/80 pt-24 px-6">
          <div className="flex flex-col gap-2">
            <LanguageSwitcher isMobile />
            <button
              onClick={toggle}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm w-full hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring text-gray-700 dark:text-gray-300"
            >
              {isDark ? <Sun className="w-5 h-5" weight="regular" /> : <Moon className="w-5 h-5" weight="regular" />}
              {isDark ? t('nav.lightMode') : t('nav.darkMode')}
            </button>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">{t('nav.dashboard')}</Link>
                <Link to="/practice" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">{t('nav.practice')}</Link>
                <Link to="/history" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">{t('nav.history')}</Link>
                <Link to="/chat" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">{t('nav.chat')}</Link>
                <Link to="/leaderboard" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">{t('nav.leaderboard')}</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring flex items-center gap-2">
                    <Shield className="w-4 h-4" weight="fill" />
                    Panel Admin
                  </Link>
                )}
                <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">{t('nav.profile')}</Link>
                <button onClick={() => { onLogout(); setIsOpen(false); }} className="block w-full text-left px-4 py-3 rounded-xl text-sm hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring">{t('nav.logout')}</button>
              </>
            ) : (
              <div className="flex gap-3 mt-2">
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1 flex items-center justify-center px-5 py-3 text-sm font-medium rounded-xl border border-black/[0.08] dark:border-white/[0.12] text-gray-700 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-all duration-200 ease-spring min-h-[44px]">
                  {t('nav.login')}
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="flex-1 flex items-center justify-center px-5 py-3 text-sm font-medium rounded-xl bg-cta-500 text-white hover:bg-cta-600 shadow-clay transition-all duration-200 ease-spring active:scale-[0.98] min-h-[44px]">
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
