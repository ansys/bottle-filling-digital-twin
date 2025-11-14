import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { OKASStream } from '../../../src/components/streaming/OKASStream/OKASStream';

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => {
  class MockAppStreamer {}
  // add a static connect mock function
  (MockAppStreamer as any).connect = jest.fn();
  return { AppStreamer: MockAppStreamer };
});
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

jest.mock('../../../src/components/streaming/utils/streamEventHandlers', () => ({
  waitForStreamDOMElements: jest.fn().mockResolvedValue(undefined),
  createStreamEventHandlers: jest.fn().mockReturnValue({
    handleStart: jest.fn(),
    handleStop: jest.fn(),
    handleUpdate: jest.fn(),
    handleCustomEvent: jest.fn(),
  }),
}));

describe('OKASStream error paths and sendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles AppStreamer.connect throwing during initializeStream', async () => {
    const mockConnect = (AppStreamer as any).connect as jest.MockedFunction<any>;
    mockConnect.mockRejectedValueOnce(new Error('connect failed'));

    const ref = React.createRef<any>();
    render(<OKASStream ref={ref} appServer='as' streamServer='srv' appId='app' appVersion='v' profile='p' app='app' />);

    // ensure instance exists
    const inst = ref.current;
    expect(inst).toBeTruthy();

    // provide connection params and status to trigger initialize
    inst.connectionParams = { server: 's', signalingPort: 11, mediaPort: 22 };
    inst.sessionStatus = 'ready';

    await act(async () => {
      await inst.initializeStream();
    });

    expect(mockConnect).toHaveBeenCalled();
    // after mounted initializeStream, state.error should be set
    expect(inst.state.error).toMatch(/Connection error/);
  });

  it('sendMessage warns when stream not ready and forwards when ready', () => {
    const comp: any = new OKASStream({
      appServer: 'as',
      streamServer: 'srv',
      appId: 'app',
      appVersion: 'v',
      profile: 'p',
      app: 'app',
    } as any);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // stream not ready
    comp.state.streamReady = false;
    comp.sendMessage({ hello: 1 });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot send message'));

  // now set appStreamer and ready (set state synchronously)
  const sendSpy = jest.fn();
  comp.appStreamer = { sendMessage: sendSpy } as any;
  comp.state.streamReady = true;
  comp.sendMessage({ hi: 2 });
  expect(sendSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
