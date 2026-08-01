import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();

vi.mock('./supabase', () => ({
  supabase: { rpc },
}));

const { createQuizShare, getPublicQuizShare, revokeQuizShare } = await import('./shares');

const row = {
  token: 'AbCdEfGhIjKlMnOpQrStUv',
  score: 92,
  correct_answers: 23,
  total_questions: 25,
  category_id: 'category-id',
  category_name: 'Grammar',
  difficulty: 'hard',
  completed_at: '2026-08-01T00:00:00Z',
  display_name: 'Ardhi',
  show_name: true,
  created_at: '2026-08-01T00:00:00Z',
};

describe('quiz share service', () => {
  beforeEach(() => rpc.mockReset());

  it('creates a share from a server-verified attempt snapshot', async () => {
    rpc.mockResolvedValue({ data: [row], error: null });

    await expect(createQuizShare('attempt-id', false)).resolves.toMatchObject({
      token: row.token,
      correctAnswers: 23,
      totalQuestions: 25,
      categoryName: 'Grammar',
    });
    expect(rpc).toHaveBeenCalledWith('create_quiz_share', {
      p_attempt_id: 'attempt-id',
      p_show_name: false,
    });
  });

  it('returns null when a public token has no active share', async () => {
    rpc.mockResolvedValue({ data: [], error: null });

    await expect(getPublicQuizShare('missing')).resolves.toBeNull();
  });

  it('revokes only the requested token through the RPC', async () => {
    rpc.mockResolvedValue({ error: null });

    await revokeQuizShare(row.token);
    expect(rpc).toHaveBeenCalledWith('revoke_quiz_share', { p_token: row.token });
  });
});
