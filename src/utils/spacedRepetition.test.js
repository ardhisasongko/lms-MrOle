import { describe, expect, it } from 'vitest';
import {
  REVIEW_INTERVALS_DAYS,
  applyReviewResult,
  buildReviewDeck,
  getNextReviewAt,
  isDue,
  isMastered,
  normalizeReviewItem,
} from './spacedRepetition';

const DAY = 24 * 60 * 60 * 1000;
const WRONG_AT = '2026-08-01T08:00:00.000Z';
const at = (days) => new Date(new Date(WRONG_AT).getTime() + days * DAY);

describe('getNextReviewAt & isDue', () => {
  it('schedules a fresh wrong answer at the first interval', () => {
    const item = normalizeReviewItem({ questionId: 'q1', lastWrongAt: WRONG_AT });
    expect(getNextReviewAt(item).toISOString()).toBe(at(REVIEW_INTERVALS_DAYS[0]).toISOString());
    expect(isDue(item, at(0))).toBe(false);
    expect(isDue(item, at(1))).toBe(true);
  });

  it('uses the stored stage interval and last review time', () => {
    const item = normalizeReviewItem(
      { questionId: 'q1', lastWrongAt: WRONG_AT },
      { stage: 2, lastReviewedAt: '2026-08-05T08:00:00.000Z' },
    );
    expect(item.stage).toBe(2);
    expect(getNextReviewAt(item).toISOString()).toBe('2026-08-12T08:00:00.000Z');
    expect(isDue(item, new Date('2026-08-11T08:00:00.000Z'))).toBe(false);
    expect(isDue(item, new Date('2026-08-12T08:00:00.000Z'))).toBe(true);
  });

  it('treats mastered items as never due', () => {
    const item = normalizeReviewItem({ questionId: 'q1', lastWrongAt: WRONG_AT }, { stage: 99 });
    expect(isMastered(item)).toBe(true);
    expect(getNextReviewAt(item)).toBeNull();
    expect(isDue(item, at(365))).toBe(false);
  });

  it('returns no schedule for items without any timestamp', () => {
    const item = normalizeReviewItem({ questionId: 'q1' });
    expect(getNextReviewAt(item)).toBeNull();
    expect(isDue(item, at(10))).toBe(false);
  });
});

describe('applyReviewResult', () => {
  it('moves one stage up when remembered and keeps the original untouched', () => {
    const item = normalizeReviewItem({ questionId: 'q1', lastWrongAt: WRONG_AT });
    const next = applyReviewResult(item, true, at(1));
    expect(next.stage).toBe(1);
    expect(next.lastReviewedAt).toBe(at(1).toISOString());
    expect(item.stage).toBe(0);
    // Jadwal berikutnya dihitung dari waktu review + interval tahap 1.
    expect(getNextReviewAt(next).toISOString()).toBe(at(1 + REVIEW_INTERVALS_DAYS[1]).toISOString());
  });

  it('resets to stage 0 when forgotten', () => {
    const item = normalizeReviewItem(
      { questionId: 'q1', lastWrongAt: WRONG_AT },
      { stage: 3, lastReviewedAt: WRONG_AT },
    );
    const next = applyReviewResult(item, false, at(20));
    expect(next.stage).toBe(0);
    expect(getNextReviewAt(next).toISOString()).toBe(at(20 + REVIEW_INTERVALS_DAYS[0]).toISOString());
  });

  it('caps at mastered after the last interval', () => {
    const item = normalizeReviewItem(
      { questionId: 'q1', lastWrongAt: WRONG_AT },
      { stage: REVIEW_INTERVALS_DAYS.length - 1, lastReviewedAt: WRONG_AT },
    );
    const next = applyReviewResult(item, true, at(30));
    expect(isMastered(next)).toBe(true);
    expect(isDue(next, at(365))).toBe(false);
  });
});

describe('buildReviewDeck', () => {
  const wrong = [
    { questionId: 'q1', lastWrongAt: WRONG_AT },
    { questionId: 'q2', lastWrongAt: '2026-08-03T08:00:00.000Z' },
    { questionId: 'q3', lastWrongAt: WRONG_AT },
    // Duplikat soal yang sama — kesalahan terbaru yang dipakai.
    { questionId: 'q1', lastWrongAt: '2026-08-02T08:00:00.000Z' },
  ];

  it('dedupes by question and keeps the latest wrong time', () => {
    const deck = buildReviewDeck(wrong, {}, at(0));
    expect(deck.totalCount).toBe(3);
    expect(deck.items.find((i) => i.questionId === 'q1').lastWrongAt).toBe('2026-08-02T08:00:00.000Z');
  });

  it('selects due items ordered by longest waiting first', () => {
    const deck = buildReviewDeck(wrong, {}, at(4));
    expect(deck.dueCount).toBe(3);
    expect(deck.dueItems.map((i) => i.questionId)).toEqual(['q3', 'q1', 'q2']);
  });

  it('respects stored review state when deciding what is due', () => {
    const state = { q3: { stage: 1, lastReviewedAt: '2026-08-03T08:00:00.000Z' } };
    const deck = buildReviewDeck(wrong, state, at(4));
    expect(deck.dueItems.map((i) => i.questionId)).not.toContain('q3');
    const q3 = deck.items.find((i) => i.questionId === 'q3');
    expect(q3.nextReviewAt.toISOString()).toBe('2026-08-06T08:00:00.000Z');
  });

  it('counts mastered items separately and handles empty input', () => {
    const state = { q1: { stage: 5, lastReviewedAt: WRONG_AT } };
    const deck = buildReviewDeck(wrong, state, at(40));
    expect(deck.masteredCount).toBe(1);
    expect(buildReviewDeck([], {}, at(0))).toEqual({
      items: [], dueItems: [], dueCount: 0, totalCount: 0, masteredCount: 0,
    });
    expect(buildReviewDeck(undefined, undefined, at(0)).totalCount).toBe(0);
  });
});
