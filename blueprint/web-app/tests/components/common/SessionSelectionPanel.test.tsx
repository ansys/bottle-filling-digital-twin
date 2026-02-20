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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@/services/Endpoints.tsx', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
}));

import SessionSelectionPanel from '@/components/common/SessionSelectionPanel/SessionSelectionPanel.tsx';
import { createStreamingSession, getStreamingSessionInfo } from '@/services/Endpoints.tsx';

describe('SessionSelectionPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows error when required props are missing', async () => {
    const onReady = jest.fn();
    render(
      // @ts-expect-error - intentionally missing props to test validation
      <SessionSelectionPanel onSessionReady={onReady} />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(await screen.findByText(/Missing required parameters/i)).toBeInTheDocument();
  });

  it('creates a session and calls onSessionReady when session becomes ready', async () => {
    const onReady = jest.fn();
    // mock createStreamingSession to return a session id
    (createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { id: 'sess-1' } });

    // mock getStreamingSessionInfo to return ready routes immediately
    (getStreamingSessionInfo as jest.Mock).mockResolvedValue({ status: 200, data: { id: 'sess-1', routes: { r: { routes: [{ description: 'signaling', destination_port: 1, protocol: 'TCP', source_port: 2 }] } } } });

    render(
      <SessionSelectionPanel
        streamServer={'https://example.com'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'default'}
        onSessionReady={onReady}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => expect(createStreamingSession).toHaveBeenCalled());
    await waitFor(() => expect(getStreamingSessionInfo).toHaveBeenCalled());
    await waitFor(() => expect(onReady).toHaveBeenCalledWith('sess-1'));
  });
});
