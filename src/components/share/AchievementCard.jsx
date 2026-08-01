import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  Clock,
  GraduationCap,
  SealCheck,
  Sparkle,
  Target,
} from '@phosphor-icons/react';

function formatDuration(duration, t) {
  if (duration === null || duration === undefined || duration === '') return null;
  if (typeof duration !== 'number') return duration;

  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return minutes
    ? t('share.duration.minutesSeconds', { minutes, seconds })
    : t('share.duration.seconds', { seconds });
}

function getReadableUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    return url.host;
  } catch {
    return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

const AchievementCard = forwardRef(function AchievementCard(
  { share = {}, shareUrl, qrDataUrl, format = 'feed', className = '' },
  ref,
) {
  const { t } = useTranslation();
  const score = Math.round(Number(share.score) || 0);
  const correct = Number(share.correct ?? share.correctAnswers) || 0;
  const total = Number(share.total ?? share.totalQuestions) || 0;
  const category = share.category?.name || share.categoryName || share.category || t('share.fallbackCategory');
  const difficulty = share.difficulty
    ? t(`share.difficulty.${share.difficulty}`, { defaultValue: share.difficulty })
    : t('share.difficulty.general');
  const duration = formatDuration(share.duration ?? share.durationSeconds, t);
  const url = shareUrl || share.url || '';
  const readableUrl = getReadableUrl(url);

  if (format === 'story') {
    const scoreLevel = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';

    return (
      <article
        ref={ref}
        data-share-format="story"
        className={`relative aspect-[9/16] w-full overflow-hidden bg-gradient-to-br from-primary-100 via-secondary-100 to-lavender-100 font-sans text-gray-900 ${className}`}
        aria-label={t('share.card.ariaLabel', { score })}
      >
        <div className="absolute -left-20 top-40 h-64 w-64 rounded-full bg-primary-300/55 blur-3xl" />
        <div className="absolute -right-20 top-4 h-64 w-64 rounded-full bg-secondary-300/65 blur-3xl" />
        <div className="absolute -bottom-16 left-12 h-72 w-72 rounded-full bg-lavender-300/55 blur-3xl" />

        <div className="relative flex h-full flex-col px-6 pb-12 pt-14">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-primary-600 shadow-clay ring-1 ring-black/5">
                <GraduationCap size={22} weight="fill" aria-hidden="true" />
              </span>
              <div>
                <p className="text-base font-semibold leading-5 tracking-tight">{t('share.brandName')}</p>
                <p className="text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.08em] text-gray-500">{t('share.card.achievement')}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary-50/90 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-secondary-800 ring-1 ring-secondary-200">
              <SealCheck size={14} weight="fill" aria-hidden="true" />
              {t('share.card.verified')}
            </span>
          </header>

          <section className="mt-4 text-center">
            <p className="text-xs font-semibold uppercase leading-4 tracking-[0.12em] text-primary-700">
              {t(`share.card.story.status.${scoreLevel}`)}
            </p>
            <div className="mt-1 flex items-end justify-center gap-2">
              <strong className="text-[4.5rem] font-semibold leading-none tracking-[-0.07em] text-primary-700 tabular-nums">
                {score}
              </strong>
              <span className="mb-2 text-left text-sm font-semibold text-gray-500">
                <span className="block">/ 100</span>
                <span className="mt-1 block text-[0.6875rem] uppercase tracking-[0.1em]">{t('share.card.story.points')}</span>
              </span>
            </div>
            {share.displayName && (
              <p className="mt-2 whitespace-nowrap text-sm font-semibold leading-5 text-gray-700">{share.displayName}</p>
            )}
          </section>

          <section className="mt-6 rounded-2xl bg-white/80 p-1.5 shadow-clay-lg ring-1 ring-black/5">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-white/75 px-4 py-3 shadow-inner-soft">
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.06em] text-gray-500">{t('share.card.category')}</p>
                <p className="mt-0.5 whitespace-nowrap text-sm font-semibold leading-5 text-gray-800">{category}</p>
                <p className="text-xs leading-4 text-gray-500">{difficulty}</p>
              </div>
              <div className="border-l border-black/[0.06] pl-3">
                <p className="text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.06em] text-gray-500">{t('share.card.result')}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold leading-5 text-gray-800 tabular-nums">
                  <CheckCircle size={15} weight="fill" className="text-secondary-700" aria-hidden="true" />
                  {t('share.card.correct', { correct, total })}
                </p>
                {duration && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs leading-4 text-gray-500 tabular-nums">
                    <Clock size={13} aria-hidden="true" /> {duration}
                  </p>
                )}
              </div>
            </div>
          </section>

          <p className="mx-auto mt-1 max-w-[17rem] text-center text-sm font-semibold leading-5 text-gray-700">
            {t(`share.card.story.message.${scoreLevel}`)}
          </p>

          <footer className="mt-auto flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <div className="rounded-2xl bg-cta-500 px-4 py-3 text-white shadow-clay-lg">
                <p className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
                  <Target size={17} weight="bold" aria-hidden="true" />
                  {t('share.card.story.challenge')}
                </p>
                <p className="mt-1 text-[0.6875rem] leading-4 text-white/90">{t('share.card.story.challengePrompt')}</p>
              </div>
              {readableUrl && (
                <p className="mt-2 whitespace-nowrap text-[0.6875rem] font-semibold leading-4 text-gray-600">{readableUrl}</p>
              )}
            </div>
            <div className="shrink-0 text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white p-2 shadow-clay-lg ring-1 ring-black/5">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={t('share.card.qrAlt', { destination: readableUrl || t('share.brandName') })}
                    width="96"
                    height="96"
                    className="h-24 w-24"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-lg bg-gray-100" aria-hidden="true" />
                )}
              </div>
              <p className="mt-1 text-[0.6875rem] font-semibold leading-4 text-gray-600">{t('share.card.story.scanHint')}</p>
            </div>
          </footer>
        </div>
      </article>
    );
  }

  return (
    <article
      ref={ref}
      data-share-format="feed"
      className={`relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-br from-primary-100 via-secondary-100 to-lavender-100 font-sans text-gray-900 ${className}`}
      aria-label={t('share.card.ariaLabel', { score })}
    >
      <div className="absolute -left-16 top-24 h-48 w-48 rounded-full bg-primary-300/50 blur-3xl" />
      <div className="absolute -right-16 -top-12 h-56 w-56 rounded-full bg-secondary-300/60 blur-3xl" />
      <div className="absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-lavender-300/50 blur-3xl" />

      <div className="relative flex h-full flex-col p-5">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-primary-600 shadow-clay ring-1 ring-black/5">
              <GraduationCap size={20} weight="fill" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-5 tracking-tight">{t('share.brandName')}</p>
              <p className="text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.08em] text-gray-500">{t('share.card.achievement')}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-50/90 px-2.5 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-secondary-800 ring-1 ring-secondary-200">
            <SealCheck size={14} weight="fill" aria-hidden="true" />
            {t('share.card.verified')}
          </span>
        </header>

        <section className="mt-4 rounded-3xl bg-white/85 p-1.5 shadow-clay-xl ring-1 ring-black/5">
          <div className="relative overflow-hidden rounded-[1.125rem] bg-white px-5 py-4 shadow-inner-soft">
            <Sparkle className="absolute right-4 top-4 text-lavender-300" size={24} weight="fill" aria-hidden="true" />
            <p className="text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.08em] text-gray-500">{t('share.card.finalScore')}</p>
            <div className="mt-1 flex items-end gap-2">
              <strong className="text-[3.5rem] font-semibold leading-none tracking-[-0.06em] text-primary-700 tabular-nums">
                {score}
              </strong>
              <span className="mb-1.5 text-sm font-semibold text-gray-400">/ 100</span>
            </div>
            {share.displayName && (
              <p className="mt-2 whitespace-nowrap text-sm font-semibold leading-5 text-gray-700">{share.displayName}</p>
            )}
          </div>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/75 px-3 py-2.5 shadow-clay ring-1 ring-black/5">
            <p className="text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.06em] text-gray-500">{t('share.card.category')}</p>
            <p className="mt-0.5 whitespace-nowrap text-sm font-semibold leading-5 text-gray-800">{category}</p>
            <p className="text-xs leading-4 text-gray-500">{difficulty}</p>
          </div>
          <div className="rounded-2xl bg-white/75 px-3 py-2.5 shadow-clay ring-1 ring-black/5">
            <p className="text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.06em] text-gray-500">{t('share.card.result')}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold leading-5 text-gray-800 tabular-nums">
              <CheckCircle size={15} weight="fill" className="text-secondary-700" aria-hidden="true" />
              {t('share.card.correct', { correct, total })}
            </p>
            {duration && (
              <p className="mt-0.5 flex items-center gap-1 text-xs leading-4 text-gray-500 tabular-nums">
                <Clock size={13} aria-hidden="true" /> {duration}
              </p>
            )}
          </div>
        </div>

        <footer className="mt-auto flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <div className="rounded-2xl bg-cta-500 px-3 py-2.5 text-white shadow-clay-lg">
              <p className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
                <Target size={17} weight="bold" aria-hidden="true" />
                {t('share.card.challenge')}
              </p>
              <p className="mt-0.5 text-[0.6875rem] leading-4 text-white/90">{t('share.card.challengePrompt')}</p>
            </div>
            {readableUrl && (
              <p className="mt-2 whitespace-nowrap text-[0.6875rem] font-semibold leading-4 text-gray-600">{readableUrl}</p>
            )}
          </div>
          <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-clay-lg ring-1 ring-black/5">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={t('share.card.qrAlt', { destination: readableUrl || t('share.brandName') })}
                width="60"
                height="60"
                className="h-[60px] w-[60px]"
              />
            ) : (
              <div className="h-[60px] w-[60px] rounded-lg bg-gray-100" aria-hidden="true" />
            )}
          </div>
        </footer>
      </div>
    </article>
  );
});

export default AchievementCard;
