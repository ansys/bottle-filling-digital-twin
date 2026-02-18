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
import SessionSelectionPanel from '@/components/common/SessionSelectionPanel/SessionSelectionPanel.tsx';
import * as Endpoints from '@/services/Endpoints.tsx';

describe('SessionSelectionPanel.pollSessionStatus', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('calls onSessionReady when sessionInfo.routes becomes available', async () => {
    jest.useFakeTimers();

    const onReady = jest.fn();
    const panel = new (SessionSelectionPanel as any)({ streamServer: 's', appId: 'a', appVersion: 'v', profile: 'p', onSessionReady: onReady });

    // prepare a sequence: first call returns empty routes, second call returns routes
    const seq = [
      { status: 200, data: { id: 's1', routes: {} } },
      { status: 200, data: { id: 's1', routes: { webRTC: { url: 'x' } } } },
    ];

    let calls = 0;
    jest.spyOn(Endpoints, 'getStreamingSessionInfo').mockImplementation(async () => {
      return seq[calls++] as any;
    });

    const p = (panel as any).pollSessionStatus('s1', 's', onReady);

    // advance timers to allow first wait and then second invocation
    // first poll executes immediately in loop; it will then wait 20s before next
    // advance by 20s to trigger next poll
    await Promise.resolve();
    jest.advanceTimersByTime(20000);

    await p;

    expect(onReady).toHaveBeenCalledWith('s1');
  });
});
