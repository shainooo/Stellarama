import { ChakraProvider } from '@chakra-ui/react';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { WalletProvider } from '../hooks/useWallet';
import theme from '../theme';

type AppRenderOptions = RenderOptions & {
  route?: string;
  withWalletProvider?: boolean;
};

export const renderWithProviders = (
  ui: ReactElement,
  { route = '/', withWalletProvider = true, ...renderOptions }: AppRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const content = withWalletProvider ? <WalletProvider>{children}</WalletProvider> : children;

    return (
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
      </ChakraProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
