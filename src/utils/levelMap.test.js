import { describe, expect, it } from 'vitest';
import { PASS_SCORE, aggregateLevelProgress, buildLevelMap } from './levelMap';

const categories = [
  { id: 'cat-grammar', name: 'Tata Bahasa' },
  { id: 'cat-vocab', name: 'Kosakata' },
];
const attempt = (category_id, difficulty, score) => ({ category_id, difficulty, score });
const statuses = (map, id) => map.find((c) => c.id === id).levels.map((l) => l.status);

describe('aggregateLevelProgress', () => {
  it('keeps the best score and marks a pass at the threshold', () => {
    const progress = aggregateLevelProgress([
      attempt('cat-grammar', 'easy', 40),
      attempt('cat-grammar', 'easy', PASS_SCORE),
      attempt('cat-grammar', 'easy', 55),
    ]);
    expect(progress['cat-grammar:easy']).toEqual({ bestScore: PASS_SCORE, attempts: 3, passed: true });
  });

  it('ignores malformed rows and unknown difficulties', () => {
    const progress = aggregateLevelProgress([
      attempt('cat-grammar', 'extreme', 100),
      { category_id: 'cat-grammar', difficulty: 'easy', score: 'abc' },
      null,
      attempt(null, 'easy', 90),
    ]);
    expect(progress).toEqual({});
    expect(aggregateLevelProgress(undefined)).toEqual({});
  });
});

describe('buildLevelMap', () => {
  it('opens only level 1 when there is no progress', () => {
    const map = buildLevelMap(categories, []);
    expect(statuses(map, 'cat-grammar')).toEqual(['unlocked', 'locked', 'locked']);
    expect(statuses(map, 'cat-vocab')).toEqual(['unlocked', 'locked', 'locked']);
    expect(map[0].levels[0].bestScore).toBeNull();
  });

  it('unlocks level 2 after passing level 1, level 3 stays locked', () => {
    const map = buildLevelMap(categories, [attempt('cat-grammar', 'easy', 85)]);
    expect(statuses(map, 'cat-grammar')).toEqual(['completed', 'unlocked', 'locked']);
    expect(map[0].levels[0].bestScore).toBe(85);
  });

  it('unlocks level 3 after passing levels 1 and 2', () => {
    const map = buildLevelMap(categories, [
      attempt('cat-grammar', 'easy', 70),
      attempt('cat-grammar', 'medium', 100),
    ]);
    expect(statuses(map, 'cat-grammar')).toEqual(['completed', 'completed', 'unlocked']);
  });

  it('does not unlock the next level below the pass score', () => {
    const map = buildLevelMap(categories, [attempt('cat-grammar', 'easy', PASS_SCORE - 1)]);
    expect(statuses(map, 'cat-grammar')).toEqual(['unlocked', 'locked', 'locked']);
    expect(map[0].levels[0].attempts).toBe(1);
  });

  it('keeps progress independent per category', () => {
    const map = buildLevelMap(categories, [
      attempt('cat-grammar', 'easy', 90),
      attempt('cat-grammar', 'medium', 90),
      attempt('cat-grammar', 'hard', 90),
    ]);
    expect(statuses(map, 'cat-grammar')).toEqual(['completed', 'completed', 'completed']);
    expect(statuses(map, 'cat-vocab')).toEqual(['unlocked', 'locked', 'locked']);
  });

  it('handles empty categories', () => {
    expect(buildLevelMap([], [attempt('cat-grammar', 'easy', 90)])).toEqual([]);
    expect(buildLevelMap(undefined, undefined)).toEqual([]);
  });
});
