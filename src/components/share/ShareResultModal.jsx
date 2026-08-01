import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, DownloadSimple, ShareNetwork, Trash, X } from '@phosphor-icons/react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import AchievementCard from './AchievementCard';

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export default function ShareResultModal({
  open,
  onClose,
  share = {},
  onShowNameChange,
  privacyLoading = false,
  onRevoke,
  revokeLoading = false,
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef(null);
  const exportRef = useRef(null);
  const generationRef = useRef(null);
  const blobRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const shareUrl = share.url || '';

  useEffect(() => {
    if (!open || !shareUrl) {
      setQrDataUrl('');
      return undefined;
    }

    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 240,
      color: { dark: '#1A1D26', light: '#FFFFFF' },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) toast.error(t('share.modal.error.qr'));
      });

    return () => { cancelled = true; };
  }, [open, shareUrl, t]);

  useEffect(() => {
    blobRef.current = null;
    generationRef.current = null;
    setConfirmRevoke(false);
  }, [qrDataUrl, share]);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => dialogRef.current?.focus());

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open, onClose]);

  const generatePng = async () => {
    if (blobRef.current) return blobRef.current;
    if (generationRef.current) return generationRef.current;
    if (!exportRef.current || !qrDataUrl) throw new Error(t('share.modal.error.previewNotReady'));

    setLoading(true);
    generationRef.current = (async () => {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: null,
        width: 360,
        height: 450,
        scale: 3,
        useCORS: true,
        logging: false,
      });
      if (canvas.width !== 1080 || canvas.height !== 1350) {
        throw new Error(t('share.modal.error.invalidImageSize'));
      }
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error(t('share.modal.error.imageGeneration'))), 'image/png');
      });
      blobRef.current = blob;
      return blob;
    })();

    try {
      return await generationRef.current;
    } finally {
      generationRef.current = null;
      setLoading(false);
    }
  };

  const filename = t('share.modal.filename', { score: Math.round(Number(share.score) || 0) });

  const handleDownload = async () => {
    try {
      const blob = await generatePng();
      downloadBlob(blob, filename);
      toast.success(t('share.modal.success.download'));
    } catch {
      toast.error(t('share.modal.error.imageRetry'));
    }
  };

  const handleNativeShare = async () => {
    try {
      const blob = await generatePng();
      const file = new File([blob], filename, { type: 'image/png' });
      const files = [file];

      if (navigator.share && navigator.canShare?.({ files })) {
        await navigator.share({
          title: t('share.modal.native.title'),
          text: t('share.modal.native.text'),
          url: shareUrl || undefined,
          files,
        });
        toast.success(t('share.modal.success.shared'));
        return;
      }

      downloadBlob(blob, filename);
      toast.success(t('share.modal.success.shareUnsupported'));
    } catch (error) {
      const cancelled = error?.name === 'AbortError' || /cancel(?:led|ed)/i.test(error?.message || '');
      if (!cancelled) toast.error(t('share.modal.error.shareRetry'));
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) {
      toast.error(t('share.modal.error.linkUnavailable'));
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('share.modal.success.linkCopied'));
    } catch {
      toast.error(t('share.modal.error.linkCopy'));
    }
  };

  if (!open) return null;

  const actionClass = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-spring active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const exportDisabled = loading || !qrDataUrl;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('share.modal.closeDialog')}
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[95dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-clay-xl outline-none dark:bg-gray-800 sm:max-w-4xl sm:rounded-3xl sm:p-6"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('share.modal.close')}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-gray-500 transition-all duration-200 ease-spring hover:bg-black/[0.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:text-gray-300 dark:hover:bg-white/[0.08]"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="pr-12">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {t('share.modal.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('share.modal.privacy')}
          </p>
        </div>

        <div className="mt-5 grid items-center gap-5 md:grid-cols-[minmax(0,360px)_1fr] md:gap-8">
          <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-3xl shadow-clay-xl ring-1 ring-black/5">
            <AchievementCard share={share} shareUrl={shareUrl} qrDataUrl={qrDataUrl} />
          </div>

          <div className="space-y-3">
            <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 rounded-xl border border-black/[0.08] px-4 py-2.5 text-sm text-gray-700 dark:border-white/[0.12] dark:text-gray-200">
              <span>
                <span className="block font-semibold">{t('share.modal.showFirstName')}</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500">{t('share.modal.anonymousHint')}</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(share.showName)}
                disabled={privacyLoading || !onShowNameChange}
                onChange={(event) => onShowNameChange?.(event.target.checked)}
                className="h-5 w-5 shrink-0 accent-cta-500"
              />
            </label>
            <button
              type="button"
              onClick={handleNativeShare}
              disabled={exportDisabled}
              className={`${actionClass} w-full bg-cta-500 text-white shadow-clay hover:bg-cta-600`}
            >
              <ShareNetwork size={19} weight="bold" aria-hidden="true" />
              {loading ? t('share.modal.preparingImage') : t('share.modal.shareImage')}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!shareUrl}
              className={`${actionClass} w-full bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-200 dark:hover:bg-primary-900/50`}
            >
              <Copy size={19} aria-hidden="true" />
              {t('share.modal.copyLink')}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={exportDisabled}
              className={`${actionClass} w-full border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700`}
            >
              <DownloadSimple size={19} aria-hidden="true" />
              {t('share.modal.downloadPng')}
            </button>
            <p className="text-center text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {t('share.modal.pngHint')}
            </p>
            {onRevoke && (
              <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
                {confirmRevoke ? (
                  <div className="space-y-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-900/20">
                    <p className="text-red-700 dark:text-red-300">{t('share.modal.revokeConfirmation')}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmRevoke(false)}
                        disabled={revokeLoading}
                        className={`${actionClass} flex-1 border border-red-200 text-red-700 dark:border-red-800 dark:text-red-300`}
                      >
                        {t('share.modal.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={onRevoke}
                        disabled={revokeLoading}
                        className={`${actionClass} flex-1 bg-red-600 text-white hover:bg-red-700`}
                      >
                        {revokeLoading ? t('share.modal.revoking') : t('share.modal.confirmRevoke')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmRevoke(true)}
                    className={`${actionClass} w-full text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/20`}
                  >
                    <Trash size={18} aria-hidden="true" />
                    {t('share.modal.revokeLink')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed left-[-10000px] top-0 h-[450px] w-[360px]" aria-hidden="true">
        <AchievementCard
          ref={exportRef}
          share={share}
          shareUrl={shareUrl}
          qrDataUrl={qrDataUrl}
          className="h-[450px] w-[360px]"
        />
      </div>
    </div>
  );
}
