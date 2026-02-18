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

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBar from '@/components/common/StatusBar/StatusBar.tsx';

describe('StatusBar Component', () => {
  it('renders without crashing', () => {
    render(<StatusBar />);
    // Component should render default design text
    expect(screen.getByText(/None selected/i)).toBeInTheDocument();
  });

  it('displays design name when provided', () => {
    render(<StatusBar designName="Test Design" />);
    expect(screen.getByText('Test Design')).toBeInTheDocument();
  });

  it('displays status when provided', () => {
    render(<StatusBar status="Running" />);
    expect(screen.getByText(/Running/i)).toBeInTheDocument();
  });

  it('shows session info when enabled', () => {
    render(<StatusBar showSessionInfo={true} sessionId="session-123" />);
    expect(screen.getByText(/session-123/i)).toBeInTheDocument();
  });

  it('renders progress bar when showProgress is true', () => {
    render(<StatusBar showProgress={true} progress={50} />);
    // Progress is rendered as text and progress bar; verify percent text
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBar className="custom-class" />);
    const statusBar = container.querySelector('.custom-class');
    expect(statusBar).toBeInTheDocument();
  });
});
