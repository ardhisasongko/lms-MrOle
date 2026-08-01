import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowsClockwise,
  CalendarBlank,
  CheckCircle,
  House,
  LockKey,
  Trophy,
  WarningCircle,
} from '@phosphor-icons/react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import AchievementCard from '../components/share/AchievementCard';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { getPublicQuizShare } from '../services/shares';

function formatDate(value, locale, t) {
  if (!value) return t('share.public.dateUnavailable');

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('share.public.dateUnavailable');

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function PublicQuizShare() {
  const { t, i18n } = useTranslation();
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [share, setShare] = useState(null);
  const [status, setStatus] = useState('loading');
  const [requestKey, setRequestKey] = useState(0);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const shareUrl = window.location.href;

  useEffect(() => {
    const previousTitle = document.title;
    let description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute('content');
    const createdDescription = !description;

    if (!description) {
      description = document.createElement('meta');
      description.setAttribute('name', 'description');
      document.head.appendChild(description);
    }

    document.title = t('share.public.metadata.title');
    description.setAttribute(
      'content',
      t('share.public.metadata.description'),
    );

    return () => {
      document.title = previousTitle;
      if (createdDescription) {
        description.remove();
      } else if (previousDescription === null) {
        description.removeAttribute('content');
      } else {
        description.setAttribute('content', previousDescription);
      }
    };
  }, [t]);

  useEffect(() => {
    if (!share) return;
    const score = Math.round(Number(share.score) || 0);
    const category = share.categoryName || t('share.fallbackCategory');
    document.title = t('share.public.metadata.scoreTitle', { score });
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      t('share.public.metadata.scoreDescription', { category, score }),
    );
  }, [share, t]);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setShare(null);
      setStatus('not-found');
      return undefined;
    }

    setStatus('loading');
    getPublicQuizShare(token)
      .then((snapshot) => {
        if (cancelled) return;
        if (!snapshot) {
          setShare(null);
          setStatus('not-found');
          return;
        }

        setShare({
          token: snapshot.token,
          score: snapshot.score,
          correctAnswers: snapshot.correctAnswers,
          totalQuestions: snapshot.totalQuestions,
          categoryId: snapshot.categoryId,
          categoryName: snapshot.categoryName,
          difficulty: snapshot.difficulty,
          completedAt: snapshot.completedAt,
          createdAt: snapshot.createdAt,
          displayName: snapshot.showName && typeof snapshot.displayName === 'string'
            ? snapshot.displayName
            : null,
        });
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setShare(null);
          setStatus('error');
        }
      });

    return () => { cancelled = true; };
  }, [token, requestKey]);

  useEffect(() => {
    if (status !== 'ready') return undefined;

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
        if (!cancelled) toast.error(t('share.public.qrError'));
      });

    return () => { cancelled = true; };
  }, [shareUrl, status, t]);

  if (status === 'loading') {
    return (
      <div
        className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pt-32"
        role="status"
        aria-live="polite"
        aria-label={t('share.public.loadingAria')}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-100/70 via-page-light to-secondary-100/70 dark:from-primary-950/30 dark:via-page-dark dark:to-secondary-950/30" />
        <div className="relative grid w-full max-w-4xl items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <div className="space-y-4">
            <Skeleton className="h-7 w-36 rounded-full" />
            <Skeleton className="h-10 w-full max-w-md rounded-xl" />
            <Skeleton className="h-5 w-full max-w-lg rounded-lg" />
            <Skeleton className="h-5 w-4/5 max-w-md rounded-lg" />
            <Skeleton className="mt-8 h-12 w-full max-w-xs rounded-xl" />
          </div>
          <Skeleton className="mx-auto aspect-[4/5] w-full max-w-[360px] rounded-3xl" />
        </div>
        <span className="sr-only">{t('share.public.loading')}</span>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center sm:pt-32" aria-labelledby="share-not-found-title">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-100/60 via-page-light to-lavender-100/60 dark:from-primary-950/20 dark:via-page-dark dark:to-lavender-900/20" />
        <div className="relative w-full max-w-lg rounded-3xl bg-white/80 p-1.5 shadow-clay-xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-800/80 dark:ring-white/5">
          <div className="rounded-[1.125rem] bg-white px-6 py-10 dark:bg-gray-800 sm:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 shadow-clay dark:bg-primary-900/30 dark:text-primary-200">
              <Trophy size={30} weight="fill" aria-hidden="true" />
            </span>
            <h1 id="share-not-found-title" className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {t('share.public.notFound.title')}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {t('share.public.notFound.description')}
            </p>
            <Link
              to="/"
              className="mt-7 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-cta-500 px-6 py-3 text-sm font-semibold text-white shadow-clay transition-all duration-200 ease-spring hover:bg-cta-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2"
            >
              <House size={18} aria-hidden="true" />
              {t('share.public.backHome')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 pb-16 pt-28 text-center sm:pt-32" aria-labelledby="share-error-title" role="alert">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-secondary-100/60 via-page-light to-primary-100/60 dark:from-secondary-950/20 dark:via-page-dark dark:to-primary-950/20" />
        <div className="relative w-full max-w-lg rounded-3xl bg-white/80 p-1.5 shadow-clay-xl ring-1 ring-black/5 backdrop-blur-xl dark:bg-gray-800/80 dark:ring-white/5">
          <div className="rounded-[1.125rem] bg-white px-6 py-10 dark:bg-gray-800 sm:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-800 shadow-clay dark:bg-secondary-900/30 dark:text-secondary-200">
              <WarningCircle size={30} weight="fill" aria-hidden="true" />
            </span>
            <h1 id="share-error-title" className="mt-6 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {t('share.public.error.title')}
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              {t('share.public.error.description')}
            </p>
            <Button className="mt-7 gap-2" onClick={() => setRequestKey((key) => key + 1)}>
              <ArrowsClockwise size={18} aria-hidden="true" />
              {t('share.public.retry')}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  const categoryId = String(share.categoryId || '');
  const difficulty = String(share.difficulty || '');
  const query = new URLSearchParams({ difficulty, challenge: token }).toString();
  const challengePath = `/practice/${encodeURIComponent(categoryId)}?${query}`;
  const registerPath = `/register?next=${encodeURIComponent(challengePath)}`;
  const loginPath = `/login?next=${encodeURIComponent(challengePath)}`;
  const difficultyLabel = difficulty
    ? t(`share.difficulty.${difficulty}`, { defaultValue: difficulty })
    : t('share.difficulty.general');
  const dateLocale = i18n.resolvedLanguage?.startsWith('en') ? 'en-US' : 'id-ID';
  const completedDate = formatDate(share.completedAt || share.createdAt, dateLocale, t);

  const handleChallenge = () => {
    if (user) {
      navigate(challengePath);
      return;
    }

    try {
      sessionStorage.setItem('mr-ole-next', challengePath);
    } catch {
      toast.error(t('share.public.destinationError'));
    }
    navigate(registerPath);
  };

  const preserveLoginDestination = () => {
    try {
      sessionStorage.setItem('mr-ole-next', challengePath);
    } catch {
      // The encoded next parameter still preserves the internal destination.
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:pt-36">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-100/80 via-page-light to-secondary-100/80 dark:from-primary-950/30 dark:via-page-dark dark:to-secondary-950/30" />
      <div className="pointer-events-none absolute -left-24 top-40 h-64 w-64 rounded-full bg-primary-300/30 blur-3xl dark:bg-primary-800/20" />
      <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-secondary-300/30 blur-3xl dark:bg-secondary-800/20" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-lavender-300/20 blur-3xl dark:bg-lavender-800/10" />

      <section className="relative mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-16" aria-labelledby="public-achievement-title">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary-800 shadow-clay ring-1 ring-black/5 backdrop-blur-sm dark:bg-gray-800/75 dark:text-primary-200 dark:ring-white/5">
            <CheckCircle size={16} weight="fill" aria-hidden="true" />
            {t('share.public.verified')}
          </div>

          <h1 id="public-achievement-title" className="mt-6 text-3xl font-semibold leading-tight tracking-tight text-gray-900 dark:text-gray-100 sm:text-[2.5rem]">
            {t('share.public.heroTitle')}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-gray-600 dark:text-gray-300 sm:text-lg">
            <Trans
              i18nKey="share.public.heroDescription"
              values={{ category: share.categoryName || t('share.fallbackCategory') }}
              components={{ category: <strong className="font-semibold text-gray-800 dark:text-gray-100" /> }}
            />
          </p>

          <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <CalendarBlank size={18} className="text-secondary-700 dark:text-secondary-300" aria-hidden="true" />
              <dt className="sr-only">{t('share.public.completedDate')}</dt>
              <dd>{completedDate}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-primary-700 dark:text-primary-300" weight="fill" aria-hidden="true" />
              <dt className="sr-only">{t('share.public.difficulty')}</dt>
              <dd>{difficultyLabel}</dd>
            </div>
          </dl>

          <div className="mt-8 max-w-md">
            <Button
              size="lg"
              className="w-full gap-2 text-base sm:w-auto"
              onClick={handleChallenge}
              disabled={authLoading || !categoryId}
            >
              {t('share.public.tryChallenge')}
              <ArrowRight size={19} weight="bold" aria-hidden="true" />
            </Button>
            {!user && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                {t('share.public.haveAccount')}{' '}
                <Link
                  to={loginPath}
                  onClick={preserveLoginDestination}
                  className="inline-flex min-h-[44px] items-center font-semibold text-primary-700 underline decoration-primary-300 underline-offset-4 transition-colors hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 dark:text-primary-300 dark:hover:text-primary-200"
                >
                  {t('share.public.loginToStart')}
                </Link>
              </p>
            )}
          </div>

          <p className="mt-7 flex max-w-lg items-start gap-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            <LockKey className="mt-0.5 shrink-0 text-cta-600 dark:text-cta-400" size={17} weight="fill" aria-hidden="true" />
            {t('share.public.privacy')}
          </p>
        </div>

        <div className="order-first mx-auto w-full max-w-[360px] lg:order-last">
          <div className="rounded-3xl bg-white/75 p-1.5 shadow-clay-xl ring-1 ring-black/5 backdrop-blur-sm dark:bg-gray-800/75 dark:ring-white/5">
            <div className="overflow-hidden rounded-[1.125rem]">
              <AchievementCard share={share} shareUrl={shareUrl} qrDataUrl={qrDataUrl} />
            </div>
          </div>
          <p className="mt-4 text-center text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {t('share.public.qrHint')}
          </p>
        </div>
      </section>
    </div>
  );
}
