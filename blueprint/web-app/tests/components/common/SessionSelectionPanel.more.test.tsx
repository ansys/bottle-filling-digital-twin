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
import { createStreamingSession } from '@/services/Endpoints.tsx';

describe('SessionSelectionPanel additional branches', () => {
  beforeEach(() => jest.resetAllMocks());

  it('shows missing streamServer error when trying to connect with session id but no server', async () => {
    const onReady = jest.fn();

    render(
      <SessionSelectionPanel
        // deliberately provide empty streamServer to trigger missing-server branch
        streamServer={''}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const input = screen.getByPlaceholderText(/Enter existing session ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'sess-42' } });

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/Connect to Session/i);

    fireEvent.click(button);

    expect(await screen.findByText(/Missing stream server configuration/i)).toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('updates input and toggles button text between Create and Connect', () => {
    const onReady = jest.fn();
    render(
      <SessionSelectionPanel
        streamServer={'https://s'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/Create New Session/i);

    const input = screen.getByPlaceholderText(/Enter existing session ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });

    // After entering text, the button should switch to 'Connect to Session'
    expect(button).toHaveTextContent(/Connect to Session/i);
    // The input value should reflect the change
    expect(input.value).toBe('abc');
  });

  it('shows API detail error when createStreamingSession returns an error object', async () => {
    const onReady = jest.fn();

    // createStreamingSession returns an ErrorItem shape with 'detail'
    (createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { detail: 'bad request' } });

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

    // Expect an error message that contains the API detail message
    expect(await screen.findByText(/OKAS API Error: bad request/i)).toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();
  });
});
