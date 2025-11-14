import { OKASStream } from '../../../src/components/streaming/OKASStream/OKASStream';

describe('OKASStream initializeStream branches', () => {
  afterEach(() => jest.restoreAllMocks());

  it('initializeStream exits early when no connectionParams', async () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await (inst as any).initializeStream();

    expect(errSpy).toHaveBeenCalledWith('OKASStream: No connection params available');
  });

  it('initializeStream sets error when waitForDOMElements fails', async () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    // provide connection params so it proceeds
    inst.connectionParams = { server: 's', signalingPort: 1, mediaPort: 2 } as any;

    // make waitForDOMElements throw
    (inst as any).waitForDOMElements = jest.fn().mockRejectedValue(new Error('dom fail'));

    // make setState synchronous so test can observe state changes without mounting
    // @ts-ignore
    inst.setState = (state: any, cb?: () => void) => {
      // @ts-ignore
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    await (inst as any).initializeStream();

    expect(inst.state.error).toMatch(/Connection error/);
  });

  it('static sendMessage routes to current instance when ready', () => {
    const inst = new OKASStream({
      appServer: 'a',
      streamServer: 's',
      appId: 'id',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    // make instance ready and appStreamer with sendMessage; avoid calling setState on unmounted component
    // set the state directly for the test
    // @ts-ignore
    inst.state = { ...(inst.state || {}), streamReady: true };
    inst['appStreamer'] = { sendMessage: jest.fn() } as any;

    // set static currentInstance
    (OKASStream as any).currentInstance = inst;

    OKASStream.sendMessage(JSON.stringify({ hello: 'world' }));

    expect((inst['appStreamer'] as any).sendMessage).toHaveBeenCalled();
  });
});
// Mock the streaming library so the imported AppStreamer.connect can be spied
jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => {
  class MockAppStreamer {
    static connect = jest.fn().mockResolvedValue(undefined);
    sendMessage = jest.fn();
    constructor() {}
  }

  return { AppStreamer: MockAppStreamer };
});


describe('OKASStream initialize and static sendMessage', () => {
  test('initializeStream calls AppStreamer.connect on ready', async () => {
    // @ts-ignore
    const inst = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' });

    // stub waitForDOMElements to resolve
    // @ts-ignore
    inst.waitForDOMElements = jest.fn().mockResolvedValue(undefined);

  // get the mocked connect from the module mock
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AppStreamer } = require('@nvidia/omniverse-webrtc-streaming-library');
  const connectMock = AppStreamer.connect;

    // set connection params and status ready
    // @ts-ignore
    inst.connectionParams = { server: 'srv', signalingPort: 1, mediaPort: 2 };
    // @ts-ignore
    inst.sessionStatus = 'ready';

    // make setState synchronous
    // @ts-ignore
    inst.setState = (state: any, cb?: () => void) => {
      // @ts-ignore
      inst.state = { ...(inst.state || {}), ...(typeof state === 'function' ? state(inst.state) : state) };
      if (cb) cb();
    };

    // force componentDidUpdate behavior by calling initializeStream directly
    // @ts-ignore
    await (inst as any).initializeStream();

    expect(connectMock).toHaveBeenCalled();

    // nothing to restore because jest.mock handles the module replacement
  });

  test('static sendMessage forwards when instance present', () => {
    // construct instance and set as current
    // @ts-ignore
    const inst = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' });

    const sendFn = jest.fn();
    // @ts-ignore
    // @ts-ignore
    inst.appStreamer = { sendMessage: sendFn };

    // set state synchronously so static method sees streamReady
    // @ts-ignore
    inst.state = { ...(inst.state || {}), streamReady: true };

    // set as current instance
    // @ts-ignore
    (OKASStream as any).currentInstance = inst;

    OKASStream.sendMessage(JSON.stringify({ x: 1 }));
    expect(sendFn).toHaveBeenCalled();
  });
});
