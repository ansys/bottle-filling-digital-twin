import StreamingService from '../../src/services/StreamingService';

describe('StreamingService (unit)', () => {
  let service: any;

  beforeEach(() => {
    // reset singleton
    (StreamingService as any).instance = undefined;
    service = StreamingService.getInstance();
  });

  afterEach(() => {
    // ensure cleanup
    service.disconnect();
  });

  test('getConnectionQuality returns unknown when no connection', async () => {
    const quality = await service.getConnectionQuality();
    expect(quality).toEqual({
      quality: 'unknown',
      latency: 0,
      bitrate: 0,
      frameRate: 0,
    });
  });

  test('getConnectionQuality parses stats and returns excellent', async () => {
    // mock a peer connection with getStats returning two reports
    const mockReport1 = { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.02 };
    const mockReport2 = { type: 'outbound-rtp', mediaType: 'video', bytesSent: 200000, framesPerSecond: 30 };
    const stats = { forEach: (cb: Function) => { cb(mockReport1); cb(mockReport2); } };

    const mockConnection = { getStats: jest.fn().mockResolvedValue(stats), close: jest.fn() };
    service.connection = mockConnection;

    const result = await service.getConnectionQuality();
    expect(result.quality).toBe('excellent');
    expect(result.latency).toBeGreaterThan(0);
    expect(result.bitrate).toBeGreaterThan(1000);
    expect(result.frameRate).toBe(30);
  });

  test('onStreamEvent/offStreamEvent and logEvent route events to callbacks', () => {
    const cb = jest.fn();
    service.onStreamEvent(cb);
    // call private logEvent
    (service as any).logEvent('info', 'test', 'ok', 'message');
    expect(cb).toHaveBeenCalled();

    service.offStreamEvent(cb);
    (service as any).logEvent('info', 'x', 'y', 'z');
    // callback should not be called again
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('stopVideoStream stops tracks and clears localStream', () => {
    const stop = jest.fn();
    const track = { stop };
    const localStream = { getTracks: () => [track] };
    service.localStream = localStream;
    service.stopVideoStream();
    expect(stop).toHaveBeenCalled();
    expect(service.localStream).toBeNull();
  });

  test('toggleAudio and toggleVideo update track enabled flags', () => {
    const audioTrack = { enabled: true, stop: jest.fn() };
    const videoTrack = { enabled: true, stop: jest.fn() };
    const localStream = { getAudioTracks: () => [audioTrack], getVideoTracks: () => [videoTrack] };
    service.localStream = localStream;

    service.toggleAudio(true);
    expect(audioTrack.enabled).toBe(false);

    service.toggleVideo(true);
    expect(videoTrack.enabled).toBe(false);
  });

  test('disconnect closes connection and signalingSocket and clears state', () => {
    const connClose = jest.fn();
    const wsClose = jest.fn();
    service.connection = { close: connClose } as any;
    service.signalingSocket = { close: wsClose } as any;
    const stop = jest.fn();
    service.localStream = { getTracks: () => [{ stop }] } as any;

    service.disconnect();

    expect(connClose).toHaveBeenCalled();
    expect(wsClose).toHaveBeenCalled();
    expect(service.connection).toBeNull();
    expect(service.signalingSocket).toBeNull();
    expect(service.localStream).toBeNull();
  });
});

describe('StreamingService', () => {
  beforeEach(() => {
    // reset singleton
    // @ts-ignore
    StreamingService.instance = undefined;
  });

  test('getConnectionQuality returns unknown when no connection', async () => {
    const svc = StreamingService.getInstance();
    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('unknown');
  });

  test('getConnectionQuality computes metrics from stats', async () => {
    const svc = StreamingService.getInstance();
    // @ts-ignore assign fake connection with getStats
    svc['connection'] = {
      getStats: async () => new Map([
        ['a', { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.02 }],
        ['b', { type: 'outbound-rtp', mediaType: 'video', bytesSent: 200000, framesPerSecond: 30 }],
      ])
    } as any;

    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('excellent');
    expect(res.frameRate).toBe(30);
    expect(res.bitrate).toBeGreaterThan(0);
  });

  test('logEvent notifies subscribers', () => {
    const svc = StreamingService.getInstance();
    const cb = jest.fn();
    svc.onStreamEvent(cb);
    // @ts-ignore access private method
    svc['logEvent']('info', 'x', 'ok', 'm');
    expect(cb).toHaveBeenCalled();
    svc.offStreamEvent(cb);
    cb.mockClear();
    // @ts-ignore
    svc['logEvent']('info', 'x2', 'ok', 'm2');
    expect(cb).not.toHaveBeenCalled();
  });
});
