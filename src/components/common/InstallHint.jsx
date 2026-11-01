import { useTranslation } from 'react-i18next';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { cn } from '../../utils/cn';

// Baner kecil petunjuk memasang PWA. Hanya tampil bila browser benar-benar
// menawarkan pemasangan (beforeinstallprompt) dan pengguna belum pernah
// menutupnya — setelah dipasang/ditutup tidak muncul lagi.
export default function InstallHint({ className }) {
  const { t } = useTranslation();
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-surface-light dark:bg-surface-dark ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-clay p-4',
        className,
      )}
      role="region"
      aria-label={t('pwa.install.title')}
    >
      <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-500 text-white flex items-center justify-center">
        <DownloadSimple className="w-5 h-5" weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('pwa.install.title')}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('pwa.install.description')}</p>
      </div>
      <button
        onClick={promptInstall}
        className="shrink-0 inline-flex items-center justify-center px-4 min-h-[44px] rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all duration-200 ease-spring active:scale-[0.98]"
      >
        {t('pwa.install.button')}
      </button>
      <button
        onClick={dismiss}
        aria-label={t('pwa.install.dismiss')}
        className="shrink-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring"
      >
        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" weight="regular" />
      </button>
    </div>
  );
}
