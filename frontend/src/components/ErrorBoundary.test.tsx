import { screen } from '@testing-library/react';
import { createRef } from 'react';
import { act } from 'react-dom/test-utils';
import { ErrorBoundary } from './ErrorBoundary';
import { renderWithProviders } from '../test/render';

describe('ErrorBoundary', () => {
  it('renders fallback UI when an error is captured', () => {
    const boundaryRef = createRef<ErrorBoundary>();

    renderWithProviders(
      <ErrorBoundary ref={boundaryRef}>
        <div>Healthy app</div>
      </ErrorBoundary>,
      { withWalletProvider: false }
    );

    act(() => {
      boundaryRef.current?.setState({
        hasError: true,
        error: new Error('Test render failure'),
        errorInfo: null,
      });
    });

    expect(screen.getByRole('heading', { name: /oops! something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText('Test render failure')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
