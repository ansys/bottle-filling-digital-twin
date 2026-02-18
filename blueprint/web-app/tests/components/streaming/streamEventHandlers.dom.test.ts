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

import { waitForStreamDOMElements } from '@/components/streaming/utils/streamEventHandlers.ts';

describe('waitForStreamDOMElements', () => {
  afterEach(() => {
    // clean up DOM
    document.body.innerHTML = '';
    // restore timers
    try {
      // eslint-disable-next-line jest/no-export
      jest.useRealTimers();
    } catch (e) {
      // ignore
    }
  });

  it('resolves when elements are present', async () => {
    const video = document.createElement('video');
    video.id = 'remote-video';
    const audio = document.createElement('audio');
    audio.id = 'remote-audio';
    const msg = document.createElement('div');
    msg.id = 'message-display';
    document.body.appendChild(video);
    document.body.appendChild(audio);
    document.body.appendChild(msg);

    await expect(waitForStreamDOMElements('TestComp')).resolves.toBeUndefined();
  });

  it('rejects after timeout when elements do not appear', async () => {
    // use fake timers to advance the polling loop
    jest.useFakeTimers();

    const p = waitForStreamDOMElements('TestComp');

    // advance enough time to trigger maxAttempts (50 * 100ms = 5000ms)
    jest.advanceTimersByTime(5000 + 100);

    await expect(p).rejects.toThrow(/Timeout waiting for DOM elements/i);
  });
});
