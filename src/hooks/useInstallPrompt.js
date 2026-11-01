import { useCallback, useEffect, useState } from 'react';

const DISMISS_KEY = 'mr-ole-install-dismissed';

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;
  const byDisplayMode = typeof window.matchMedia === 'function'
    && window.matchMedia('(display-mode: standalone)').matches;
  return byDisplayMode || window.navigator?.standalone === true;
}

// Menangkap event beforeinstallprompt (Chrome Android) agar situs bisa
// dipasang sebagai PWA — setelah dipasang, situs selalu terbuka layar
// penuh mengikuti manifest (display: fullscreen). Petunjuk hanya tampil
// sekali: hilang permanen setelah dipasang atau ditutup pengguna.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(detectStandalone);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const onAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    let outcome = null;
    try {
      const choice = await deferredPrompt.userChoice;
      outcome = choice?.outcome ?? null;
    } catch {
      outcome = null;
    }
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Penyimpanan tidak tersedia — cukup disembunyikan untuk sesi ini.
      setDismissed(true);
    }
  }, []);

  const canInstall = !!deferredPrompt && !installed && !dismissed;

  return { canInstall, installed, promptInstall, dismiss };
}
