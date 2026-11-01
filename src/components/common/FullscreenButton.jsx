import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowsIn, ArrowsOut } from '@phosphor-icons/react';
import { isFullscreenActive, isFullscreenSupported, toggleFullscreen } from '../../utils/fullscreen';
import { cn } from '../../utils/cn';

// Tombol layar penuh global (header & sidebar). Memakai Fullscreen API —
// wajib dipicu gestur pengguna, jadi bentuknya tombol, bukan otomatis.
// Otomatis tersembunyi di browser tanpa dukungan (mis. iPhone Safari).
export default function FullscreenButton({ variant = 'icon', className }) {
  const { t } = useTranslation();
  const [supported] = useState(() => isFullscreenSupported());
  const [active, setActive] = useState(() => isFullscreenActive());

  useEffect(() => {
    if (!supported) return undefined;
    const onChange = () => setActive(isFullscreenActive());
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [supported]);

  if (!supported) return null;

  const label = active ? t('nav.exitFullscreen') : t('nav.fullscreen');
  const Icon = active ? ArrowsIn : ArrowsOut;

  if (variant === 'row') {
    return (
      <button
        onClick={() => toggleFullscreen()}
        aria-pressed={active}
        className={cn(
          'flex min-h-[44px] items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] w-full transition-all duration-200 ease-spring',
          className,
        )}
      >
        <Icon className="w-4 h-4" /> {label}
      </button>
    );
  }

  return (
    <button
      onClick={() => toggleFullscreen()}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-all duration-200 ease-spring active:scale-[0.98]',
        className,
      )}
    >
      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" weight="regular" />
    </button>
  );
}
