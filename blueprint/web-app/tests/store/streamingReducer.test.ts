import streamingReducer, {
  streamingActions,
  STREAMING_ACTIONS,
  selectStreamMetrics,
} from '../../src/store/slices/streamingSlice';

describe('streamingReducer and selectors', () => {
  it('handles setConnecting and records lastConnectionAttempt', () => {
    const state = streamingReducer(undefined, streamingActions.setConnecting(true));
    expect(state.isConnecting).toBe(true);
    expect(typeof state.lastConnectionAttempt).toBe('number');
  });

  it('setConnected toggles isConnected and resets reconnect attempts', () => {
    const s1 = streamingReducer(undefined, streamingActions.setConnected(true));
    expect(s1.isConnected).toBe(true);
    expect(s1.reconnectAttempts).toBe(0);

    const s2 = streamingReducer({ ...s1, reconnectAttempts: 2 }, streamingActions.setConnected(false));
    expect(s2.isConnected).toBe(false);
    expect(s2.reconnectAttempts).toBe(2);
  });

  it('addStreamEvent keeps only last 50 events', () => {
    let state = streamingReducer(undefined, streamingActions.resetStreamingState());
    for (let i = 0; i < 60; i++) {
      state = streamingReducer(state, streamingActions.addStreamEvent({ type: 'info', action: 'a', status: 'ok', message: `m${i}` } as any));
    }
    expect(state.streamEvents.length).toBeLessThanOrEqual(50);
    expect(state.streamEvents[0].message).toMatch(/m1[0-9]|m2[0-9]|m3[0-9]|m4[0-9]|m5[0-9]/);
  });

  it('updateStreamMetrics updates latency/bitrate/frameRate and selector', () => {
    const next = streamingReducer(undefined, streamingActions.updateStreamMetrics({ latency: 10, bitrate: 200, frameRate: 15 }));
    const metrics = selectStreamMetrics({ streaming: next });
    expect(metrics.latency).toBe(10);
    expect(metrics.bitrate).toBe(200);
    expect(metrics.frameRate).toBe(15);
  });

  it('various actions update state as expected', () => {
    let state = streamingReducer(undefined, streamingActions.setStreamConfig({ signalingServer: 's', signalingPort: 1, mediaServer: 'm', mediaPort: 2, backendUrl: 'b', sessionId: 'sess' } as any));
    expect(state.signalingServer).toBe('s');

    state = streamingReducer(state, streamingActions.updateStreamSettings({ width: 640, height: 480, fps: 30 }));
    expect(state.width).toBe(640);

    state = streamingReducer(state, streamingActions.setAudioMuted(true));
    expect(state.audioMuted).toBe(true);

    state = streamingReducer(state, streamingActions.setVideoMuted(true));
    expect(state.videoMuted).toBe(true);

    state = streamingReducer(state, streamingActions.setMicrophoneEnabled(true));
    expect(state.microphoneEnabled).toBe(true);

    state = streamingReducer(state, streamingActions.setConnectionError('boom'));
    expect(state.connectionError).toBe('boom');

    state = streamingReducer(state, streamingActions.clearConnectionError());
    expect(state.connectionError).toBeNull();

    // dispatch increment reconnect attempts using action constant
    state = streamingReducer(state, { type: STREAMING_ACTIONS.INCREMENT_RECONNECT_ATTEMPTS } as any);
    expect(state.reconnectAttempts).toBe(1);

    // reset reconnect attempts using action constant
    state = streamingReducer(state, { type: STREAMING_ACTIONS.RESET_RECONNECT_ATTEMPTS } as any);
    expect(state.reconnectAttempts).toBe(0);

    // clear stream events using action constant
    state = streamingReducer(state, { type: STREAMING_ACTIONS.CLEAR_STREAM_EVENTS } as any);
    expect(state.streamEvents).toEqual([]);

    state = streamingReducer(state, streamingActions.resetStreamingState());
    expect(state.streamReady).toBe(false);
  });
});
