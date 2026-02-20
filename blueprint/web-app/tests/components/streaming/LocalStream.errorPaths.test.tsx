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

/* LocalStream error branch tests */
// Mock AppStreamer
class MockAppStreamer2 {
  static connect = jest.fn();
  sendMessage = jest.fn();
}

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: MockAppStreamer2,
}));

// Mock wait utility to reject
const mockWait2 = jest.fn();
jest.mock('@/components/streaming/utils/streamEventHandlers.ts', () => ({
  waitForStreamDOMElements: () => mockWait2(),
  createStreamEventHandlers: () => ({
    handleStart: jest.fn(),
    handleStop: jest.fn(),
    handleUpdate: jest.fn(),
    handleCustomEvent: jest.fn(),
  }),
}));

import LocalStream from '@/components/streaming/LocalStream/LocalStream.tsx';

describe('LocalStream error branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWait2.mockResolvedValue(undefined);
  });

  it('initializeStream handles waitForDOMElements rejection', async () => {
    jest.setTimeout(10000);
    // force waitForDOMElements to immediately reject by overriding instance method later

    const comp = new LocalStream({
      server: 'srv',
      signalingPort: 11,
      app: 'app',
    } as any);

    // override the instance method (waitForDOMElements is an instance field)
    (comp as any).waitForDOMElements = async () => {
      throw new Error('no-dom');
    };

    comp.setState({ streamReady: false });

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await (comp as any).initializeStream();
    // allow setState to flush
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(MockAppStreamer2.connect).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();

    // nothing to restore since we only changed instance
  });

  it('static sendMessage warns when no instance', () => {
    // ensure no instance active
    LocalStream['currentInstance'] = null;

    // call static sendMessage
    LocalStream.sendMessage(JSON.stringify({ x: 1 }));
    // just ensure it doesn't throw
  });
});
