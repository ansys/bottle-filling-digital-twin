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

describe('LocalStream extra coverage', () => {
  it('warns when static sendMessage called without instance', () => {
    const origWarn = console.warn;
    const warnMock = jest.fn();
    console.warn = warnMock;

    LocalStream.sendMessage(JSON.stringify({ a: 1 }));
    expect(warnMock).toHaveBeenCalled();

    console.warn = origWarn;
  });

  it('handleRetry triggers initializeStream', () => {
    // @ts-ignore
    const inst = new LocalStream({ server: 's', signalingPort: 1234, app: 'app' });

    // override initializeStream with mock
    const initMock = jest.fn();
    // @ts-ignore
    inst.initializeStream = initMock;

    // Make setState synchronous so callbacks run immediately
    // @ts-ignore
    inst.setState = (state: any, cb?: () => void) => {
      // merge into existing state
      // @ts-ignore
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // @ts-ignore
    inst.setState({ error: 'err' });

    // call handleRetry
    // @ts-ignore
    (inst as any).handleRetry();

    expect(initMock).toHaveBeenCalled();
  });

  it('initializeStream handles waitForDOMElements rejection', async () => {
    // construct instance
    // @ts-ignore
    const inst = new LocalStream({ server: 's', signalingPort: 1234, app: 'app' });

    // stub waitForDOMElements to throw
    // @ts-ignore
    inst.waitForDOMElements = jest.fn().mockRejectedValue(new Error('no dom'));

    // Make setState synchronous so we can inspect state after call
    // @ts-ignore
    inst.setState = (state: any, cb?: () => void) => {
      // @ts-ignore
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // call initializeStream and ensure it sets error in state
    // @ts-ignore
    await (inst as any).initializeStream();

    // @ts-ignore
    expect(typeof inst.state.error).toBe('string');
    // @ts-ignore
    expect(inst.state.error).toMatch(/Connection error/);
  });
});
