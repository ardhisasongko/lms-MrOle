// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import BookmarkReview from './BookmarkReview';

const mocks = vi.hoisted(() => ({
  useBookmarks: vi.fn(),
  toggleBookmark: vi.fn(),
}));

vi.mock('../hooks/useBookmarks', () => ({
  useBookmarks: mocks.useBookmarks,
}));

function makeBookmark(answerAvailable) {
  return {
    id: 'bookmark-1',
    question_id: 'question-1',
    questions: {
      id: 'question-1',
      prompt: 'Choose the correct answer.',
      stimulus: null,
      difficulty: 'easy',
      type: 'multiple_choice',
      options: [
        { label: 'A', text: 'First option' },
        { label: 'B', text: 'Second option' },
      ],
      answer_available: answerAvailable,
      correct_answer: answerAvailable ? 'B' : null,
      explanation: answerAvailable ? 'Because B is correct.' : null,
      categories: { name: 'Grammar' },
    },
  };
}

describe('BookmarkReview answer visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useBookmarks.mockReturnValue({
      bookmarks: [makeBookmark(false)],
      loading: false,
      error: null,
      toggleBookmark: mocks.toggleBookmark,
    });
  });

  it('keeps answers locked until the question has a completed attempt', () => {
    render(<BookmarkReview />);

    expect(mocks.useBookmarks).toHaveBeenCalledWith({ review: true });
    fireEvent.click(screen.getByRole('button', { name: 'Buka rincian soal' }));

    expect(screen.getByText('Jawaban dan pembahasan tersedia setelah soal selesai dikerjakan.')).toBeTruthy();
    expect(screen.queryByText('Jawaban Benar:')).toBeNull();
    expect(screen.queryByText('Because B is correct.')).toBeNull();
  });

  it('shows answers after the controlled review interface unlocks them', () => {
    mocks.useBookmarks.mockReturnValue({
      bookmarks: [makeBookmark(true)],
      loading: false,
      error: null,
      toggleBookmark: mocks.toggleBookmark,
    });

    render(<BookmarkReview />);
    fireEvent.click(screen.getByRole('button', { name: 'Buka rincian soal' }));

    expect(screen.getByText('Jawaban Benar:')).toBeTruthy();
    expect(screen.getByText('Because B is correct.')).toBeTruthy();
    expect(screen.queryByText('Jawaban dan pembahasan tersedia setelah soal selesai dikerjakan.')).toBeNull();
  });
});
