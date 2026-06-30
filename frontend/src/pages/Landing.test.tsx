import { screen } from '@testing-library/react';
import { Landing } from './Landing';
import { renderWithProviders } from '../test/render';

describe('Landing', () => {
  it('renders primary landing page calls to action', () => {
    renderWithProviders(<Landing />);

    expect(screen.getByRole('heading', { name: /cross-border money,/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /send money/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /explore docs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
  });
});
