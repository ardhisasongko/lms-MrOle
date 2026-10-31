import { describe, expect, it } from 'vitest';
import { buildDailyMissions, getDailyMissions, getTodayActivity } from './missions';

const NOW = new Date('2026-08-01T10:00:00.000Z');
const attempt = (overrides = {}) => ({
  total_questions: 20,
  score: 70,
  completed_at: '2026-08-01T08:30:00.000Z',
  ...overrides,
});

describe('getTodayActivity', () => {
  it('returns zeros when there is no activity', () => {
    expect(getTodayActivity([], NOW)).toEqual({ quizzes: 0, questions: 0, bestScore: 0 });
    expect(getTodayActivity(undefined, NOW)).toEqual({ quizzes: 0, questions: 0, bestScore: 0 });
  });

  it('ignores attempts from other days and malformed rows', () => {
    const attempts = [
      attempt(),
      attempt({ completed_at: '2026-07-31T23:30:00.000Z', score: 100 }),
      { completed_at: null, total_questions: 20, score: 90 },
      null,
    ];
    expect(getTodayActivity(attempts, NOW)).toEqual({ quizzes: 1, questions: 20, bestScore: 70 });
  });

  it('sums questions and takes the best score of the day', () => {
    const attempts = [
      attempt({ total_questions: 20, score: 65 }),
      attempt({ total_questions: 10, score: 92 }),
    ];
    expect(getTodayActivity(attempts, NOW)).toEqual({ quizzes: 2, questions: 30, bestScore: 92 });
  });
});

describe('buildDailyMissions', () => {
  it('shows zero progress for every mission without activity', () => {
    const missions = buildDailyMissions({ quizzes: 0, questions: 0, bestScore: 0 });
    expect(missions).toHaveLength(3);
    expect(missions.every((m) => !m.done && m.progress === 0 && m.percent === 0)).toBe(true);
  });

  it('tracks partial progress and caps progress at the target', () => {
    const missions = buildDailyMissions({ quizzes: 1, questions: 4, bestScore: 60 });
    const byId = Object.fromEntries(missions.map((m) => [m.id, m]));
    expect(byId.complete_quiz).toMatchObject({ progress: 1, percent: 100, done: true });
    expect(byId.answer_questions).toMatchObject({ progress: 4, percent: 40, done: false });
    expect(byId.best_score).toMatchObject({ progress: 60, percent: 75, done: false });
  });

  it('marks every mission done when all targets are met', () => {
    const missions = buildDailyMissions({ quizzes: 3, questions: 45, bestScore: 95 });
    expect(missions.every((m) => m.done && m.percent === 100)).toBe(true);
  });
});

describe('getDailyMissions', () => {
  it('combines activity and missions end to end', () => {
    const result = getDailyMissions([attempt({ score: 85 })], NOW);
    expect(result.activity).toEqual({ quizzes: 1, questions: 20, bestScore: 85 });
    expect(result.completedCount).toBe(3);
    expect(result.allDone).toBe(true);
  });

  it('reports nothing completed on a fresh day', () => {
    const result = getDailyMissions([], NOW);
    expect(result.completedCount).toBe(0);
    expect(result.allDone).toBe(false);
  });
});
