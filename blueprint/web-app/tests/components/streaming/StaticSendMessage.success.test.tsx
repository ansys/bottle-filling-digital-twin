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
import LocalStream from '@/components/streaming/LocalStream/LocalStream.tsx';
import { OKASStream } from '@/components/streaming/OKASStream/OKASStream.tsx';

describe('Static sendMessage success paths', () => {
  beforeEach(() => jest.clearAllMocks());

  it('LocalStream.static sendMessage calls instance.sendMessage when ready', () => {
    const comp: any = new LocalStream({ server: 'srv', signalingPort: 1234, app: 'OmniverseApp' } as any);
    const sendMock = jest.fn();
    comp.appStreamer = { sendMessage: sendMock } as any;
    comp.state = { streamReady: true };

    (LocalStream as any).currentInstance = comp;

    LocalStream.sendMessage(JSON.stringify({ hello: 'world' }));

    expect(sendMock).toHaveBeenCalled();
  });

  it('OKASStream.static sendMessage calls instance.sendMessage when ready', () => {
    const comp: any = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' } as any);
    const sendMock = jest.fn();
    comp.appStreamer = { sendMessage: sendMock } as any;
    comp.state = { streamReady: true };

    (OKASStream as any).currentInstance = comp;

    OKASStream.sendMessage(JSON.stringify({ x: 1 }));

    expect(sendMock).toHaveBeenCalled();
  });
});
