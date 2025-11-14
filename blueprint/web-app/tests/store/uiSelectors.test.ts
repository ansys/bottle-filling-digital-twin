import {
  selectIsFullscreen,
  selectTimestepRange,
  selectTheme,
  selectShowDebugInfo,
  selectShowStreamStats,
  selectNotifications,
  selectScreenSize,
  selectWindowSize,
} from '../../src/store/slices/uiSlice';

describe('ui selectors', () => {
  const baseState = {
    ui: {
      isFullscreen: true,
      timestep: 42,
      minTimestep: 0,
      maxTimestep: 100,
      theme: 'dark',
      showDebugInfo: true,
      showStreamStats: false,
      notifications: [{ id: 'n1', type: 'info', title: 't', message: 'm', timestamp: 1 }],
      screenSize: 'tablet',
      windowWidth: 800,
      windowHeight: 600,
    },
  } as any;

  it('selectIsFullscreen and theme', () => {
    expect(selectIsFullscreen(baseState)).toBe(true);
    expect(selectTheme(baseState)).toBe('dark');
  });

  it('select timestep range and theme/flags', () => {
    const range = selectTimestepRange(baseState);
    expect(range.current).toBe(42);
    expect(selectTheme(baseState)).toBe('dark');
    expect(selectShowDebugInfo(baseState)).toBe(true);
    expect(selectShowStreamStats(baseState)).toBe(false);
  });

  it('notifications and screen/window selectors', () => {
    expect(selectNotifications(baseState).length).toBe(1);
    expect(selectScreenSize(baseState)).toBe('tablet');
    const size = selectWindowSize(baseState);
    expect(size.width).toBe(800);
    expect(size.height).toBe(600);
  });
});
