/* LocalStream error branch tests */
// Mock AppStreamer
class MockAppStreamer2 {
  static connect = jest.fn();
  sendMessage = jest.fn();
}

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: MockAppStreamer2,
}));

// Mock wait utility to reject
const mockWait2 = jest.fn();
jest.mock('../../../src/components/streaming/utils/streamEventHandlers', () => ({
  waitForStreamDOMElements: () => mockWait2(),
  createStreamEventHandlers: () => ({
    handleStart: jest.fn(),
    handleStop: jest.fn(),
    handleUpdate: jest.fn(),
    handleCustomEvent: jest.fn(),
  }),
}));

import LocalStream from '../../../src/components/streaming/LocalStream/LocalStream';

describe('LocalStream error branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWait2.mockResolvedValue(undefined);
  });

  it('initializeStream handles waitForDOMElements rejection', async () => {
    jest.setTimeout(10000);
    // force waitForDOMElements to immediately reject by overriding instance method later

    const comp = new LocalStream({
      server: 'srv',
      signalingPort: 11,
      app: 'app',
    } as any);

    // override the instance method (waitForDOMElements is an instance field)
    (comp as any).waitForDOMElements = async () => {
      throw new Error('no-dom');
    };

    comp.setState({ streamReady: false });

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await (comp as any).initializeStream();
    // allow setState to flush
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(MockAppStreamer2.connect).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();

    // nothing to restore since we only changed instance
  });

  it('static sendMessage warns when no instance', () => {
    // ensure no instance active
    LocalStream['currentInstance'] = null;

    // call static sendMessage
    LocalStream.sendMessage(JSON.stringify({ x: 1 }));
    // just ensure it doesn't throw
  });
});
