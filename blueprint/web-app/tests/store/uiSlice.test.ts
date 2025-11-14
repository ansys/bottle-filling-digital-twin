import { uiReducer, uiActions } from '../../src/store/slices/uiSlice';

describe('uiReducer core behaviors', () => {
  it('toggles fullscreen', () => {
    const s1 = uiReducer(undefined as any, uiActions.toggleFullscreen());
    expect(s1.isFullscreen).toBe(true);
    const s2 = uiReducer(s1, uiActions.toggleFullscreen());
    expect(s2.isFullscreen).toBe(false);
  });

  it('clamps timestep within range', () => {
    const s = uiReducer(undefined as any, uiActions.setTimestep(999999));
    expect(s.timestep).toBeLessThanOrEqual(s.maxTimestep);
  });

  it('adds and removes notifications', () => {
    const s1 = uiReducer(undefined as any, uiActions.addNotification({ type: 'info', title: 't', message: 'm' }));
    expect(s1.notifications.length).toBe(1);
    const id = s1.notifications[0].id;
    const s2 = uiReducer(s1, uiActions.removeNotification(id));
    expect(s2.notifications.length).toBe(0);
  });

  it('sets window size and updates screenSize', () => {
    const s = uiReducer(undefined as any, uiActions.setWindowSize(500, 400));
    expect(s.windowWidth).toBe(500);
    expect(s.screenSize).toBe('mobile');
  });
});
