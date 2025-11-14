import { uiReducer, uiActions } from '../../src/store/slices/uiSlice';

describe('uiSlice coverage tests', () => {
  it('toggles and sets fullscreen', () => {
    const s1 = uiReducer(undefined as any, uiActions.toggleFullscreen());
    expect(s1.isFullscreen).toBe(true);
    const s2 = uiReducer(s1, uiActions.setFullscreen(false));
    expect(s2.isFullscreen).toBe(false);
  });

  it('clamps timestep and updates range', () => {
    // clamp above max
    const sHigh = uiReducer(undefined as any, uiActions.setTimestep(999999));
    expect(sHigh.timestep).toBeLessThanOrEqual(sHigh.maxTimestep);

    // clamp below min
    const sLow = uiReducer(undefined as any, uiActions.setTimestep(-999));
    expect(sLow.timestep).toBeGreaterThanOrEqual(sLow.minTimestep);

    // set range and ensure current clamps
    const sRange = uiReducer(undefined as any, uiActions.setTimestepRange(10, 20));
    expect(sRange.minTimestep).toBe(10);
    expect(sRange.maxTimestep).toBe(20);
  });

  it('toggles prefs and modals', () => {
    let s = uiReducer(undefined as any, uiActions.toggleDebugInfo());
    expect(s.showDebugInfo).toBe(true);
    s = uiReducer(s, uiActions.toggleDebugInfo());
    expect(s.showDebugInfo).toBe(false);

    s = uiReducer(s, uiActions.toggleStreamStats());
    expect(s.showStreamStats).toBe(true);

    s = uiReducer(s, uiActions.showSettings());
    expect(s.showSettings).toBe(true);
    s = uiReducer(s, uiActions.hideSettings());
    expect(s.showSettings).toBe(false);
  });

  it('manages notifications', () => {
    const added = uiReducer(undefined as any, uiActions.addNotification({ type: 'info', title: 't', message: 'm' }));
    expect(added.notifications.length).toBe(1);
    const id = added.notifications[0].id;

    // remove existing id
    const removed = uiReducer(added, uiActions.removeNotification(id));
    expect(removed.notifications.length).toBe(0);

    // removing non-existing id should be no-op
    const removed2 = uiReducer(removed, uiActions.removeNotification('nope'));
    expect(removed2.notifications.length).toBe(0);

    // clear notifications
    const cleared = uiReducer(removed2, uiActions.clearNotifications());
    expect(cleared.notifications.length).toBe(0);
  });

  it('sets window size and high contrast', () => {
    const mobile = uiReducer(undefined as any, uiActions.setWindowSize(500, 400));
    expect(mobile.screenSize).toBe('mobile');

    const tablet = uiReducer(undefined as any, uiActions.setWindowSize(800, 600));
    expect(tablet.screenSize).toBe('tablet');

    const desktop = uiReducer(undefined as any, uiActions.setWindowSize(1200, 800));
    expect(desktop.screenSize).toBe('desktop');

    const hc = uiReducer(undefined as any, uiActions.setHighContrast(true));
    expect(hc.highContrast).toBe(true);
  });

  it('resets UI state', () => {
    const mod = uiReducer(undefined as any, uiActions.toggleDebugInfo());
    expect(mod.showDebugInfo).toBe(true);
    const reset = uiReducer(mod, uiActions.resetUIState());
    expect(reset.showDebugInfo).toBe(false);
    expect(reset.notifications.length).toBe(0);
  });
});
