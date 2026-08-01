// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Questions from './Questions';

const mocks = vi.hoisted(() => ({
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  refetch: vi.fn(),
}));

const generatedQuestion = {
  category_id: 'category-1',
  difficulty: 'easy',
  type: 'multiple_choice',
  prompt: '  Choose the correct answer.  ',
  stimulus: '',
  status: 'published',
  options: [
    { label: 'A', text: 'First' },
    { label: 'B', text: 'Second' },
  ],
  correct_answer: 'B',
  explanation: 'Second is correct.',
  content_hash: 'a'.repeat(64),
  batch_id: 'english-bank-2000-v2',
  batch_metadata: { version: 2 },
  source_key: 'english-bank:grammar:easy:001',
};

vi.mock('../../components/common/CrudTable', () => ({
  default: ({ onCreate, onUpdate }) => (
    <div>
      <button type="button" onClick={() => onCreate(generatedQuestion)}>Create fixture</button>
      <button type="button" onClick={() => onUpdate('question-1', generatedQuestion)}>Update fixture</button>
    </div>
  ),
}));
vi.mock('../../services/questions', () => ({
  ADMIN_QUESTION_PAGE_SIZE: 50,
  getAllQuestions: vi.fn(),
  createQuestion: mocks.createQuestion,
  updateQuestion: mocks.updateQuestion,
  deleteQuestion: vi.fn(),
}));
vi.mock('../../services/categories', () => ({ getCategorySummary: vi.fn() }));
vi.mock('../../hooks/useAsync', () => ({
  useAsync: () => ({ loading: false, refetch: mocks.refetch }),
}));
vi.mock('../../utils/logAdmin', () => ({ logAdmin: vi.fn() }));

function expectEditablePayload(payload) {
  expect(payload).toMatchObject({
    category_id: 'category-1',
    difficulty: 'easy',
    type: 'multiple_choice',
    question: 'Choose the correct answer.',
    prompt: 'Choose the correct answer.',
    correct_answer: 'B',
  });
  expect(payload).not.toHaveProperty('content_hash');
  expect(payload).not.toHaveProperty('batch_id');
  expect(payload).not.toHaveProperty('batch_metadata');
  expect(payload).not.toHaveProperty('source_key');
}

describe('admin question provenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createQuestion.mockResolvedValue({ id: 'question-new' });
    mocks.updateQuestion.mockResolvedValue();
    mocks.refetch.mockResolvedValue();
  });

  it('uses database defaults when creating a manual question', async () => {
    render(<Questions />);
    fireEvent.click(screen.getByRole('button', { name: 'Create fixture' }));

    await waitFor(() => expect(mocks.createQuestion).toHaveBeenCalledTimes(1));
    expectEditablePayload(mocks.createQuestion.mock.calls[0][0]);
  });

  it('does not overwrite generated provenance when editing a question', async () => {
    render(<Questions />);
    fireEvent.click(screen.getByRole('button', { name: 'Update fixture' }));

    await waitFor(() => expect(mocks.updateQuestion).toHaveBeenCalledTimes(1));
    expect(mocks.updateQuestion.mock.calls[0][0]).toBe('question-1');
    expectEditablePayload(mocks.updateQuestion.mock.calls[0][1]);
  });
});
