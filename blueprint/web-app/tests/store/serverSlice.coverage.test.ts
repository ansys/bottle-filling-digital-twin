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

import serverReducer, { serverActions } from '@/store/slices/serverSlice.ts';

describe('server slice coverage', () => {
  const initial = (serverReducer(undefined, { type: 'INIT' } as any) as unknown) as any;

  test('set stream and app servers and recent list behavior', () => {
    const s1 = serverReducer(initial, serverActions.setStreamServer('s1'));
    expect(s1.streamServer).toBe('s1');
    expect(s1.recentServers.streamServers[0]).toBe('s1');

    const s2 = serverReducer(s1, serverActions.setAppServer('a1'));
    expect(s2.appServer).toBe('a1');
    expect(s2.recentServers.appServers[0]).toBe('a1');

    // setServers with both values updates recent lists
    const s3 = serverReducer(s2, serverActions.setServers('s2', 'a2'));
    expect(s3.streamServer).toBe('s2');
    expect(s3.appServer).toBe('a2');
    expect(s3.recentServers.streamServers[0]).toBe('s2');
  });

  test('update health and clear recent servers', () => {
    const s1 = serverReducer(initial, serverActions.updateStreamServerHealth({ version: '1.2' }));
    expect(s1.streamServerHealth.version).toBe('1.2');
    expect(s1.streamServerHealth.lastChecked).not.toBeNull();

    const s2 = serverReducer(s1, serverActions.addRecentStreamServer('sX'));
    expect(s2.recentServers.streamServers[0]).toBe('sX');

  const s3 = serverReducer(s2, { type: 'server/clearRecentServers' });
    expect(s3.recentServers.streamServers.length).toBe(0);
    expect(s3.recentServers.appServers.length).toBe(0);
  });

  test('error handling and reset', () => {
    const s1 = serverReducer(initial, serverActions.setServerError('stream', 'boom'));
    expect(s1.lastError).toBeDefined();
    expect(s1.lastError?.server).toBe('stream');

    const s2 = serverReducer(s1, serverActions.clearServerError());
    expect(s2.lastError).toBeNull();

    const s3 = serverReducer(s2, serverActions.resetServerState());
    expect(s3).toEqual(serverReducer(undefined, { type: 'INIT' } as any));
  });
});
