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
import StreamingService from '@/services/StreamingService.ts';

describe('StreamingService deeper branches', () => {
  let originalWS: any;
  let originalPC: any;

  class FakeWebSocket {
    static instances: FakeWebSocket[] = [];
    public onopen: (() => void) | null = null;
    public onerror: ((e: any) => void) | null = null;
    public onmessage: ((m: { data: string }) => void) | null = null;
    public sent: any[] = [];
    public closed = false;
    constructor(public url: string) {
      FakeWebSocket.instances.push(this);
      // simulate async open
      setTimeout(() => this.onopen && this.onopen(), 0);
    }
    send(data: any) {
      this.sent.push(data);
    }
    close() {
      this.closed = true;
    }
  }

  class FakeRTCPeerConnection {
    public onicecandidate: ((e: any) => void) | null = null;
    public ontrack: ((e: any) => void) | null = null;
    public onconnectionstatechange: (() => void) | null = null;
    public connectionState = 'new';
    public addedTracks: any[] = [];
    addTrack(track: any, stream: any) {
      this.addedTracks.push({ track, stream });
      return {} as any;
    }
    close() {
      this.connectionState = 'closed';
    }
    async getStats() {
      return new Map();
    }
  }

  beforeEach(() => {
    // reset singleton
    (StreamingService as any).instance = undefined;
    // stub globals
    originalWS = (global as any).WebSocket;
    originalPC = (global as any).RTCPeerConnection;
    (global as any).WebSocket = FakeWebSocket as any;
    (global as any).RTCPeerConnection = FakeRTCPeerConnection as any;
  });

  afterEach(() => {
    // restore
    (global as any).WebSocket = originalWS;
    (global as any).RTCPeerConnection = originalPC;
    FakeWebSocket.instances = [];
    const svc = StreamingService.getInstance();
    try {
      svc.disconnect();
    } catch {
      // ignore
    }
  });

  test('initializeStream connects to signaling and emits connected event', async () => {
    const svc = StreamingService.getInstance();

    const events: any[] = [];
    svc.onStreamEvent((e: any) => events.push(e));

    await svc.initializeStream({ signalingServer: 'localhost', signalingPort: 1234 } as any);

    // WebSocket instance should be created and onopen simulated
    expect(FakeWebSocket.instances.length).toBeGreaterThan(0);
    // the connected event should have been emitted
    const found = events.find(e => e.action === 'signaling' && e.status === 'connected');
    expect(found).toBeTruthy();
  });

  test('icecandidate event sends candidate to signaling socket', async () => {
    const svc = StreamingService.getInstance();
    const events: any[] = [];
    svc.onStreamEvent((e: any) => events.push(e));

    await svc.initializeStream({ signalingServer: 'host', signalingPort: 9 } as any);

    // There should be a fake ws
    const ws = FakeWebSocket.instances[0];
    expect(ws).toBeDefined();

    // connection should be our fake peer connection
    const pc = svc['connection'];
    expect(pc).toBeDefined();

    // simulate ice candidate event
    const candidate = { candidate: 'candidate:1' };
    if (pc && pc.onicecandidate) pc.onicecandidate({ candidate } as RTCPeerConnectionIceEvent);

    // signaling socket should have received a message
    expect(ws.sent.length).toBeGreaterThan(0);
    const parsed = JSON.parse(ws.sent[0]);
    expect(parsed.type).toBe('ice-candidate');
    expect(parsed.candidate).toEqual(candidate);
  });

  test('signaling onmessage triggers signaling message event', async () => {
    const svc = StreamingService.getInstance();
    const events: any[] = [];
    svc.onStreamEvent((e: any) => events.push(e));

    await svc.initializeStream({ signalingServer: 's', signalingPort: 1 } as any);

    const ws = FakeWebSocket.instances[0];
    // simulate receiving a signaling message
    const msg = { type: 'offer', sdp: 'v=0' };
    if (ws.onmessage) ws.onmessage({ data: JSON.stringify(msg) });

    // handleSignalingMessage logs a 'signaling' message event
    const m = events.find((e: any) => e.action === 'signaling' && e.status === 'message');
    expect(m).toBeTruthy();
  });

  test('ontrack handler emits track received', async () => {
    const svc = StreamingService.getInstance();
    const events: any[] = [];
    svc.onStreamEvent((e: any) => events.push(e));

    await svc.initializeStream({ signalingServer: 'x', signalingPort: 2 } as any);

    const pc = svc['connection'];
    // simulate ontrack
    if (pc && pc.ontrack) pc.ontrack({} as RTCTrackEvent);

    const found = events.find((e: any) => e.action === 'track' && e.status === 'received');
    expect(found).toBeTruthy();
  });

  test('getConnectionQuality error branch returns unknown and logs error', async () => {
    const svc = StreamingService.getInstance();
    const events: any[] = [];
    svc.onStreamEvent((e: any) => events.push(e));

    // make a connection whose getStats throws
    svc['connection'] = {
      getStats: async () => { throw new Error('boom'); }
    } as any;

    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('unknown');
    const err = events.find((e: any) => e.action === 'getQuality' && e.status === 'failed');
    expect(err).toBeTruthy();
  });
});

describe('StreamingService deeper branches', () => {
  beforeEach(() => {
    // reset singleton
    (StreamingService as any).instance = undefined;

    // Fake RTCPeerConnection implementation
    // @ts-expect-ignore
    global.RTCPeerConnection = class FakeRTCPeerConnection {
      static generateCertificate(_keygenAlgorithm: AlgorithmIdentifier): Promise<any> {
        return Promise.resolve({});
      }
      // Required properties for compatibility
      canTrickleIceCandidates: boolean = true;
      currentLocalDescription: any = null;
      currentRemoteDescription: any = null;
      iceConnectionState: string = 'new';
      iceGatheringState: string = 'complete';
      localDescription: any = null;
      peerIdentity: any = null;
      remoteDescription: any = null;
      sctp: any = null;
      signalingState: string = 'stable';
      onicecandidate: any = null;
      ontrack: any = null;
      onconnectionstatechange: any = null;
      connectionState = 'connected';
      addTrack = jest.fn();
      close = jest.fn();
      getStats = jest.fn().mockResolvedValue(new Map());
      addIceCandidate = jest.fn();
      createOffer = jest.fn();
      createAnswer = jest.fn();
      setLocalDescription = jest.fn();
      setRemoteDescription = jest.fn();
      addTransceiver = jest.fn();
      getTransceivers = jest.fn();
      getSenders = jest.fn();
      getReceivers = jest.fn();
      removeTrack = jest.fn();
      restartIce = jest.fn();
      constructor() {}
    } as any;

    // Fake WebSocket that we can trigger open/error from test
    // @ts-expect-error - test helper global
    global.__createdWS = null;
    // @ts-expect-error - test helper WebSocket mock
    global.WebSocket = class {
      url: string;
      onopen: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      onmessage: ((m: any) => void) | null = null;
      send = jest.fn();
      close = jest.fn();
      constructor(url: string) {
        this.url = url;
        // expose for test
        // @ts-expect-error - test helper global
        global.__createdWS = this;
      }
      triggerOpen() {
        if (this.onopen) this.onopen();
      }
      triggerError(e: any) {
        if (this.onerror) this.onerror(e);
      }
      triggerMessage(data: any) {
        if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
      }
    };
  });

  afterEach(() => {
    // cleanup globals
    // @ts-expect-error - test cleanup
    delete global.RTCPeerConnection;
    // @ts-expect-error - test cleanup
    delete global.WebSocket;
    // @ts-expect-error - test cleanup
    delete global.__createdWS;
  });

  test('initializeStream connects to signaling and sends ice candidate when available', async () => {
    const svc = StreamingService.getInstance();

    const initPromise = svc.initializeStream({ signalingServer: 'srv', signalingPort: 1111, mediaPort: 0 } as any);

    // get created fake websocket and trigger open to resolve connectSignaling
    // @ts-expect-error - test helper global
    const ws = global.__createdWS;
    expect(ws).toBeTruthy();
    ws.triggerOpen();

    await initPromise;

    // connection should be set
    expect((svc as any).connection).toBeTruthy();
    // simulate icecandidate event
    const candidate = { candidate: { candidate: 'cand-1' } };
    (svc as any).connection.onicecandidate(candidate);

    // websocket should have been used to send ice candidate
    expect(ws.send).toHaveBeenCalledWith(JSON.stringify({ type: 'ice-candidate', candidate: candidate.candidate }));
  });

  test('connectSignaling rejects when socket errors', async () => {
    const svc = StreamingService.getInstance();
    // call private method directly
    const connectPromise = (svc as any).connectSignaling({ signalingServer: 'bad', signalingPort: 1, mediaPort: 0 } as any);
    // @ts-expect-error - test helper global
    const ws = global.__createdWS;
    expect(ws).toBeTruthy();
    ws.triggerError(new Error('fail'));
    await expect(connectPromise).rejects.toBeTruthy();
  });

  test('startVideoStream attaches media and throws when no connection', async () => {
    const svc = StreamingService.getInstance();
    // when no connection, should throw
    await expect(svc.startVideoStream('vid')).rejects.toThrow('Connection not initialized');

    // set a fake connection to capture addTrack calls
    (svc as any).connection = new (global as any).RTCPeerConnection();

    // mock getUserMedia
    const mockTrack = { stop: jest.fn(), enabled: true };
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [mockTrack], getAudioTracks: () => [mockTrack], getVideoTracks: () => [mockTrack] }) }
    });

    // create video element
    const v = document.createElement('video');
    v.id = 'vid';
    document.body.appendChild(v);

    await svc.startVideoStream('vid');

    // addTrack should have been called
    expect((svc as any).connection.addTrack).toHaveBeenCalled();

    // cleanup
    document.body.removeChild(v);
  });

  test('getConnectionQuality returns unknown on getStats error', async () => {
    const svc = StreamingService.getInstance();
    (svc as any).connection = new (global as any).RTCPeerConnection();
    (svc as any).connection.getStats = jest.fn().mockRejectedValue(new Error('stat-fail'));

    const q = await svc.getConnectionQuality();
    expect(q.quality).toBe('unknown');
  });

  test('onStreamEvent and offStreamEvent manage callbacks', () => {
    const svc = StreamingService.getInstance();
    const cb = jest.fn();
    svc.onStreamEvent(cb);
    (svc as any).logEvent('info', 't', 'ok', 'm');
    expect(cb).toHaveBeenCalled();
    svc.offStreamEvent(cb);
    cb.mockClear();
    (svc as any).logEvent('info', 't2', 'ok', 'm2');
    expect(cb).not.toHaveBeenCalled();
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */