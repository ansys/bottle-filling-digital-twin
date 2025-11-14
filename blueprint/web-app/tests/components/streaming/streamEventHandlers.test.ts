import { createStreamEventHandlers, waitForStreamDOMElements } from '../../../src/components/streaming/utils/streamEventHandlers';
import { StreamEvent } from '@nvidia/omniverse-webrtc-streaming-library';

describe('streamEventHandlers', () => {
  let stateUpdater: {
    setStreamReady: jest.Mock;
    setIsConnecting: jest.Mock;
    setError: jest.Mock;
  };
  let callbacks: {
    onStart: jest.Mock;
    onStop: jest.Mock;
    onUpdate: jest.Mock;
    onCustomEvent: jest.Mock;
    onStreamStats: jest.Mock;
  };

  beforeEach(() => {
    stateUpdater = {
      setStreamReady: jest.fn(),
      setIsConnecting: jest.fn(),
      setError: jest.fn(),
    };

    callbacks = {
      onStart: jest.fn(),
      onStop: jest.fn(),
      onUpdate: jest.fn(),
      onCustomEvent: jest.fn(),
      onStreamStats: jest.fn(),
    };
  });

  it('handleStart - success path', () => {
    const handlers = createStreamEventHandlers('TestComp', stateUpdater, callbacks);
  const msg = { status: 'success' } as StreamEvent;
    handlers.handleStart(msg);
    expect(stateUpdater.setStreamReady).toHaveBeenCalledWith(true);
    expect(stateUpdater.setIsConnecting).toHaveBeenCalledWith(false);
    expect(stateUpdater.setError).toHaveBeenCalledWith(null);
    expect(callbacks.onStart).toHaveBeenCalledWith(msg);
  });

  it('handleStart - warning path', () => {
    const handlers = createStreamEventHandlers('TestComp', stateUpdater, callbacks);
  const msg = { status: 'warning' } as StreamEvent;
    handlers.handleStart(msg);
    // Should not set error on warning
    expect(stateUpdater.setError).not.toHaveBeenCalledWith(expect.any(String));
    expect(callbacks.onStart).toHaveBeenCalledWith(msg);
  });

  it('handleStart - error path', () => {
    const handlers = createStreamEventHandlers('TestComp', stateUpdater, callbacks);
  const msg = { status: 'error', info: 'bad' } as StreamEvent;
    handlers.handleStart(msg);
    expect(stateUpdater.setIsConnecting).toHaveBeenCalledWith(false);
    expect(stateUpdater.setError).toHaveBeenCalled();
    expect(callbacks.onStart).toHaveBeenCalledWith(msg);
  });

  it('handleStop - terminate/error and success', () => {
    const handlers = createStreamEventHandlers('TestComp', stateUpdater, callbacks);
  const msgErr = { action: 'terminate', status: 'error', info: 'die' } as StreamEvent;
    handlers.handleStop(msgErr);
    expect(stateUpdater.setStreamReady).toHaveBeenCalledWith(false);
    expect(stateUpdater.setError).toHaveBeenCalledWith(expect.stringContaining('Stream disconnected'));
    expect(callbacks.onStop).toHaveBeenCalledWith(msgErr);

  const msgOk = { action: 'terminate', status: 'success' } as StreamEvent;
    handlers.handleStop(msgOk);
    expect(stateUpdater.setStreamReady).toHaveBeenCalledWith(false);
    // on success should clear error
    expect(stateUpdater.setError).toHaveBeenCalledWith(null);
    expect(callbacks.onStop).toHaveBeenCalledWith(msgOk);
  });

  it('other handlers call callbacks', () => {
    const handlers = createStreamEventHandlers('TestComp', stateUpdater, callbacks);
  const u = { action: 'update', status: 'success', info: '', some: 'update' } as StreamEvent;
    handlers.handleUpdate(u);
    expect(callbacks.onUpdate).toHaveBeenCalledWith(u);

  const c = { action: 'custom', status: 'success', info: '', event: 'custom' } as unknown as StreamEvent;
  handlers.handleCustomEvent(c);
    expect(callbacks.onCustomEvent).toHaveBeenCalledWith(c);

  const s = { action: 'stats', status: 'success', info: '', stats: 1 } as unknown as StreamEvent;
  handlers.handleStreamStats(s);
    expect(callbacks.onStreamStats).toHaveBeenCalledWith(s);
  });
});

describe('waitForStreamDOMElements', () => {
  afterEach(() => {
    // cleanup any elements
    ['remote-video', 'remote-audio', 'message-display'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    jest.useRealTimers();
  });

  it('resolves when elements exist', async () => {
    const v = document.createElement('video');
    v.id = 'remote-video';
    const a = document.createElement('audio');
    a.id = 'remote-audio';
    const m = document.createElement('div');
    m.id = 'message-display';
    document.body.appendChild(v);
    document.body.appendChild(a);
    document.body.appendChild(m);

    await expect(waitForStreamDOMElements('Test')).resolves.toBeUndefined();
    // ensure video/audio were configured
    expect((document.getElementById('remote-video') as HTMLVideoElement).volume).toBe(1);
  });

  it('rejects on timeout when elements missing', async () => {
    jest.useFakeTimers();
    const promise = waitForStreamDOMElements('Test');
    // advance timers past maxAttempts*100
    jest.advanceTimersByTime(6000);
    await expect(promise).rejects.toThrow('Timeout waiting for DOM elements');
  });

});
