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

describe('serverSlice reducers', () => {
  it('returns initial state', () => {
    const s = serverReducer(undefined, { type: '@@INIT' });
    expect(s).toBeDefined();
  });

  it('sets servers via setServers', () => {
    const initial = serverReducer(undefined, { type: '@@INIT' });
    const next = serverReducer(initial, serverActions.setServers('s1', 'a1'));
    expect(next.streamServer).toBe('s1');
    expect(next.appServer).toBe('a1');
  });

  it('handles setServerError and clear', () => {
    const state = serverReducer(undefined, { type: '@@INIT' });
    const errored = serverReducer(state, serverActions.setServerError('stream', 'boom'));
    expect(errored.lastError).toBeDefined();
    const cleared = serverReducer(errored, serverActions.clearServerError());
    expect(cleared.lastError).toBeNull();
  });
});
import {
  selectServers,
  selectRecentServers,
  selectIsAnyServerConnected,
} from '@/store/slices/serverSlice.ts';

describe('serverSlice reducer & selectors', () => {
  test('setStreamServer and setAppServer update servers and recent lists', () => {
    let state = serverReducer(undefined as any, { type: 'unknown' } as any);
    state = serverReducer(state, serverActions.setStreamServer('s1'));
    expect(selectServers({ server: state }).streamServer).toBe('s1');
    state = serverReducer(state, serverActions.setAppServer('a1'));
    expect(selectServers({ server: state }).appServer).toBe('a1');
    const recent = selectRecentServers({ server: state });
    expect(recent.streamServers[0]).toBe('s1');
    expect(recent.appServers[0]).toBe('a1');
  });

  test('addRecent stream/app maintains uniqueness and max size', () => {
    let state = serverReducer(undefined as any, { type: 'unknown' } as any);
    for (let i = 0; i < 7; i++) {
      state = serverReducer(state, serverActions.addRecentStreamServer('s' + i));
    }
    const recent = selectRecentServers({ server: state });
    expect(recent.streamServers.length).toBeLessThanOrEqual(5);
    // add duplicate
    state = serverReducer(state, serverActions.addRecentStreamServer('s6'));
    expect(selectRecentServers({ server: state }).streamServers[0]).toBe('s6');
  });

  test('set server statuses and selector for any connected', () => {
    let state = serverReducer(undefined as any, { type: 'unknown' } as any);
    state = serverReducer(state, serverActions.setStreamServerStatus('connecting'));
    expect(selectIsAnyServerConnected({ server: state })).toBe(false);
    state = serverReducer(state, serverActions.setAppServerStatus('connected'));
    expect(selectIsAnyServerConnected({ server: state })).toBe(true);
  });

  test('set and clear server error', () => {
    let state = serverReducer(undefined as any, { type: 'unknown' } as any);
    state = serverReducer(state, serverActions.setServerError('stream', 'boom'));
    expect(selectRecentServers({ server: state })).toBeDefined();
    state = serverReducer(state, serverActions.clearServerError());
    expect(state.lastError).toBeNull();
  });
});
