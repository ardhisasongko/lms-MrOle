// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from '../../i18n';
import AchievementCard from './AchievementCard';
import ShareResultModal from './ShareResultModal';

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr'),
  },
}));

const share = {
  score: 10,
  correctAnswers: 2,
  totalQuestions: 21,
  categoryName: 'Grammar',
  difficulty: 'easy',
  durationSeconds: 24,
  url: 'https://lms-mrole.pages.dev/s/test-token',
};

describe('achievement share formats', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    await i18n.changeLanguage('id');
  });

  it('defaults to Story on mobile and remembers an explicit Feed choice', async () => {
    render(<ShareResultModal open share={share} onClose={() => {}} />);

    await screen.findAllByRole('img', { name: /Kode QR/i });
    const storyButton = screen.getByRole('button', { name: /Story1080 x 1920/i });
    const feedButton = screen.getByRole('button', { name: /Feed1080 x 1350/i });
    expect(storyButton.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-share-format="story"]')).toBeTruthy();

    fireEvent.click(feedButton);

    expect(feedButton.getAttribute('aria-pressed')).toBe('true');
    expect(document.querySelector('[data-share-format="feed"]')).toBeTruthy();
    await waitFor(() => expect(window.localStorage.getItem('mr-ole-share-format')).toBe('feed'));
  });

  it('uses supportive Story copy for a low score', () => {
    render(
      <AchievementCard
        format="story"
        share={share}
        shareUrl={share.url}
        qrDataUrl="data:image/png;base64,qr"
      />,
    );

    expect(screen.getByText('Latihan selesai')).toBeTruthy();
    expect(screen.getByText('Satu langkah belajar selesai. Besok lanjut lagi.')).toBeTruthy();
    expect(screen.getByText('Coba tantangan ini')).toBeTruthy();
  });
});
