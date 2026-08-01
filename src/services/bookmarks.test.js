import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { getBookmarksByUser, getBookmarkReviews } from './bookmarks';
import { supabase } from './supabase';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('bookmark reads', () => {
  it('loads only bookmark identifiers for active quiz state', async () => {
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockResolvedValue({
        data: [{ id: 'bookmark-1', question_id: 'question-1', created_at: '2026-08-01T10:00:00Z' }],
        error: null,
      }),
    };
    supabase.from.mockReturnValue(query);

    const result = await getBookmarksByUser('user-1');

    expect(supabase.from).toHaveBeenCalledWith('bookmarks');
    expect(query.select).toHaveBeenCalledWith('id, question_id, created_at');
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(JSON.stringify(result)).not.toContain('correct_answer');
  });

  it('loads review details only through the controlled RPC', async () => {
    supabase.rpc.mockReturnValue({
      abortSignal: vi.fn().mockResolvedValue({
        data: [{
          id: 'bookmark-1',
          question_id: 'question-1',
          questions: {
            id: 'question-1',
            answer_available: false,
            correct_answer: null,
            explanation: null,
          },
        }],
        error: null,
      }),
    });

    const result = await getBookmarkReviews();

    expect(supabase.rpc).toHaveBeenCalledWith('get_bookmark_reviews');
    expect(result[0].questions).toMatchObject({
      answer_available: false,
      correct_answer: null,
      explanation: null,
    });
  });
});
