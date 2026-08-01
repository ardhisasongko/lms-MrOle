import { useTranslation } from 'react-i18next';

export default function Stimulus({ children, content, type = 'text', className = '' }) {
  const { t } = useTranslation();
  const text = content ?? children;
  if (typeof text !== 'string' || !text.trim()) return null;

  const accessibleName = type === 'transcript'
    ? t('quiz.stimulus.transcriptAria')
    : t('quiz.stimulus.textAria');

  return (
    <section
      aria-label={accessibleName}
      className={`rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 ${className}`.trim()}
    >
      <p className="whitespace-pre-wrap">{text}</p>
    </section>
  );
}
