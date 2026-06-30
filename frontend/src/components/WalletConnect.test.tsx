import { screen } from '@testing-library/react';
import { WalletConnect } from './WalletConnect';
import { renderWithProviders } from '../test/render';

describe('WalletConnect', () => {
  it('renders the wallet connect button when disconnected', () => {
    renderWithProviders(<WalletConnect />);

    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });
});
