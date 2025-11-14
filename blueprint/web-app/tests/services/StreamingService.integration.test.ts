import StreamingService from '../../src/services/StreamingService';

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
