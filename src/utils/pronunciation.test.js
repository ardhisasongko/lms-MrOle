import { describe, expect, it } from 'vitest';
import { normalizePronunciationText, scorePronunciation } from './pronunciation';

describe('normalizePronunciationText', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizePronunciationText('Hello, my name is Nadia!'))
      .toEqual(['hello', 'my', 'name', 'is', 'nadia']);
  });

  it('treats apostrophes as part of the word', () => {
    expect(normalizePronunciationText("I don't know."))
      .toEqual(['i', 'dont', 'know']);
  });

  it('returns an empty list for empty or non-string input', () => {
    expect(normalizePronunciationText('')).toEqual([]);
    expect(normalizePronunciationText(null)).toEqual([]);
    expect(normalizePronunciationText(undefined)).toEqual([]);
  });
});

describe('scorePronunciation', () => {
  it('gives 100 for a perfect match regardless of case and punctuation', () => {
    const result = scorePronunciation('Can I see the menu, please?', 'can i see the menu please');
    expect(result.score).toBe(100);
    expect(result.missedWords).toEqual([]);
    expect(result.matchedCount).toBe(6);
  });

  it('reports the words that were missed', () => {
    const result = scorePronunciation('I would like fried rice', 'I like rice');
    expect(result.score).toBe(60);
    expect(result.missedWords).toEqual(['would', 'fried']);
  });

  it('gives 0 when nothing was spoken', () => {
    const result = scorePronunciation('Thank you very much', '');
    expect(result.score).toBe(0);
    expect(result.missedWords).toEqual(['thank', 'you', 'very', 'much']);
  });

  it('does not count one spoken word twice for repeated target words', () => {
    const result = scorePronunciation('very very good', 'very good');
    expect(result.score).toBe(67);
    expect(result.missedWords).toEqual(['very']);
  });

  it('ignores extra spoken words beyond the target', () => {
    const result = scorePronunciation('Thank you', 'um thank you very much');
    expect(result.score).toBe(100);
    expect(result.missedWords).toEqual([]);
  });

  it('returns 0 for an empty target', () => {
    const result = scorePronunciation('', 'hello');
    expect(result.score).toBe(0);
    expect(result.missedWords).toEqual([]);
  });
});
