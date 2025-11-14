import LocalStream from '../../../src/components/streaming/LocalStream/LocalStream';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('LocalStream branch tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('static sendMessage warns when no instance or not ready', () => {
    // ensure no instance
    (LocalStream as any).currentInstance = null;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    LocalStream.sendMessage(JSON.stringify({ a: 1 }));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  test('initializeStream sets error when AppStreamer.connect rejects', async () => {
    const props: any = { server: 's', signalingPort: 1234, app: 'a' };
    const comp: any = new LocalStream(props);
    // stub waitForDOMElements to avoid DOM polling
    comp.waitForDOMElements = jest.fn().mockResolvedValue(undefined);
    // make AppStreamer.connect reject
    (AppStreamer as any).connect = jest.fn().mockRejectedValue(new Error('connect-fail'));
    // capture setState
    comp.setState = jest.fn();
    await comp['initializeStream']();
    // setState should have been called with an error
    const calls = (comp.setState as jest.Mock).mock.calls;
    expect(calls.some(c => c[0] && c[0].error && /connect-fail/.test(c[0].error))).toBe(true);
  });
});
/* eslint-disable @typescript-eslint/no-explicit-any */

describe('LocalStream branches', () => {
  beforeEach(() => jest.clearAllMocks());

  it('static sendMessage warns when no active instance', () => {
    // ensure no active instance

    (LocalStream as any).currentInstance = null;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    LocalStream.sendMessage(JSON.stringify({ x: 1 }));
    expect(warnSpy).toHaveBeenCalledWith('LocalStream: No active instance or stream not ready');

    warnSpy.mockRestore();
  });

  it('initializeStream handles connection error and sets state', async () => {

    const comp: any = new LocalStream({ server: 'srv', signalingPort: 1234, app: 'app' } as any);

    // stub waitForDOMElements to throw
    comp.waitForDOMElements = jest.fn().mockRejectedValue(new Error('DOM missing'));
    comp.setState = jest.fn();

    await comp['initializeStream']();

    expect(comp.setState).toHaveBeenCalled();
    const last = (comp.setState as jest.Mock).mock.calls.slice(-1)[0][0];
    expect(last.error).toMatch(/Connection error/);
  });
});
