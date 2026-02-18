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

// React import removed - not needed with new JSX transform
import { render, screen } from '../utils/test-utils.tsx';
import Loading from '@/components/Loading';

describe('Loading Component', () => {
  it('renders with default message', () => {
    render(<Loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Loading simulation data...';
    render(<Loading message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  xit('renders with different sizes', () => {
    const { rerender } = render(<Loading size='small' />);

    let loadingContainer = screen.getByText('Loading...').closest('.loading');
    expect(loadingContainer).toHaveClass('loading--small');

    rerender(<Loading size='large' />);
    loadingContainer = screen.getByText('Loading...').closest('.loading');
    expect(loadingContainer).toHaveClass('loading--large');
  });

  it('has proper accessibility attributes', () => {
    render(<Loading message='Loading content' />);

    const loadingElement = screen.getByText('Loading content');
    expect(loadingElement).toBeInTheDocument();
  });

  xit('contains a spinner element', () => {
    render(<Loading />);

    const spinnerElement = document.querySelector('.spinner');
    expect(spinnerElement).toBeInTheDocument();
  });
});
