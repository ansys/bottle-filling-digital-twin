import reducer, {
  setViewportSize,
  setFullscreen,
  toggleGrid,
  startRendering,
  updateRenderProgress,
  completeRendering,
  setTotalFrames,
  setCurrentFrame,
  addSelectedObject,
  selectObjects,
  hideObject,
  showObject,
  setOmniverseError,
  resetViewport,
} from '../../src/store/slices/viewportSlice';

describe('viewportSlice reducer', () => {
  test('returns initial state when given undefined', () => {
    const state = reducer(undefined, { type: 'unknown' } as any);
    expect(state.settings.width).toBe(1920);
    expect(state.settings.height).toBe(1080);
    expect(state.isOmniverseConnected).toBe(false);
  });

  test('setViewportSize updates width and height', () => {
    const state0 = reducer(undefined, { type: 'unknown' } as any);
    const next = reducer(state0, setViewportSize({ width: 800, height: 600 }));
    expect(next.settings.width).toBe(800);
    expect(next.settings.height).toBe(600);
  });

  test('setFullscreen toggles value', () => {
    const state0 = reducer(undefined, { type: 'unknown' } as any);
    const s1 = reducer(state0, setFullscreen(true));
    expect(s1.isFullscreen).toBe(true);
    const s2 = reducer(s1, setFullscreen(false));
    expect(s2.isFullscreen).toBe(false);
  });

  test('toggleGrid flips boolean', () => {
    const state0 = reducer(undefined, { type: 'unknown' } as any);
    const s1 = reducer(state0, toggleGrid());
    expect(s1.showGrid).toBe(false);
    const s2 = reducer(s1, toggleGrid());
    expect(s2.showGrid).toBe(true);
  });

  test('rendering actions update progress and frameCount', () => {
    const state0 = reducer(undefined, { type: 'unknown' } as any);
    const s1 = reducer(state0, startRendering());
    expect(s1.isRendering).toBe(true);
    expect(s1.renderProgress).toBe(0);

    const s2 = reducer(s1, updateRenderProgress(42));
    expect(s2.renderProgress).toBe(42);

    const s3 = reducer(s2, completeRendering());
    expect(s3.isRendering).toBe(false);
    expect(s3.renderProgress).toBe(100);
    expect(s3.frameCount).toBe(1);
    expect(typeof s3.lastRenderTime).toBe('number');
    expect(s3.lastRenderTime).toBeGreaterThan(0);
  });

  test('frame clamping via setCurrentFrame respects bounds', () => {
    let state = reducer(undefined, { type: 'unknown' } as any);
    state = reducer(state, setTotalFrames(5));
    state = reducer(state, setCurrentFrame(3));
    expect(state.currentFrame).toBe(3);

    // below zero clamps to 0
    state = reducer(state, setCurrentFrame(-10));
    expect(state.currentFrame).toBe(0);

    // above totalFrames-1 clamps to totalFrames-1
    state = reducer(state, setCurrentFrame(999));
    expect(state.currentFrame).toBe(4);
  });

  test('addSelectedObject avoids duplicates and selectObjects replaces list', () => {
    let state = reducer(undefined, { type: 'unknown' } as any);
    state = reducer(state, selectObjects([]));
    state = reducer(state, addSelectedObject('a'));
    expect(state.selectedObjects).toEqual(['a']);
    state = reducer(state, addSelectedObject('a'));
    expect(state.selectedObjects).toEqual(['a']);

    state = reducer(state, selectObjects(['x', 'y']));
    expect(state.selectedObjects).toEqual(['x', 'y']);
  });

  test('hideObject moves object from visible to hidden and showObject reverses it', () => {
    let state = reducer(undefined, { type: 'unknown' } as any);
    // set visibleObjects and hiddenObjects directly via selectObjects and hideObject
    state = reducer(state, selectObjects(['one', 'two']));
    state = reducer(state, hideObject('one'));
    expect(state.hiddenObjects).toContain('one');
    expect(state.visibleObjects).not.toContain('one');

    // showObject should move it back
    state = reducer(state, showObject('one'));
    expect(state.visibleObjects).toContain('one');
    expect(state.hiddenObjects).not.toContain('one');
  });

  test('setOmniverseError sets connection status to error and disconnects flag', () => {
    let state = reducer(undefined, { type: 'unknown' } as any);
    // simulate it being connected first
    state = { ...state, isOmniverseConnected: true, omniverseConnectionStatus: 'connected' };
    state = reducer(state, setOmniverseError('boom'));
    expect(state.omniverseError).toBe('boom');
    expect(state.omniverseConnectionStatus).toBe('error');
    expect(state.isOmniverseConnected).toBe(false);
  });

  test('resetViewport returns initial state', () => {
    let state = reducer(undefined, { type: 'unknown' } as any);
    state = reducer(state, setFullscreen(true));
    state = reducer(state, addSelectedObject('item'));
    expect(state.isFullscreen).toBe(true);
    expect(state.selectedObjects).toContain('item');

    const reset = reducer(state, resetViewport());
    expect(reset.isFullscreen).toBe(false);
    expect(reset.selectedObjects).toEqual([]);
    expect(reset.settings.width).toBe(1920);
  });
});
