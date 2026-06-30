import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Box, Heading, Text, Button } from '@chakra-ui/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
          <Box display="flex" flexDirection="column" gap={4} maxW="600px" textAlign="center">
            <Heading size="lg" color="red.500">
              Oops! Something went wrong
            </Heading>
            <Text color="gray.600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            {this.state.errorInfo && (
              <Box
                bg="gray.100"
                p={4}
                borderRadius="md"
                w="full"
                maxH="200px"
                overflow="auto"
                fontSize="sm"
                fontFamily="monospace"
                textAlign="left"
              >
                {this.state.errorInfo.componentStack}
              </Box>
            )}
            <Button colorScheme="blue" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
