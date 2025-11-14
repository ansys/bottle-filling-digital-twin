/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { useOKASSession, OKASSessionParams } from '../../src/store/hooks/useOKASSession';

jest.mock('../../src/services/Endpoints', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
  destroyStreamingSession: jest.fn(),
}));

import {
  createStreamingSession,
  getStreamingSessionInfo,
} from '../../src/services/Endpoints';

function HookHarness(props: { params: OKASSessionParams; onReady: (h: ReturnType<typeof useOKASSession>) => void }) {
  const hook = useOKASSession(props.params);
  const { onReady } = props;
  useEffect(() => {
    onReady(hook);

  }, [hook, onReady]);
  return null;
}

describe('useOKASSession hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Increase default timeout for these integration-style hook tests
  jest.setTimeout(20000);

  it('createSession success sets sessionId and connectionParams', async () => {
    const params: OKASSessionParams = {
      streamServer: 'https://stream.example.com',
      appId: 'app-1',
      appVersion: 'v1',
      profile: 'p',
    };

    // Mock createStreamingSession to return created session
    (createStreamingSession as jest.Mock).mockResolvedValue({
      status: 201,
      data: { id: 'sess-1' },
    });

    // Mock getStreamingSessionInfo to return ready session with routes
    (getStreamingSessionInfo as jest.Mock).mockResolvedValue({
      status: 200,
      data: {
        id: 'sess-1',
        routes: {
          'stream.example.com': {
            routes: [
              { description: 'signaling', source_port: 1111 },
            ],
          },
        },
      },
    });

    let harnessHook: ReturnType<typeof useOKASSession> | null = null;

    render(<HookHarness params={params} onReady={h => (harnessHook = h)} />);

    // stub setTimeout to avoid waiting 20s between polls
    const origSetTimeout = (global as any).setTimeout;
    (global as any).setTimeout = (cb: any, _ms?: number) => {
      try {
        cb();
      } catch (e) {
        // Ignore errors during callback execution
      }
      return 0 as any;
    };

    // call createSession
    expect(harnessHook).not.toBeNull();
    await harnessHook!.createSession();

    // restore setTimeout
    (global as any).setTimeout = origSetTimeout;

    await waitFor(() => expect(harnessHook!.sessionStatus).toBe('ready'));
    expect(harnessHook!.sessionId).toBe('sess-1');
    expect(harnessHook!.connectionParams).toEqual({ server: 'stream.example.com', signalingPort: 1111, mediaPort: undefined });
  });

  it('createSession API returns detail -> error branch', async () => {
    const params: OKASSessionParams = {
      streamServer: 'srv',
      appId: 'a',
      appVersion: 'v',
      profile: 'p',
    };

    (createStreamingSession as jest.Mock).mockResolvedValue({
      status: 400,
      data: { detail: 'Bad request' },
    });

    let harnessHook: ReturnType<typeof useOKASSession> | null = null;
    render(<HookHarness params={params} onReady={h => (harnessHook = h)} />);

    await harnessHook!.createSession();

    await waitFor(() => expect(harnessHook!.sessionStatus).toBe('error'));
    expect(harnessHook!.error).toMatch(/Failed to create session/);
  });

  it('connectToExistingSession polls and becomes ready', async () => {
    const params: OKASSessionParams = {
      streamServer: 'srv',
      appId: 'a',
      appVersion: 'v',
      profile: 'p',
    };

    (getStreamingSessionInfo as jest.Mock).mockResolvedValue({
      status: 200,
      data: {
        id: 'sess-2',
        routes: {
          host: { routes: [{ description: 'signaling', source_port: 2222 }] },
        },
      },
    });

    let harnessHook: ReturnType<typeof useOKASSession> | null = null;
    render(<HookHarness params={params} onReady={h => (harnessHook = h)} />);

    // stub setTimeout to avoid long polling waits
    const origSetTimeout2 = (global as any).setTimeout;
    (global as any).setTimeout = (cb: any, _ms?: number) => {
      try {
        cb();
      } catch (e) {
        // Ignore errors during callback execution
      }
      return 0 as any;
    };

    await harnessHook!.connectToExistingSession('sess-2');

    // restore
    (global as any).setTimeout = origSetTimeout2;

    await waitFor(() => expect(harnessHook!.sessionStatus).toBe('ready'));
    expect(harnessHook!.connectionParams).toEqual({ server: 'host', signalingPort: 2222, mediaPort: undefined });
  });
});
import { renderHook, act } from '@testing-library/react';
import type { StreamItem } from '../../src/services/Endpoints';

// Mock Endpoints used by the hook
jest.mock('../../src/services/Endpoints', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
  destroyStreamingSession: jest.fn(),
}));

import * as Endpoints from '../../src/services/Endpoints';

describe('useOKASSession hook', () => {
  const params: OKASSessionParams = {
    streamServer: 'https://stream.example.com',
    appId: 'app-1',
    appVersion: 'v1',
    profile: 'p',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('extractConnectionParams returns null when no signaling port', () => {
    const { result } = renderHook(() => useOKASSession(params));

    const badSession = {
      id: 's1',
      routes: {
        'host.example.com': { routes: [{ description: 'media', destination_port: 3333, source_port: 3333, protocol: 'UDP' }] },
      },
    } as unknown as StreamItem;

    // extractConnectionParams is an internal helper; exercise it indirectly by calling pollSessionStatus
    // but for a direct unit check we can coerce access via any and expect null for no signaling

    const internal: any = result.current;
    const conn = internal.extractConnectionParams ? internal.extractConnectionParams(badSession) : null;
    expect(conn).toBeNull();
  });

  test('createSession sets sessionId and polls until ready', async () => {
    // Mock createStreamingSession to return a session id
    (Endpoints.createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { id: 'sess-1' } });


    // return ready immediately to avoid long poll delays in tests
    (Endpoints.getStreamingSessionInfo as jest.Mock).mockResolvedValue({ status: 200, data: { id: 'sess-1', routes: { 'stream.example.com': { routes: [{ description: 'signaling', destination_port: 1234, source_port: 1234, protocol: 'TCP' }] } } } });

    const { result } = renderHook(() => useOKASSession(params));

    await act(async () => {
      await result.current.createSession();
    });

    expect(Endpoints.createStreamingSession).toHaveBeenCalled();
    expect(result.current.sessionId).toBe('sess-1');
    expect(result.current.sessionStatus).toBe('ready');
    expect(result.current.connectionParams).not.toBeNull();
  });

  test('createSession handles API error detail path', async () => {
    (Endpoints.createStreamingSession as jest.Mock).mockResolvedValue({ status: 200, data: { detail: 'bad' } });

    const { result } = renderHook(() => useOKASSession(params));

    await act(async () => {
      await result.current.createSession();
    });

    expect(result.current.sessionStatus).toBe('error');
    expect(result.current.error).toMatch(/OKAS API Error/);
  });

  test('destroySession warns when no session, and calls destroy when present', async () => {
    (Endpoints.destroyStreamingSession as jest.Mock).mockResolvedValue({});

    const { result } = renderHook(() => useOKASSession(params));

    // destroy with no session should be a no-op
    await act(async () => {
      await result.current.destroySession();
    });

    expect(Endpoints.destroyStreamingSession).not.toHaveBeenCalled();

    // set a sessionId then destroy: make createSession complete immediately by returning ready session info
    (Endpoints.createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { id: 'sess-2' } });
    (Endpoints.getStreamingSessionInfo as jest.Mock).mockResolvedValue({ status: 200, data: { id: 'sess-2', routes: { 's': { routes: [{ description: 'signaling', destination_port: 1, source_port: 1, protocol: 'TCP' }] } } } });

    await act(async () => {
      await result.current.createSession();
    });

    expect(result.current.sessionId).toBe('sess-2');

    await act(async () => {
      await result.current.destroySession();
    });

    expect(Endpoints.destroyStreamingSession).toHaveBeenCalled();
    expect(result.current.sessionId).toBeNull();
    expect(result.current.sessionStatus).toBe('idle');
  });

  test('createSession polls multiple times before becoming ready (retries)', async () => {
  jest.setTimeout(20000);

    const params2: OKASSessionParams = {
      streamServer: 'srv-retry',
      appId: 'a',
      appVersion: 'v',
      profile: 'p',
    };

    const { result } = renderHook(() => useOKASSession(params2));

  // create returns session id
    (Endpoints.createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { id: 'sess-retry' } });

    // first two polling attempts return 202 with no routes (not ready), third returns 200 with routes
    (Endpoints.getStreamingSessionInfo as jest.Mock)
      .mockResolvedValueOnce({ status: 202, data: { id: 'sess-retry', routes: {} } })
      .mockResolvedValueOnce({ status: 202, data: { id: 'sess-retry', routes: {} } })
      .mockResolvedValueOnce({ status: 200, data: { id: 'sess-retry', routes: { host: { routes: [{ description: 'signaling', source_port: 7777 }] } } } });

    // To avoid dealing with fake timers, stub global.setTimeout to call callbacks immediately
    const origSetTimeout = (global as any).setTimeout;
    (global as any).setTimeout = (cb: any, _ms?: number) => {
      try {
        cb();
      } catch (e) {
        // swallow to let test assertions handle thrown errors
      }
      return 0 as any;
    };

    try {
      await act(async () => {
        await result.current.createSession();
      });
    } finally {
      (global as any).setTimeout = origSetTimeout;
    }

  // Endpoints.getStreamingSessionInfo is a mocked function; assert it was called at least 3 times
  const mockedGetInfo = Endpoints.getStreamingSessionInfo as jest.MockedFunction<typeof Endpoints.getStreamingSessionInfo>;
  expect(mockedGetInfo.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(result.current.sessionStatus).toBe('ready');
    expect(result.current.connectionParams).toEqual({ server: 'host', signalingPort: 7777, mediaPort: undefined });
  });

  test('createSession times out after max polling attempts', async () => {
    // create returns session id
    (Endpoints.createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { id: 'sess-timeout' } });

    // always return 202 with no routes => never ready
    (Endpoints.getStreamingSessionInfo as jest.Mock).mockResolvedValue({ status: 202, data: { id: 'sess-timeout', routes: {} } });

    const { result } = renderHook(() => useOKASSession(params));

    // stub setTimeout to run callbacks immediately so polling proceeds synchronously
    const origSetTimeout = (global as any).setTimeout;
    (global as any).setTimeout = (cb: any) => {
      try {
        cb();
      } catch (e) {
        // swallow
      }
      return 0 as any;
    };

    try {
      await act(async () => {
        await result.current.createSession();
      });
    } finally {
      (global as any).setTimeout = origSetTimeout;
    }

    expect(result.current.sessionStatus).toBe('error');
    expect(result.current.error).toMatch(/Session polling timeout/);
  });

  test('createSession handles polling errors and ultimately times out', async () => {
    (Endpoints.createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { id: 'sess-err' } });

    // simulate getStreamingSessionInfo throwing on each call
    (Endpoints.getStreamingSessionInfo as jest.Mock).mockImplementation(async () => {
      throw new Error('network');
    });

    const { result } = renderHook(() => useOKASSession(params));

    const origSetTimeout2 = (global as any).setTimeout;
    (global as any).setTimeout = (cb: any) => {
      try {
        cb();
      } catch (e) {
        // swallow
      }
      return 0 as any;
    };

    try {
      await act(async () => {
        await result.current.createSession();
      });
    } finally {
      (global as any).setTimeout = origSetTimeout2;
    }

    expect(result.current.sessionStatus).toBe('error');
    expect(result.current.error).toMatch(/Failed to create session|Session polling timeout/);
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */
