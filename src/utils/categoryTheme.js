import {
  BookOpen,
  BookOpenText,
  Headphones,
  Microphone,
  PencilLine,
  TextAa,
  Translate,
} from '@phosphor-icons/react';

/**
 * Tema visual per kategori belajar — satu-satunya sumber warna & ikon kategori.
 * Dipakai konsisten di kartu Practice, peta level, Dashboard, dan Landing
 * supaya kategori yang sama selalu tampil dengan warna & ikon yang sama.
 * Semua kelas ditulis literal (tidak digabung dinamis) agar terbaca Tailwind.
 */
export const CATEGORY_THEMES = {
  grammar: {
    icon: TextAa,
    chip: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    chipActive: 'bg-violet-500 text-white shadow-clay',
    ring: 'ring-violet-400/70 dark:ring-violet-500/50',
    ringSoft: 'ring-violet-300/60 dark:ring-violet-500/40',
    solid: 'bg-violet-500',
    bar: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
  },
  vocabulary: {
    icon: Translate,
    chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    chipActive: 'bg-amber-500 text-white shadow-clay',
    ring: 'ring-amber-400/70 dark:ring-amber-500/50',
    ringSoft: 'ring-amber-300/60 dark:ring-amber-500/40',
    solid: 'bg-amber-500',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  reading: {
    icon: BookOpenText,
    chip: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    chipActive: 'bg-sky-500 text-white shadow-clay',
    ring: 'ring-sky-400/70 dark:ring-sky-500/50',
    ringSoft: 'ring-sky-300/60 dark:ring-sky-500/40',
    solid: 'bg-sky-500',
    bar: 'bg-sky-500',
    text: 'text-sky-600 dark:text-sky-400',
  },
  listening: {
    icon: Headphones,
    chip: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300',
    chipActive: 'bg-teal-500 text-white shadow-clay',
    ring: 'ring-teal-400/70 dark:ring-teal-500/50',
    ringSoft: 'ring-teal-300/60 dark:ring-teal-500/40',
    solid: 'bg-teal-500',
    bar: 'bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
  },
  speaking: {
    icon: Microphone,
    chip: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    chipActive: 'bg-rose-500 text-white shadow-clay',
    ring: 'ring-rose-400/70 dark:ring-rose-500/50',
    ringSoft: 'ring-rose-300/60 dark:ring-rose-500/40',
    solid: 'bg-rose-500',
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
  },
  writing: {
    icon: PencilLine,
    chip: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
    chipActive: 'bg-indigo-500 text-white shadow-clay',
    ring: 'ring-indigo-400/70 dark:ring-indigo-500/50',
    ringSoft: 'ring-indigo-300/60 dark:ring-indigo-500/40',
    solid: 'bg-indigo-500',
    bar: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
};

const FALLBACK_THEME = { ...CATEGORY_THEMES.reading, icon: BookOpen };

/**
 * Cari tema dari slug atau nama kategori (mis. 'grammar', 'Grammar',
 * 'Reading Comprehension'). Kategori tak dikenal memakai tema netral sky.
 */
export function getCategoryTheme(key) {
  if (!key) return FALLBACK_THEME;
  const normalized = String(key).toLowerCase();
  for (const [slug, theme] of Object.entries(CATEGORY_THEMES)) {
    if (normalized.includes(slug)) return theme;
  }
  return FALLBACK_THEME;
}
