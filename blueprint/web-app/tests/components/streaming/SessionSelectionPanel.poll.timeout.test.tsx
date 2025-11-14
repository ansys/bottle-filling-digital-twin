import '@testing-library/jest-dom';

jest.mock('../../../src/services/Endpoints', () => ({
  getStreamingSessionInfo: jest.fn(),
}));

import SessionSelectionPanel from '../../../src/components/common/SessionSelectionPanel/SessionSelectionPanel';
import { getStreamingSessionInfo } from '../../../src/services/Endpoints';

describe('SessionSelectionPanel poll timeout branch', () => {
  beforeEach(() => jest.resetAllMocks());

  it('sets error when polling repeatedly throws and reaches max attempts', async () => {
    const onReady = jest.fn();
    const mock = (getStreamingSessionInfo as jest.Mock);

    // Force getStreamingSessionInfo to always throw to simulate server errors
    mock.mockImplementation(() => { throw new Error('network fail'); });

    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: 'p',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;

    // instantiate and call private poll method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const InstClass = SessionSelectionPanel as unknown as { new (p: any): any };
    const inst = new InstClass(props);
    const poll = inst['pollSessionStatus'].bind(inst) as (
      s: string,
      server: string,
      cb: (id: string) => void
    ) => Promise<void>;

    // override setTimeout to run immediately to avoid long waits
    const realSetTimeout = global.setTimeout;
    (global as any).setTimeout = (fn: (...args: unknown[]) => void, _ms?: number, ...args: unknown[]) => {
      // call immediately
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fn as any)(...args);
      return 0 as unknown as NodeJS.Timeout;
    };

    try {
      // replace instance.setState to capture error without mounting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalSetState = (inst as any).setState;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inst as any).__test_state = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inst as any).setState = function (s: any) {
        if (typeof s === 'function') {
          // function updater
          (inst as any).__test_state = s((inst as any).__test_state || {});
        } else {
          (inst as any).__test_state = { ...(inst as any).__test_state, ...s };
        }
      };

      await poll('z', props.streamServer, onReady);

      // onReady should not be called
      expect(onReady).not.toHaveBeenCalled();

      // instance should have error set for polling failure or timeout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((inst as any).__test_state.error).toBeTruthy();

      // restore original setState
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (inst as any).setState = originalSetState;
    } finally {
      (global as any).setTimeout = realSetTimeout;
    }
  });
});
