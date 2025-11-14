/* eslint-disable @typescript-eslint/no-explicit-any */
import LocalStream from '../../../src/components/streaming/LocalStream/LocalStream';
import { OKASStream } from '../../../src/components/streaming/OKASStream/OKASStream';

describe('Static sendMessage success paths', () => {
  beforeEach(() => jest.clearAllMocks());

  it('LocalStream.static sendMessage calls instance.sendMessage when ready', () => {
    const comp: any = new LocalStream({ server: 'srv', signalingPort: 1234, app: 'OmniverseApp' } as any);
    const sendMock = jest.fn();
    comp.appStreamer = { sendMessage: sendMock } as any;
    comp.state = { streamReady: true };

    (LocalStream as any).currentInstance = comp;

    LocalStream.sendMessage(JSON.stringify({ hello: 'world' }));

    expect(sendMock).toHaveBeenCalled();
  });

  it('OKASStream.static sendMessage calls instance.sendMessage when ready', () => {
    const comp: any = new OKASStream({ appServer: 'a', streamServer: 's', appId: 'id', appVersion: 'v', profile: 'p', app: 'app' } as any);
    const sendMock = jest.fn();
    comp.appStreamer = { sendMessage: sendMock } as any;
    comp.state = { streamReady: true };

    (OKASStream as any).currentInstance = comp;

    OKASStream.sendMessage(JSON.stringify({ x: 1 }));

    expect(sendMock).toHaveBeenCalled();
  });
});
