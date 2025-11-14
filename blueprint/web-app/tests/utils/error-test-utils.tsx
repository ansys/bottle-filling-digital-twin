/* eslint-disable react-refresh/only-export-components */
import { ReactNode } from 'react';

/**
 * Test utility component that throws an error when shouldThrow is true
 */
export const ThrowError = ({
  shouldThrow = true,
  errorMessage = 'Test error message',
  children = 'Component rendered successfully'
}: {
  shouldThrow?: boolean;
  errorMessage?: string;
  children?: ReactNode;
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>{children}</div>;
};

/**
 * Test utility component that throws an error after a delay
 * Note: This will NOT be caught by ErrorBoundary as React Error Boundaries
 * only catch errors in render methods, lifecycle methods, and constructors
 */
export const ThrowAsyncError = ({
  shouldThrow = true,
  delay = 100,
  errorMessage = 'Async test error',
  children = 'Async component rendered'
}: {
  shouldThrow?: boolean;
  delay?: number;
  errorMessage?: string;
  children?: ReactNode;
}) => {
  if (shouldThrow) {
    setTimeout(() => {
      throw new Error(errorMessage);
    }, delay);
  }
  return <div>{children}</div>;
};

/**
 * Test utility component that conditionally throws based on props
 */
export const ConditionalError = ({
  condition,
  errorMessage = 'Conditional error',
  children = 'Conditional component rendered'
}: {
  condition: boolean;
  errorMessage?: string;
  children?: ReactNode;
}) => {
  if (condition) {
    throw new Error(errorMessage);
  }
  return <div>{children}</div>;
};

/**
 * Test utility component that throws different types of errors
 */
export const ThrowSpecificError = ({
  errorType = 'Error',
  errorMessage = 'Specific error message'
}: {
  errorType?: 'Error' | 'TypeError' | 'ReferenceError' | 'RangeError';
  errorMessage?: string;
}) => {
  switch (errorType) {
    case 'TypeError':
      throw new TypeError(errorMessage);
    case 'ReferenceError':
      throw new ReferenceError(errorMessage);
    case 'RangeError':
      throw new RangeError(errorMessage);
    default:
      throw new Error(errorMessage);
  }
};

/**
 * Test utility component that simulates a component stack
 */
export const DeepErrorComponent = ({
  depth = 1,
  shouldThrow = true,
  errorMessage = 'Deep error'
}: {
  depth?: number;
  shouldThrow?: boolean;
  errorMessage?: string;
}) => {
  if (depth <= 0) {
    if (shouldThrow) {
      throw new Error(errorMessage);
    }
    return <div>Deep component rendered successfully</div>;
  }

  return (
    <div>
      <span>Level {depth}</span>
      <DeepErrorComponent
        depth={depth - 1}
        shouldThrow={shouldThrow}
        errorMessage={errorMessage}
      />
    </div>
  );
};

/**
 * Mock error reporting service for testing
 */
export const mockErrorReportingService = {
  logError: jest.fn(),
  clearLogs: () => {
    mockErrorReportingService.logError.mockClear();
  },
  getLogCount: () => mockErrorReportingService.logError.mock.calls.length,
  getLastLog: () => {
    const calls = mockErrorReportingService.logError.mock.calls;
    return calls[calls.length - 1];
  }
};

/**
 * Test utility to suppress console.error during tests
 */
export const suppressConsoleError = () => {
  const originalConsoleError = console.error;
  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });
};

/**
 * Test utility to mock window.location.reload
 */
export const mockWindowReload = () => {
  const originalLocation = window.location;
  const reloadMock = jest.fn();

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        reload: reloadMock
      },
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true
    });
    reloadMock.mockClear();
  });

  return reloadMock;
};

/**
 * Test utility to create mock ErrorBoundary props
 */
export const createMockErrorBoundaryProps = (overrides: Partial<{
  onError: jest.Mock;
  fallback: ReactNode;
}> = {}) => ({
  onError: jest.fn(),
  ...overrides
});

/**
 * Custom test matchers for ErrorBoundary testing
 */
export const errorBoundaryMatchers = {
  toHaveErrorUI: (container: HTMLElement) => {
    const errorTitle = container.querySelector('[role="alert"]');
    const tryAgainButton = container.querySelector('button[aria-label*="Try to render"]');
    const reloadButton = container.querySelector('button[aria-label*="Reload"]');

    return {
      pass: !!(errorTitle && tryAgainButton && reloadButton),
      message: () => 'Expected ErrorBoundary to display error UI with all required elements'
    };
  },

  toHaveCustomFallback: (container: HTMLElement, testId: string) => {
    const customFallback = container.querySelector(`[data-testid="${testId}"]`);
    const defaultError = container.querySelector('[role="alert"]');

    return {
      pass: !!(customFallback && !defaultError),
      message: () => 'Expected ErrorBoundary to display custom fallback instead of default error UI'
    };
  }
};

// Export all utilities as default for easy importing
export default {
  ThrowError,
  ThrowAsyncError,
  ConditionalError,
  ThrowSpecificError,
  DeepErrorComponent,
  mockErrorReportingService,
  suppressConsoleError,
  mockWindowReload,
  createMockErrorBoundaryProps,
  errorBoundaryMatchers
};