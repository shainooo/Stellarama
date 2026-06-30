import { screen } from '@testing-library/react';
import { Navbar } from './Navbar';
import { renderWithProviders } from '../test/render';

describe('Navbar', () => {
  it('renders Stellarama branding and primary navigation', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByLabelText(/stellarama home/i)).toBeInTheDocument();
    expect(screen.getByText('Stellarama')).toBeInTheDocument();
    expect(screen.getByText('Send Money').closest('a')).toHaveAttribute('href', '/send');
    expect(screen.getByText('Transactions').closest('a')).toHaveAttribute('href', '/history');
    expect(screen.getByText('Documentation').closest('a')).toHaveAttribute('href', '/docs');
  });

  it('shows a wallet connection entry point', () => {
    renderWithProviders(<Navbar />);

    expect(screen.getByRole('button', { name: /connect/i })).toBeInTheDocument();
  });
});
