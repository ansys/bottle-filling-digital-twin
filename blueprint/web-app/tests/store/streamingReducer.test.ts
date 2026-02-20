// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import streamingReducer, {
  streamingActions,
  STREAMING_ACTIONS,
  selectStreamMetrics,
} from '@/store/slices/streamingSlice.ts';

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
