import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the module under test
vi.mock('../supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import {
  saveQuizSessionAnswer,
  startQuizSession,
  submitQuizSession,
} from '../quiz';
import { supabase } from '../supabase';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('quiz sessions', () => {
  it('starts a session with exact RPC params and maps sanitized questions', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        session_id: 'session-1',
        category_id: 'cat-1',
        difficulty: 'hard',
        mode: 'challenge',
        question_count: 1,
        source_attempt_id: 'attempt-source',
        challenge_token: 'challenge-token',
        status: 'active',
        started_at: '2026-08-01T10:00:00Z',
        expires_at: '2026-08-01T10:30:00Z',
        questions: [{
          question_id: 'question-1',
          position: 1,
          type: 'multiple_choice',
          question: 'Legacy question',
          prompt: 'Mapped prompt',
          stimulus: 'Read this first.',
          options: [{ label: 'A', text: 'Answer A' }],
          content_metadata: {
            stimulus_type: 'text',
            correct_answer: 'A',
            correctAnswer: 'A',
            explanation: 'Secret explanation',
          },
          user_answer: 'A',
          correct_answer: 'A',
          explanation: 'Secret explanation',
        }],
      },
      error: null,
    });

    const result = await startQuizSession({
      categoryId: 'ignored-for-challenge',
      difficulty: 'ignored-for-challenge',
      mode: 'challenge',
      sourceAttemptId: null,
      challengeToken: 'challenge-token',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('start_quiz_session', {
      p_category_id: 'ignored-for-challenge',
      p_difficulty: 'ignored-for-challenge',
      p_mode: 'challenge',
      p_source_attempt_id: null,
      p_challenge_token: 'challenge-token',
    });
    expect(result).toEqual({
      sessionId: 'session-1',
      categoryId: 'cat-1',
      difficulty: 'hard',
      mode: 'challenge',
      questionCount: 1,
      sourceAttemptId: 'attempt-source',
      challengeToken: 'challenge-token',
      status: 'active',
      startedAt: '2026-08-01T10:00:00Z',
      expiresAt: '2026-08-01T10:30:00Z',
      questions: [{
        id: 'question-1',
        position: 1,
        type: 'multiple_choice',
        question: 'Mapped prompt',
        stimulus: 'Read this first.',
        options: [{ label: 'A', text: 'Answer A' }],
        contentMetadata: { stimulus_type: 'text' },
        userAnswer: 'A',
      }],
    });
    expect(JSON.stringify(result)).not.toContain('correct_answer');
    expect(JSON.stringify(result)).not.toContain('correctAnswer');
    expect(JSON.stringify(result)).not.toContain('Secret explanation');
  });

  it('uses standard session defaults', async () => {
    supabase.rpc.mockResolvedValue({ data: { questions: [] }, error: null });

    await startQuizSession({ categoryId: 'cat-1', difficulty: 'easy' });

    expect(supabase.rpc).toHaveBeenCalledWith('start_quiz_session', {
      p_category_id: 'cat-1',
      p_difficulty: 'easy',
      p_mode: 'normal',
      p_source_attempt_id: null,
      p_challenge_token: null,
    });
  });

  it('saves one session answer and maps its response', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        session_id: 'session-1',
        question_id: 'question-1',
        user_answer: 'B',
        answered_at: '2026-08-01T10:05:00Z',
      },
      error: null,
    });

    const result = await saveQuizSessionAnswer({
      sessionId: 'session-1',
      questionId: 'question-1',
      userAnswer: 'B',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('save_quiz_session_answer', {
      p_session_id: 'session-1',
      p_question_id: 'question-1',
      p_user_answer: 'B',
    });
    expect(result).toEqual({
      sessionId: 'session-1',
      questionId: 'question-1',
      userAnswer: 'B',
      answeredAt: '2026-08-01T10:05:00Z',
    });
  });

  it('submits serialized answers and preserves the idempotent submitted status', async () => {
    supabase.rpc.mockResolvedValue({
      data: {
        session_id: 'session-1',
        attempt_id: 'attempt-1',
        score: 100,
        correct: 2,
        total: 2,
        mode: 'normal',
        already_submitted: false,
        status: 'submitted',
      },
      error: null,
    });

    const result = await submitQuizSession({
      sessionId: 'session-1',
      answers: [
        { questionId: 'question-1', userAnswer: 'A' },
        { questionId: 'question-2', userAnswer: 'C' },
      ],
    });

    expect(supabase.rpc).toHaveBeenCalledWith('submit_quiz_session', {
      p_session_id: 'session-1',
      p_answers: [
        { question_id: 'question-1', user_answer: 'A' },
        { question_id: 'question-2', user_answer: 'C' },
      ],
    });
    expect(result).toEqual({
      sessionId: 'session-1',
      attemptId: 'attempt-1',
      score: 100,
      correct: 2,
      total: 2,
      mode: 'normal',
      alreadySubmitted: false,
      status: 'submitted',
    });
  });

  it('submits previously saved answers with a null answer payload', async () => {
    supabase.rpc.mockResolvedValue({ data: { status: 'submitted' }, error: null });

    await submitQuizSession({ sessionId: 'session-1' });

    expect(supabase.rpc).toHaveBeenCalledWith('submit_quiz_session', {
      p_session_id: 'session-1',
      p_answers: null,
    });
  });
});
