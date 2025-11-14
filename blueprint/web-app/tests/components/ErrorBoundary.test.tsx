/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ErrorBoundary from '../../src/components/ErrorBoundary/ErrorBoundary';

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.resetAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.clearAllMocks();
  });

  it('renders fallback when child throws and fallback prop is provided', () => {
    const Thrower: React.FC = () => {
      throw new Error('boom');
    };

    render(
      <ErrorBoundary fallback={<div data-testid="fb">fallback</div>}>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('fb')).toHaveTextContent('fallback');
  });

  it('calls onError and reloads when reload button clicked', () => {
    const mockOnError = jest.fn();

    const Thrower: React.FC = () => {
      throw new Error('boom2');
    };

    // Mock location.reload by replacing the entire location object
    const originalLocation = window.location;
    const reloadSpy = jest.fn();

    delete (window as any).location;
    window.location = { ...originalLocation, reload: reloadSpy } as any;

    render(
      <ErrorBoundary onError={mockOnError}>
        <Thrower />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(mockOnError).toHaveBeenCalled();

    const reloadBtn = screen.getByRole('button', { name: /reload the entire page/i });
    fireEvent.click(reloadBtn);
    expect(reloadSpy).toHaveBeenCalled();

    // restore
    (window as any).location = originalLocation;
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */
