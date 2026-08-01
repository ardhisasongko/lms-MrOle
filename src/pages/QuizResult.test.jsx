// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import QuizResult from './QuizResult';

const mocks = vi.hoisted(() => ({
  getAttemptDetails: vi.fn(),
  createQuizShare: vi.fn(),
  getPublicQuizShare: vi.fn(),
  revokeQuizShare: vi.fn(),
}));

vi.mock('../services/quiz', () => ({ getAttemptDetails: mocks.getAttemptDetails }));
vi.mock('../services/shares', () => ({
  createQuizShare: mocks.createQuizShare,
  getPublicQuizShare: mocks.getPublicQuizShare,
  revokeQuizShare: mocks.revokeQuizShare,
}));
vi.mock('../components/game/Confetti', () => ({ default: () => null }));
vi.mock('../components/share/ShareResultModal', () => ({
  default: ({ open, share }) => open ? <div data-testid="share-modal">{share.showName ? 'named' : 'anonymous'}</div> : null,
}));

const attempt = {
  score: 50,
  correct_answers: 1,
  total_questions: 2,
  category_id: 'category-id',
  difficulty: 'easy',
  completed_at: '2026-08-01T00:01:00Z',
  quiz_answers: [
    {
      user_answer: 'B',
      is_correct: true,
      questions: {
        id: 'question-1',
        question: 'She ___ a student.',
        options: [{ label: 'A', text: 'am' }, { label: 'B', text: 'is' }],
        type: 'multiple_choice',
        correct_answer: 'B',
        explanation: 'Use is with she.',
      },
    },
    {
      user_answer: 'A',
      is_correct: false,
      questions: {
        id: 'question-2',
        question: 'They ___ ready.',
        options: [{ label: 'A', text: 'is' }, { label: 'B', text: 'are' }],
        type: 'multiple_choice',
        correct_answer: 'B',
        explanation: 'Use are with they.',
      },
    },
  ],
};

function renderResult() {
  return render(
    <MemoryRouter initialEntries={[{
      pathname: '/practice/attempt-id/result',
      state: { score: 50, correct: 1, total: 2, categoryId: 'category-id', difficulty: 'easy', durationSeconds: 60 },
    }]}
    >
      <Routes>
        <Route path="/practice/:attemptId/result" element={<QuizResult />} />
        <Route path="/practice/retry" element={<RetryDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

function RetryDestination() {
  const location = useLocation();
  return <pre data-testid="retry-state">{JSON.stringify(location.state)}</pre>;
}

describe('QuizResult', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage('id');
    mocks.getPublicQuizShare.mockResolvedValue(null);
    mocks.createQuizShare.mockResolvedValue({
      token: 'AbCdEfGhIjKlMnOpQrStUv',
      score: 50,
      correctAnswers: 1,
      totalQuestions: 2,
      showName: false,
    });
  });

  it('loads answer details even when the score arrives in navigation state', async () => {
    mocks.getAttemptDetails.mockResolvedValue(attempt);
    renderResult();

    expect(await screen.findByRole('heading', { name: 'Review jawaban' })).toBeTruthy();
    expect(screen.getByText('She ___ a student.')).toBeTruthy();
    expect(mocks.getAttemptDetails).toHaveBeenCalledWith('attempt-id');
  });

  it('keeps retry disabled until incorrect answer details are ready', async () => {
    let resolveAttempt;
    mocks.getAttemptDetails.mockReturnValue(new Promise((resolve) => { resolveAttempt = resolve; }));
    renderResult();

    const retry = screen.getByRole('button', { name: /Ulangi soal yang salah/i });
    expect(retry.disabled).toBe(true);

    resolveAttempt(attempt);
    await waitFor(() => expect(retry.disabled).toBe(false));
  });

  it('renders structured stimulus above the mapped question prompt', async () => {
    mocks.getAttemptDetails.mockResolvedValue({
      ...attempt,
      quiz_answers: attempt.quiz_answers.map((answer, index) => index === 0 ? {
        ...answer,
        questions: {
          ...answer.questions,
          stimulus: 'Rina studies every evening.\nShe enjoys grammar practice.',
          prompt: 'Which verb completes the sentence?',
        },
      } : answer),
    });
    renderResult();

    const stimulus = await screen.findByText(/Rina studies every evening/);
    const prompt = screen.getByText('Which verb completes the sentence?');

    expect(stimulus.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('retries by attempt id without exposing question or answer data in navigation state', async () => {
    mocks.getAttemptDetails.mockResolvedValue(attempt);
    renderResult();

    fireEvent.click(await screen.findByRole('button', { name: /Ulangi soal yang salah/i }));

    const state = JSON.parse((await screen.findByTestId('retry-state')).textContent);
    expect(state).toEqual({
      sourceAttemptId: 'attempt-id',
      retryMeta: { categoryId: 'category-id', difficulty: 'easy' },
    });
    expect(JSON.stringify(state)).not.toContain('correct_answer');
    expect(JSON.stringify(state)).not.toContain('retryQuestions');
  });

  it('creates the first public share anonymously', async () => {
    mocks.getAttemptDetails.mockResolvedValue(attempt);
    renderResult();

    fireEvent.click(screen.getByRole('button', { name: 'Bagikan Pencapaian' }));

    await waitFor(() => expect(mocks.createQuizShare).toHaveBeenCalledWith('attempt-id', false));
    expect((await screen.findByTestId('share-modal')).textContent).toBe('anonymous');
  });
});
