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

import '@testing-library/jest-dom';

jest.mock('@/services/Endpoints.tsx', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SessionSelectionPanel from '@/components/common/SessionSelectionPanel/SessionSelectionPanel.tsx';
import { createStreamingSession, getStreamingSessionInfo } from '@/services/Endpoints.tsx';

describe('SessionSelectionPanel extra branches', () => {
  beforeEach(() => jest.resetAllMocks());

  it('handles OKAS API error returned from createStreamingSession (detail)', async () => {
    // create returns 200 but with ErrorItem { detail }
    (createStreamingSession as jest.Mock).mockResolvedValue({ status: 200, data: { detail: 'Invalid profile' } });

    const onReady = jest.fn();
    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: 'p',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;

    const { getByRole, findByText } = render(<SessionSelectionPanel {...(props as unknown as React.ComponentProps<typeof SessionSelectionPanel>)} />);

    const button = getByRole('button');
    fireEvent.click(button);

    expect(await findByText(/Failed to create session: OKAS API Error: Invalid profile/)).toBeTruthy();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('reports missing stream server when connecting', async () => {
    const onReady = jest.fn();
    const { getByPlaceholderText, getByRole, findByText } = render(
      <SessionSelectionPanel
        streamServer={''}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const input = getByPlaceholderText(/Enter existing session ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 's1' } });

    const button = getByRole('button');
    fireEvent.click(button);

    expect(await findByText(/Missing stream server configuration/i)).toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('updates sessionIdInput on handleSessionIdChange', () => {
    const onReady = jest.fn();
    const { getByPlaceholderText } = render(
      <SessionSelectionPanel
        streamServer={'https://s'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const input = getByPlaceholderText(/Enter existing session ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'my-session' } });

    expect(input.value).toBe('my-session');
  });

  it('connects to existing session and calls onSessionReady when ready immediately', async () => {
    const onReady = jest.fn();

    (getStreamingSessionInfo as jest.Mock).mockResolvedValue({ status: 200, data: { id: 's1', routes: { foo: {} } } });

    const { getByPlaceholderText, getByRole } = render(
      <SessionSelectionPanel
        streamServer={'https://s'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const input = getByPlaceholderText(/Enter existing session ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 's1' } });

    const button = getByRole('button');
    fireEvent.click(button);

    // wait for onReady to be called by the polling logic
    await waitFor(() => {
      expect(onReady).toHaveBeenCalledWith('s1');
    });
    // component should not be in connecting state: specifically the primary button should show Connect to Session
    const primary = await screen.findByRole('button', { name: /Connect to Session/i });
    expect(primary).toBeTruthy();
  });

  it('polling recovers from an error and then succeeds', async () => {
    const onReady = jest.fn();

    // First poll will throw, second poll will return ready
    const mock = (getStreamingSessionInfo as jest.Mock);
    mock.mockRejectedValueOnce(new Error('temp'));
    mock.mockResolvedValueOnce({ status: 200, data: { id: 's2', routes: { r: {} } } });

    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: 'p',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;

    // instantiate and call private poll method to avoid interacting with testing-library timers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const InstClass = SessionSelectionPanel as unknown as { new (p: any): any };
    const inst = new InstClass(props);
    const poll = inst['pollSessionStatus'].bind(inst) as (
      s: string,
      server: string,
      cb: (id: string) => void
    ) => Promise<void>;

    // Monkeypatch setTimeout to call callbacks immediately so retries happen fast
    const realSetTimeout = global.setTimeout;
    // @ts-expect-error override for test
    global.setTimeout = (fn: (...args: unknown[]) => void, _ms?: number, ...args: unknown[]) => {
      // call immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(...args);
      return 0 as unknown as NodeJS.Timeout;
    };

    try {
      await poll('s2', props.streamServer, onReady);
      expect(onReady).toHaveBeenCalledWith('s2');
    } finally {
      // restore
      global.setTimeout = realSetTimeout;
    }
  });

  it('shows create error when createStreamingSession throws', async () => {
    (createStreamingSession as jest.Mock).mockImplementation(() => { throw new Error('boom'); });

    const onReady = jest.fn();
    const { getByRole, findByText } = render(
      <SessionSelectionPanel
        streamServer={'https://s'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const button = getByRole('button');
    fireEvent.click(button);

    expect(await findByText(/Failed to create session: boom/)).toBeTruthy();
    expect(onReady).not.toHaveBeenCalled();
  });
});
