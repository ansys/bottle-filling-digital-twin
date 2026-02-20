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

import StreamingService from '@/services/StreamingService.ts';

describe('StreamingService initializeStream (integration style)', () => {
  let originalRTCPeerConnection: any;
  let originalWebSocket: any;

  beforeAll(() => {
    originalRTCPeerConnection = (global as any).RTCPeerConnection;
    originalWebSocket = (global as any).WebSocket;
  });

  afterAll(() => {
    (global as any).RTCPeerConnection = originalRTCPeerConnection;
    (global as any).WebSocket = originalWebSocket;
  });

  test('initializeStream resolves when WebSocket opens', async () => {
    (global as any).RTCPeerConnection = class {
      onicecandidate: any = null;
      ontrack: any = null;
      onconnectionstatechange: any = null;
      addTrack() {}
      close() {}
      getStats = async () => ({ forEach: () => {} });
    } as any;

    class FakeWS {
      onopen: any;
      onerror: any;
      onmessage: any;
      constructor() {
        setTimeout(() => this.onopen && this.onopen(), 0);
      }
      send() {}
      close() {}
    }

    (global as any).WebSocket = FakeWS as any;

    const svc = StreamingService.getInstance();
    await expect(svc.initializeStream({ signalingServer: 's', signalingPort: 1, mediaServer: 'm', mediaPort: 2, backendUrl: 'b', sessionId: 's' })).resolves.toBeUndefined();
  });

  test('initializeStream rejects when WebSocket errors', async () => {
    (global as any).RTCPeerConnection = class {
      onicecandidate: any = null;
      ontrack: any = null;
      onconnectionstatechange: any = null;
      addTrack() {}
      close() {}
      getStats = async () => ({ forEach: () => {} });
    } as any;

    class BadWS {
      onopen: any;
      onerror: any;
      constructor() {
        setTimeout(() => this.onerror && this.onerror(new Error('fail')), 0);
      }
      send() {}
      close() {}
    }

    (global as any).WebSocket = BadWS as any;

    const svc = StreamingService.getInstance();
    await expect(svc.initializeStream({ signalingServer: 's', signalingPort: 1, mediaServer: 'm', mediaPort: 2, backendUrl: 'b', sessionId: 's' })).rejects.toBeDefined();
  });
});
