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

import LocalStream from '@/components/streaming/LocalStream/LocalStream.tsx';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('LocalStream branch tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('static sendMessage warns when no instance or not ready', () => {
    // ensure no instance
    (LocalStream as any).currentInstance = null;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    LocalStream.sendMessage(JSON.stringify({ a: 1 }));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('initializeStream sets error when AppStreamer.connect rejects', async () => {
    const props: any = { server: 's', signalingPort: 1234, app: 'a' };
    const comp: any = new LocalStream(props);
    // stub waitForDOMElements to avoid DOM polling
    comp.waitForDOMElements = jest.fn().mockResolvedValue(undefined);
    // make AppStreamer.connect reject
    (AppStreamer as any).connect = jest.fn().mockRejectedValue(new Error('connect-fail'));
    // capture setState
    comp.setState = jest.fn();
    await comp['initializeStream']();
    // setState should have been called with an error
    const calls = (comp.setState as jest.Mock).mock.calls;
    expect(calls.some(c => c[0] && c[0].error && /connect-fail/.test(c[0].error))).toBe(true);
  });
});
/* eslint-disable @typescript-eslint/no-explicit-any */

describe('LocalStream branches', () => {
  beforeEach(() => jest.clearAllMocks());

  it('static sendMessage warns when no active instance', () => {
    // ensure no active instance

    (LocalStream as any).currentInstance = null;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    LocalStream.sendMessage(JSON.stringify({ x: 1 }));
    expect(warnSpy).toHaveBeenCalledWith('LocalStream: No active instance or stream not ready');

    warnSpy.mockRestore();
  });

  it('initializeStream handles connection error and sets state', async () => {

    const comp: any = new LocalStream({ server: 'srv', signalingPort: 1234, app: 'app' } as any);

    // stub waitForDOMElements to throw
    comp.waitForDOMElements = jest.fn().mockRejectedValue(new Error('DOM missing'));
    comp.setState = jest.fn();

    await comp['initializeStream']();

    expect(comp.setState).toHaveBeenCalled();
    const last = (comp.setState as jest.Mock).mock.calls.slice(-1)[0][0];
    expect(last.error).toMatch(/Connection error/);
  });
});
