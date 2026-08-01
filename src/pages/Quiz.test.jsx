// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Quiz from './Quiz';

const mocks = vi.hoisted(() => ({
  startSession: vi.fn(),
  saveAnswer: vi.fn(),
  submitSession: vi.fn(),
}));

vi.mock('../hooks/useQuiz', () => ({
  useQuiz: () => ({
    startSession: mocks.startSession,
    saveAnswer: mocks.saveAnswer,
    submitSession: mocks.submitSession,
    starting: false,
    submitting: false,
  }),
}));
vi.mock('../hooks/useBookmarks', () => ({
  useBookmarks: () => ({
    bookmarks: [],
    toggleBookmark: vi.fn(),
  }),
}));
vi.mock('../services/gamification', () => ({ saveDailyProgress: vi.fn() }));

function makeSession() {
  const now = Date.now();
  return {
    sessionId: 'session-id',
    categoryId: 'category-id',
    difficulty: 'easy',
    mode: 'normal',
    startedAt: new Date(now - 10_000).toISOString(),
    expiresAt: new Date(now + 1_000_000).toISOString(),
    questions: Array.from({ length: 20 }, (_, index) => ({
      id: `question-${index + 1}`,
      position: index + 1,
      type: 'multiple_choice',
      question: index === 0 ? 'Which answer is correct?' : `Question ${index + 1}`,
      stimulus: index === 0 ? 'Read this supporting passage.' : null,
      contentMetadata: { stimulus_type: 'text' },
      options: index === 0
        ? [{ label: 'C', text: 'First visible option' }, { label: 'A', text: 'Second visible option' }]
        : [{ label: 'A', text: 'Option one' }, { label: 'B', text: 'Option two' }],
      userAnswer: null,
    })),
  };
}

function renderQuiz(entry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/practice/:categoryId" element={<Quiz />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Quiz server sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mocks.startSession.mockResolvedValue(makeSession());
    mocks.saveAnswer.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a normal session and renders structured content without legacy labels', async () => {
    renderQuiz('/practice/category-id?difficulty=easy');

    expect(await screen.findByText('Read this supporting passage.')).toBeTruthy();
    expect(screen.getByText('Which answer is correct?')).toBeTruthy();
    expect(screen.queryByText(/^Teks:/i)).toBeNull();
    expect(screen.queryByText(/^Pertanyaan:/i)).toBeNull();
    expect(mocks.startSession).toHaveBeenCalledWith({
      categoryId: 'category-id',
      difficulty: 'easy',
      mode: 'normal',
      sourceAttemptId: null,
      challengeToken: null,
    });
  });

  it('uses display-order letters while saving the immutable option label', async () => {
    renderQuiz('/practice/category-id?difficulty=easy');

    fireEvent.click(await screen.findByRole('button', { name: /AFirst visible option/i }));

    await waitFor(() => expect(mocks.saveAnswer).toHaveBeenCalledWith({
      sessionId: 'session-id',
      questionId: 'question-1',
      userAnswer: 'C',
    }), { timeout: 1500 });
  });

  it('starts retry from an attempt id without receiving answer-bearing questions', async () => {
    const retrySession = { ...makeSession(), mode: 'retry', questions: makeSession().questions.slice(0, 2) };
    mocks.startSession.mockResolvedValue(retrySession);
    renderQuiz({
      pathname: '/practice/retry',
      state: {
        sourceAttemptId: 'attempt-id',
        retryMeta: { categoryId: 'category-id', difficulty: 'easy' },
      },
    });

    await screen.findByText('Which answer is correct?');
    expect(mocks.startSession).toHaveBeenCalledWith({
      categoryId: 'category-id',
      difficulty: 'easy',
      mode: 'retry',
      sourceAttemptId: 'attempt-id',
      challengeToken: null,
    });
  });

  it('keeps the timer running after a manual submission fails', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T10:00:10Z'));
    const session = makeSession();
    session.startedAt = '2026-08-01T10:00:00Z';
    session.expiresAt = '2026-08-01T10:30:00Z';
    const answers = Object.fromEntries(session.questions.map((question) => [question.id, 'A']));
    window.localStorage.setItem('mr_ole_quiz_session_v2:session-id', JSON.stringify({
      answers,
      currentIndex: 19,
    }));
    mocks.startSession.mockResolvedValue(session);
    mocks.submitSession.mockRejectedValue(new Error('Network unavailable'));

    renderQuiz('/practice/category-id?difficulty=easy');
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByText('00:10')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Selesai/i }));
    fireEvent.click(screen.getByRole('button', { name: /Kumpulkan/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Ya, Kumpulkan/i }));
      await Promise.resolve();
    });

    await act(async () => { vi.advanceTimersByTime(2000); });

    expect(screen.getByText('00:12')).toBeTruthy();
    expect(mocks.submitSession).toHaveBeenCalledTimes(1);
  });
});
