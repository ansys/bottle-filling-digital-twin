/* eslint-disable @typescript-eslint/no-explicit-any */
import SessionSelectionPanel from '../../../src/components/common/SessionSelectionPanel/SessionSelectionPanel';
import * as Endpoints from '../../../src/services/Endpoints';

describe('SessionSelectionPanel.pollSessionStatus', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('calls onSessionReady when sessionInfo.routes becomes available', async () => {
    jest.useFakeTimers();

    const onReady = jest.fn();
    const panel = new (SessionSelectionPanel as any)({ streamServer: 's', appId: 'a', appVersion: 'v', profile: 'p', onSessionReady: onReady });

    // prepare a sequence: first call returns empty routes, second call returns routes
    const seq = [
      { status: 200, data: { id: 's1', routes: {} } },
      { status: 200, data: { id: 's1', routes: { webRTC: { url: 'x' } } } },
    ];

    let calls = 0;
    jest.spyOn(Endpoints, 'getStreamingSessionInfo').mockImplementation(async () => {
      return seq[calls++] as any;
    });

    const p = (panel as any).pollSessionStatus('s1', 's', onReady);

    // advance timers to allow first wait and then second invocation
    // first poll executes immediately in loop; it will then wait 20s before next
    // advance by 20s to trigger next poll
    await Promise.resolve();
    jest.advanceTimersByTime(20000);

    await p;

    expect(onReady).toHaveBeenCalledWith('s1');
  });
});
