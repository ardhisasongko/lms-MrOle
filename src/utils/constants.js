export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const DIFFICULTY_LABEL = {
  [DIFFICULTY.EASY]: 'Mudah',
  [DIFFICULTY.MEDIUM]: 'Sedang',
  [DIFFICULTY.HARD]: 'Sulit',
};

export const QUESTION_TYPE = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SHORT_ANSWER: 'short_answer',
};

export const CATEGORIES = [
  { id: 'grammar', name: 'Grammar', slug: 'grammar', icon: 'BookOpen' },
  { id: 'vocabulary', name: 'Vocabulary', slug: 'vocabulary', icon: 'Book' },
  { id: 'reading', name: 'Reading', slug: 'reading', icon: 'FileText' },
  { id: 'listening', name: 'Listening', slug: 'listening', icon: 'Headphones' },
  { id: 'speaking', name: 'Speaking', slug: 'speaking', icon: 'Mic' },
  { id: 'writing', name: 'Writing', slug: 'writing', icon: 'PenTool' },
];

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY: '/verify',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PRACTICE: '/practice',
  PRACTICE_CATEGORY: '/practice/:categoryId',
  QUIZ_RESULT: '/practice/:attemptId/result',
  HISTORY: '/history',
  CHAT: '/chat',
  LEADERBOARD: '/leaderboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  ADMIN_QUESTIONS: '/admin/questions',
  ADMIN_CATEGORIES: '/admin/categories',
  ERROR: '/error',
};
