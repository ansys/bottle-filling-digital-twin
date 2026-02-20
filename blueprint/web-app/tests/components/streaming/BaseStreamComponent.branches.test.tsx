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

import { StreamEvent, eStatus, eAction } from '@nvidia/omniverse-webrtc-streaming-library';
import { BaseStreamComponent } from '@/components/streaming/BaseStreamComponent/BaseStreamComponent.tsx';

/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal subclass to exercise protected methods without mounting
class TestStream extends BaseStreamComponent<any, any> {
  constructor() {
    super({} as any);
    // initialize state similar to expected shape
    (this as any).state = { streamReady: false, isConnecting: false, error: null };
  }

  protected cleanup(): void {
    // no-op for test
  }
}

describe('BaseStreamComponent branches', () => {
  it('handleStart sets ready on success and calls onStart', () => {
    const calls: unknown[] = [];
    const onStartMock = (m: unknown) => calls.push(m);
    const inst = new TestStream();
    // Override props to include our mock
    Object.defineProperty(inst, 'props', {
      value: { onStart: onStartMock },
      writable: true,
      configurable: true,
    });

    // replace setState to capture changes
    (inst as any).__test_state = {};
    const orig = (inst as any).setState;
    (inst as any).setState = function (s: any) {
      if (typeof s === 'function') (inst as any).__test_state = s((inst as any).__test_state || {});
      else (inst as any).__test_state = { ...(inst as any).__test_state, ...s };
    };

    const msg: StreamEvent = { status: eStatus.success } as unknown as StreamEvent;
    // call protected method
    (inst as any).handleStart(msg);

    expect((inst as any).__test_state.streamReady).toBe(true);
    expect((inst as any).__test_state.isConnecting).toBe(false);
    expect((inst as any).__test_state.error).toBeNull();
    expect(calls.length).toBe(1);

    // restore
    (inst as any).setState = orig;
  });

  it('handleStart handles warning and error statuses', () => {
    const inst = new TestStream();
    // capture state
    (inst as any).__test_state = {};
    const orig = (inst as any).setState;
    (inst as any).setState = function (s: any) {
      if (typeof s === 'function') (inst as any).__test_state = s((inst as any).__test_state || {});
      else (inst as any).__test_state = { ...(inst as any).__test_state, ...s };
    };

    const warnMsg: StreamEvent = { status: eStatus.warning } as unknown as StreamEvent;
    (inst as any).handleStart(warnMsg);
    // warning should not set error
    expect((inst as any).__test_state.error).toBeUndefined();

    const errMsg: StreamEvent = { status: eStatus.error, info: 'bad' } as unknown as StreamEvent;
    (inst as any).handleStart(errMsg);
    expect((inst as any).__test_state.isConnecting).toBe(false);
    expect((inst as any).__test_state.error).toMatch(/bad/);

    (inst as any).setState = orig;
  });

  it('handleStop covers terminate branches', () => {
    const inst = new TestStream();
    (inst as any).__test_state = {};
    const orig = (inst as any).setState;
    (inst as any).setState = function (s: any) {
      if (typeof s === 'function') (inst as any).__test_state = s((inst as any).__test_state || {});
      else (inst as any).__test_state = { ...(inst as any).__test_state, ...s };
    };

    const tErr = { action: eAction.terminate, status: eStatus.error, info: 'lost' } as unknown as StreamEvent;
    (inst as any).handleStop(tErr);
    expect((inst as any).__test_state.error).toMatch(/lost/);

    const tSucc = { action: eAction.terminate, status: eStatus.success } as unknown as StreamEvent;
    (inst as any).handleStop(tSucc);
    expect((inst as any).__test_state.error).toBeNull();

    const tWarn = { action: eAction.terminate, status: eStatus.warning } as unknown as StreamEvent;
    (inst as any).handleStop(tWarn);
    expect((inst as any).__test_state.error).toBeNull();

    (inst as any).setState = orig;
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */