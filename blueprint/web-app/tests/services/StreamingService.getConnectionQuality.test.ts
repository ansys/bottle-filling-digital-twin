import StreamingService from '../../src/services/StreamingService';

describe('StreamingService.getConnectionQuality branches', () => {
  let svc: any;

  beforeEach(() => {
    svc = StreamingService.getInstance() as any;
    // clear connection and callbacks
    svc.connection = null;
    svc.eventCallbacks = [];
  });

  afterEach(() => {
    // reset connection
    svc.connection = null;
    svc.eventCallbacks = [];
    jest.restoreAllMocks();
  });

  test('returns excellent for low latency and high bitrate', async () => {
    const mockConnection = {
      getStats: jest.fn().mockResolvedValue({
        forEach: (cb: any) => {
          cb({ type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.02 });
          cb({ type: 'outbound-rtp', mediaType: 'video', bytesSent: 200000, framesPerSecond: 60 });
        },
      }),
    };

    svc.connection = mockConnection;

    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('excellent');
    expect(res.latency).toBeGreaterThan(0);
    expect(res.bitrate).toBeGreaterThan(1000);
    expect(res.frameRate).toBe(60);
  });

  test('returns good for medium latency and medium bitrate', async () => {
    const mockConnection = {
      getStats: jest.fn().mockResolvedValue({
        forEach: (cb: any) => {
          cb({ type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.08 });
          cb({ type: 'outbound-rtp', mediaType: 'video', bytesSent: 100000, framesPerSecond: 30 });
        },
      }),
    };

    svc.connection = mockConnection;

    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('good');
    expect(res.latency).toBeGreaterThan(50);
    expect(res.bitrate).toBeGreaterThan(500);
  });

  test('returns fair for higher latency and lower bitrate', async () => {
    const mockConnection = {
      getStats: jest.fn().mockResolvedValue({
        forEach: (cb: any) => {
          cb({ type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.15 });
          cb({ type: 'outbound-rtp', mediaType: 'video', bytesSent: 40000, framesPerSecond: 24 });
        },
      }),
    };

    svc.connection = mockConnection;

    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('fair');
    expect(res.latency).toBeGreaterThan(100);
    expect(res.bitrate).toBeGreaterThan(200);
  });

  test('returns poor when latency present but metrics low', async () => {
    const mockConnection = {
      getStats: jest.fn().mockResolvedValue({
        forEach: (cb: any) => {
          cb({ type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.3 });
        },
      }),
    };

    svc.connection = mockConnection;

    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('poor');
    expect(res.latency).toBeGreaterThan(200);
  });

  test('returns unknown when getStats throws', async () => {
    const mockConnection = {
      getStats: jest.fn().mockRejectedValue(new Error('stats-fail')),
    };

    svc.connection = mockConnection;

    const res = await svc.getConnectionQuality();
    expect(res.quality).toBe('unknown');
    expect(res.latency).toBe(0);
    expect(res.bitrate).toBe(0);
  });
});

describe('StreamingService.getConnectionQuality branches', () => {
  let svc: any;

  beforeEach(() => {
    // Use the singleton instance and reset private fields
    svc = StreamingService.getInstance();
    // clear any existing connection
    (svc as any).connection = null;
  });

  function makeStats(reports: Array<Record<string, any>>) {
    return {
      forEach(cb: (r: any) => void) {
        reports.forEach(r => cb(r));
      },
    };
  }

  it('returns unknown when no connection', async () => {
    (svc as any).connection = null;
    const result = await svc.getConnectionQuality();
    expect(result.quality).toBe('unknown');
    expect(result.latency).toBe(0);
  });

  it('returns excellent for low latency and high bitrate', async () => {
    (svc as any).connection = {
      getStats: async () =>
        makeStats([
          { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.02 },
          { type: 'outbound-rtp', mediaType: 'video', bytesSent: 200000, framesPerSecond: 30 },
        ]),
    };

    const r = await svc.getConnectionQuality();
    expect(r.quality).toBe('excellent');
  });

  it('returns good for moderate latency and bitrate', async () => {
    (svc as any).connection = {
      getStats: async () =>
        makeStats([
          { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.08 },
          { type: 'outbound-rtp', mediaType: 'video', bytesSent: 100000, framesPerSecond: 24 },
        ]),
    };

    const r = await svc.getConnectionQuality();
    expect(r.quality).toBe('good');
  });

  it('returns fair for higher latency but some bitrate', async () => {
    (svc as any).connection = {
      getStats: async () =>
        makeStats([
          { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.15 },
          { type: 'outbound-rtp', mediaType: 'video', bytesSent: 40000, framesPerSecond: 15 },
        ]),
    };

    const r = await svc.getConnectionQuality();
    expect(r.quality).toBe('fair');
  });

  it('returns poor when latency present but bitrate low', async () => {
    (svc as any).connection = {
      getStats: async () =>
        makeStats([
          { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.3 },
        ]),
    };

    const r = await svc.getConnectionQuality();
    expect(r.quality).toBe('poor');
  });

  it('returns unknown when getStats throws', async () => {
    (svc as any).connection = {
      getStats: async () => {
        throw new Error('no stats');
      },
    };

    const r = await svc.getConnectionQuality();
    expect(r.quality).toBe('unknown');
  });
});
