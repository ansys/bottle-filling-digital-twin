// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary.tsx';

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
