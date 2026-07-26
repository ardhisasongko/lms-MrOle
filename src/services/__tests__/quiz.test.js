import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the module under test
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { submitQuiz } from '../quiz';
import { supabase } from '../supabase';

describe('submitQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.rpc with correct params and returns result', async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ attempt_id: 'att-1', score: 80, correct: 4, total: 5 }],
      error: null,
    });

    const result = await submitQuiz({
      userId: 'user-1',
      categoryId: 'cat-1',
      difficulty: 'easy',
      questions: [
        { id: 'q1' },
        { id: 'q2' },
        { id: 'q3' },
        { id: 'q4' },
        { id: 'q5' },
      ],
      answers: { q1: 'A', q2: 'B', q3: 'A', q4: 'C', q5: 'A' },
    });

    expect(supabase.rpc).toHaveBeenCalledWith('submit_quiz', {
      p_user_id: 'user-1',
      p_category_id: 'cat-1',
      p_difficulty: 'easy',
      p_answers: [
        { question_id: 'q1', user_answer: 'A' },
        { question_id: 'q2', user_answer: 'B' },
        { question_id: 'q3', user_answer: 'A' },
        { question_id: 'q4', user_answer: 'C' },
        { question_id: 'q5', user_answer: 'A' },
      ],
    });

    expect(result).toEqual({
      attemptId: 'att-1',
      score: 80,
      correct: 4,
      total: 5,
    });
  });

  it('defaults missing answers to empty string', async () => {
    supabase.rpc.mockResolvedValue({
      data: [{ attempt_id: 'att-2', score: 0, correct: 0, total: 2 }],
      error: null,
    });

    await submitQuiz({
      userId: 'user-1',
      categoryId: 'cat-1',
      difficulty: 'medium',
      questions: [{ id: 'q1' }, { id: 'q2' }],
      answers: { q1: 'B' },
    });

    expect(supabase.rpc).toHaveBeenCalledWith('submit_quiz', expect.objectContaining({
      p_answers: [
        { question_id: 'q1', user_answer: 'B' },
        { question_id: 'q2', user_answer: '' },
      ],
    }));
  });

  it('throws on supabase error', async () => {
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    });

    await expect(submitQuiz({
      userId: 'user-1',
      categoryId: 'cat-1',
      difficulty: 'easy',
      questions: [{ id: 'q1' }],
      answers: { q1: 'A' },
    })).rejects.toThrow('RPC failed');
  });
});
