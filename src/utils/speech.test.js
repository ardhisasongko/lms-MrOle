import { describe, expect, it } from 'vitest';
import { mergeTranscript } from './speech';

describe('mergeTranscript', () => {
  it('returns the transcript when the base is empty', () => {
    expect(mergeTranscript('', 'hello')).toBe('hello');
    expect(mergeTranscript(undefined, 'hello')).toBe('hello');
  });

  it('joins base and transcript with a single space', () => {
    expect(mergeTranscript('hello', 'world')).toBe('hello world');
    expect(mergeTranscript('hello ', 'world')).toBe('hello world');
  });

  it('trims the transcript and collapses repeated whitespace', () => {
    expect(mergeTranscript('how', '  are   you  ')).toBe('how are you');
  });

  it('keeps the base untouched when the transcript is empty', () => {
    expect(mergeTranscript('hello', '')).toBe('hello');
    expect(mergeTranscript('hello', '   ')).toBe('hello');
    expect(mergeTranscript('', '')).toBe('');
  });

  it('attaches a transcript that starts with punctuation without a space', () => {
    expect(mergeTranscript('thank you', '.')).toBe('thank you.');
    expect(mergeTranscript('wait', ', please')).toBe('wait, please');
  });
});
