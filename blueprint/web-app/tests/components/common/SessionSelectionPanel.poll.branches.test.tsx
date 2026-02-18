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
  getStreamingSessionInfo: jest.fn(),
}));

import SessionSelectionPanel from '@/components/common/SessionSelectionPanel/SessionSelectionPanel.tsx';
import { getStreamingSessionInfo } from '@/services/Endpoints.tsx';

describe('SessionSelectionPanel polling branches (instantiation)', () => {
  beforeEach(() => jest.resetAllMocks());

  it('handles non-2xx responses during poll and then recovers to ready', async () => {
    const onReady = jest.fn();
    const mock = (getStreamingSessionInfo as jest.Mock);

    // first call: non-2xx -> will throw inside poll
    mock.mockResolvedValueOnce({ status: 500, data: {} });
    // second call: 200 but not ready (no routes)
    mock.mockResolvedValueOnce({ status: 200, data: { id: 'x', routes: {} } });
    // third call: ready
    mock.mockResolvedValueOnce({ status: 200, data: { id: 'x', routes: { r: {} } } });

    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: 'p',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;

    // instantiate and call private poll method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const InstClass = SessionSelectionPanel as unknown as { new (p: any): any };
    const inst = new InstClass(props);
    const poll = inst['pollSessionStatus'].bind(inst) as (
      s: string,
      server: string,
      cb: (id: string) => void
    ) => Promise<void>;

    // fast-setTimeout
    const realSetTimeout = global.setTimeout;
    // @ts-expect-error test override
    global.setTimeout = (fn: (...args: unknown[]) => void, _ms?: number, ...args: unknown[]) => {
      // call immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(...args);
      return 0 as unknown as NodeJS.Timeout;
    };

    try {
      await poll('x', props.streamServer, onReady);
      expect(onReady).toHaveBeenCalledWith('x');
    } finally {
      global.setTimeout = realSetTimeout;
    }
  });

  it('reaches polling timeout after repeated not-ready responses', async () => {
    const onReady = jest.fn();
    const mock = (getStreamingSessionInfo as jest.Mock);

    // always return 200 but no routes
    mock.mockResolvedValue({ status: 200, data: { id: 'y', routes: {} } });

    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: 'p',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;

    // instantiate and call private poll method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const InstClass = SessionSelectionPanel as unknown as { new (p: any): any };
    const inst = new InstClass(props);
    const poll = inst['pollSessionStatus'].bind(inst) as (
      s: string,
      server: string,
      cb: (id: string) => void
    ) => Promise<void>;

    // fast-setTimeout to avoid long waits
    const realSetTimeout = global.setTimeout;
    // override as any to avoid TypeScript setTimeout signature mismatch
    (global as any).setTimeout = (fn: (...args: unknown[]) => void, _ms?: number, ...args: unknown[]) => {
      // call immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(...args);
      return 0 as unknown as NodeJS.Timeout;
    };

    try {
      // replace setState on the instance so we can observe the error without requiring a mounted component
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalSetState = (inst as any).setState;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inst as any).__test_state = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inst as any).setState = function (s: any) {
        if (typeof s === 'function') {
          // function updater
          (inst as any).__test_state = s((inst as any).__test_state || {});
        } else {
          (inst as any).__test_state = { ...(inst as any).__test_state, ...s };
        }
      };

      await poll('y', props.streamServer, onReady);
      // after poll finishes it should not have called onReady
      expect(onReady).not.toHaveBeenCalled();
      // the instance test-state should contain the timeout error message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((inst as any).__test_state.error).toMatch(/Session polling timeout/i);
      // restore original setState
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inst as any).setState = originalSetState;
    } finally {
      (global as any).setTimeout = realSetTimeout;
    }
  });
});
