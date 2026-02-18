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

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/services/Endpoints.tsx', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
}));

import SessionSelectionPanel from '@/components/common/SessionSelectionPanel/SessionSelectionPanel.tsx';
import { getStreamingSessionInfo } from '@/services/Endpoints.tsx';

describe('SessionSelectionPanel error handling', () => {
  beforeEach(() => jest.resetAllMocks());

  it('shows error when polling throws repeatedly', async () => {
    const onReady = jest.fn();

    // mock getStreamingSessionInfo to throw an error immediately
    (getStreamingSessionInfo as jest.Mock).mockRejectedValue(new Error('network'));

    render(
      <SessionSelectionPanel
        streamServer={'https://example.com'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for error message to appear (component sets error when create fails or polling fails)
    expect(await screen.findByText(/Failed to create session|Session polling failed/i)).toBeInTheDocument();
  });
});
