import { OKASStream } from '../../../src/components/streaming/OKASStream/OKASStream';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('OKASStream branch coverage targets', () => {
  afterEach(() => jest.restoreAllMocks());

  it('handleEndStream disconnects appStreamer and destroys session', async () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    // provide mocks for appStreamer and destroySession
    const disconnectMock = jest.fn();
    inst['appStreamer'] = { disconnect: disconnectMock } as any;
    const destroyMock = jest.fn().mockResolvedValue(undefined);
    inst.destroySession = destroyMock as any;

    // ensure setState is synchronous to avoid mounted warnings
    inst.setState = (state: any, cb?: () => void) => {
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // set some state to be cleared later
    inst.state = { streamReady: true, isConnecting: true, error: 'err' };

    await (inst as any).handleEndStream();

    expect(disconnectMock).toHaveBeenCalled();
    expect(destroyMock).toHaveBeenCalled();
    expect(inst.state.streamReady).toBe(false);
    expect(inst.state.error).toBeNull();
  });

  it('initializeStream sets error when AppStreamer.connect rejects', async () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    // set connection params so it proceeds
    inst.connectionParams = { server: 's', signalingPort: 1, mediaPort: 2 } as any;

    // make waitForDOMElements resolve
    (inst as any).waitForDOMElements = jest.fn().mockResolvedValue(undefined);

    // mock connect to reject
    const connectSpy = jest.spyOn(AppStreamer as any, 'connect').mockRejectedValue(new Error('connect fail'));

    // make setState synchronous
    inst.setState = (state: any, cb?: () => void) => {
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // call initializeStream
    await (inst as any).initializeStream();

    expect(connectSpy).toHaveBeenCalled();
    expect(typeof inst.state.error).toBe('string');
    expect(inst.state.error).toMatch(/connect fail/);
  });

  it('static sendMessage warns when no active instance', () => {
    // ensure currentInstance is null
    (OKASStream as any).currentInstance = null;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    OKASStream.sendMessage(JSON.stringify({ test: 1 }));

    expect(warnSpy).toHaveBeenCalledWith('OKASStream: No active instance or stream not ready');
  });

  it('static sendMessage forwards to instance.sendMessage when present and ready', () => {
    const fakeInst = { state: { streamReady: true }, sendMessage: jest.fn() } as any;
    (OKASStream as any).currentInstance = fakeInst;

    OKASStream.sendMessage(JSON.stringify({ forwarded: true }));

    expect(fakeInst.sendMessage).toHaveBeenCalledWith({ forwarded: true });
  });

  it('getStatusMessage returns expected strings for each sessionStatus', () => {
    const inst = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' } as any);

    inst.sessionStatus = 'creating';
    expect((inst as any).getStatusMessage()).toContain('Creating');

    inst.sessionStatus = 'polling';
    inst.sessionId = 'sess1';
    expect((inst as any).getStatusMessage()).toContain('Polling');

    inst.sessionStatus = 'ready';
    expect((inst as any).getStatusMessage()).toContain('Connecting');

    inst.sessionStatus = 'error';
    expect((inst as any).getStatusMessage()).toContain('Session error');

    inst.sessionStatus = 'idle' as any;
    expect((inst as any).getStatusMessage()).toContain('Initializing');
  });

  it('handleRetry clears error and calls initializeStream', () => {
    const inst = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' } as any);

    // make setState synchronous
    inst.setState = (state: any, cb?: () => void) => {
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // preset an error
    inst.state = { streamReady: false, isConnecting: false, error: 'some error' };

  const initSpy = jest.spyOn(inst as any, 'initializeStream').mockImplementation(() => {});

    (inst as any).handleRetry();

    expect(inst.state.error).toBeNull();
    expect(initSpy).toHaveBeenCalled();
  });

  it('componentDidUpdate triggers initializeStream when session becomes ready', () => {
    const inst = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' } as any);

    // set preconditions
    inst.connectionParams = { server: 's', signalingPort: 1, mediaPort: 2 } as any;
    inst.sessionStatus = 'ready';
    inst.state = { streamReady: false, isConnecting: false, error: null };

    // make setState synchronous
    inst.setState = (state: any, cb?: () => void) => {
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

  const initSpy = jest.spyOn(inst as any, 'initializeStream').mockImplementation(() => {});

    // call componentDidUpdate with prevState that differs to satisfy justBecameReady
    inst.componentDidUpdate({} as any, { isConnecting: true } as any);

    expect(initSpy).toHaveBeenCalled();
  });

  it('instance sendMessage calls appStreamer.sendMessage when ready and handles exceptions', () => {
    const inst = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' } as any);

    // set streamReady true and appStreamer with sendMessage
    inst.state = { ...(inst.state || {}), streamReady: true };
    const sendMock = jest.fn();
    inst['appStreamer'] = { sendMessage: sendMock } as any;

    inst.sendMessage({ hello: 'world' });
    expect(sendMock).toHaveBeenCalled();

    // now make sendMessage throw to hit the catch branch
    sendMock.mockImplementation(() => { throw new Error('boom'); });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    inst.sendMessage('a string message');
    expect(errSpy).toHaveBeenCalled();
  });
});
