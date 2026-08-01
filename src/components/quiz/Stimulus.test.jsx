// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import Stimulus from './Stimulus';

describe('Stimulus', () => {
  beforeAll(() => i18n.changeLanguage('id'));
  it('renders plain text in a named semantic region without a visible prefix', () => {
    render(<Stimulus>{'Baris pertama\nBaris kedua'}</Stimulus>);

    const region = screen.getByRole('region', { name: 'Bacaan pendukung' });
    expect(region).toHaveTextContent('Baris pertama Baris kedua');
    expect(region).not.toHaveTextContent(/Teks:|Pertanyaan:|Transkrip:/);
  });

  it('exposes transcript semantics and does not interpret markup', () => {
    render(<Stimulus type="transcript">{'<strong>Suara narator</strong>'}</Stimulus>);

    const region = screen.getByRole('region', { name: 'Transkrip audio' });
    expect(region).toHaveTextContent('<strong>Suara narator</strong>');
    expect(region.querySelector('strong')).toBeNull();
  });

  it('does not render an empty stimulus', () => {
    const { container } = render(<Stimulus>{'   '}</Stimulus>);
    expect(container).toBeEmptyDOMElement();
  });
});
