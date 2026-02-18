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

/**
 * UI Slice
 *
 * Manages UI-specific state including layout, preferences, and visual controls
 */

// UI state interface
export interface UIState {
  // Layout and display
  isFullscreen: boolean;
  headerHeight: number;

  // Omniverse UI controls
  timestep: number;
  maxTimestep: number;
  minTimestep: number;

  // Visual preferences
  theme: 'light' | 'dark' | 'auto';
  showDebugInfo: boolean;
  showStreamStats: boolean;

  // Modal and overlay states
  showSettings: boolean;
  showAbout: boolean;
  showConnectionInfo: boolean;

  // Notifications/Toast messages
  notifications: UINotification[];

  // Responsive breakpoints
  screenSize: 'mobile' | 'tablet' | 'desktop';
  windowWidth: number;
  windowHeight: number;

  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
}

export interface UINotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss duration in ms
  persistent?: boolean; // Don't auto-dismiss
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

// Initial state
const initialState: UIState = {
  isFullscreen: false,
  headerHeight: 60,

  timestep: 0,
  maxTimestep: 2530,
  minTimestep: 0,

  theme: 'auto',
  showDebugInfo: false,
  showStreamStats: false,

  showSettings: false,
  showAbout: false,
  showConnectionInfo: false,

  notifications: [],

  screenSize: 'desktop',
  windowWidth: window?.innerWidth || 1920,
  windowHeight: window?.innerHeight || 1080,

  highContrast: false,
  reducedMotion: false,
  screenReaderEnabled: false,
};

// Action types
export const UI_ACTIONS = {
  // Layout
  TOGGLE_FULLSCREEN: 'ui/toggleFullscreen',
  SET_FULLSCREEN: 'ui/setFullscreen',
  SET_HEADER_HEIGHT: 'ui/setHeaderHeight',

  // Omniverse controls
  SET_TIMESTEP: 'ui/setTimestep',
  SET_TIMESTEP_RANGE: 'ui/setTimestepRange',

  // Theme and preferences
  SET_THEME: 'ui/setTheme',
  TOGGLE_DEBUG_INFO: 'ui/toggleDebugInfo',
  TOGGLE_STREAM_STATS: 'ui/toggleStreamStats',

  // Modals
  SHOW_SETTINGS: 'ui/showSettings',
  HIDE_SETTINGS: 'ui/hideSettings',
  SHOW_ABOUT: 'ui/showAbout',
  HIDE_ABOUT: 'ui/hideAbout',
  SHOW_CONNECTION_INFO: 'ui/showConnectionInfo',
  HIDE_CONNECTION_INFO: 'ui/hideConnectionInfo',

  // Notifications
  ADD_NOTIFICATION: 'ui/addNotification',
  REMOVE_NOTIFICATION: 'ui/removeNotification',
  CLEAR_NOTIFICATIONS: 'ui/clearNotifications',

  // Window and responsive
  SET_WINDOW_SIZE: 'ui/setWindowSize',
  SET_SCREEN_SIZE: 'ui/setScreenSize',

  // Accessibility
  SET_HIGH_CONTRAST: 'ui/setHighContrast',
  SET_REDUCED_MOTION: 'ui/setReducedMotion',
  SET_SCREEN_READER: 'ui/setScreenReader',

  // Reset
  RESET_UI_STATE: 'ui/resetUIState',
} as const;

// Action creators
export const uiActions = {
  toggleFullscreen: () => ({
    type: UI_ACTIONS.TOGGLE_FULLSCREEN,
  }),

  setFullscreen: (fullscreen: boolean) => ({
    type: UI_ACTIONS.SET_FULLSCREEN,
    payload: fullscreen,
  }),

  setTimestep: (timestep: number) => ({
    type: UI_ACTIONS.SET_TIMESTEP,
    payload: timestep,
  }),

  setTimestepRange: (min: number, max: number) => ({
    type: UI_ACTIONS.SET_TIMESTEP_RANGE,
    payload: { min, max },
  }),

  setTheme: (theme: UIState['theme']) => ({
    type: UI_ACTIONS.SET_THEME,
    payload: theme,
  }),

  toggleDebugInfo: () => ({
    type: UI_ACTIONS.TOGGLE_DEBUG_INFO,
  }),

  toggleStreamStats: () => ({
    type: UI_ACTIONS.TOGGLE_STREAM_STATS,
  }),

  showSettings: () => ({
    type: UI_ACTIONS.SHOW_SETTINGS,
  }),

  hideSettings: () => ({
    type: UI_ACTIONS.HIDE_SETTINGS,
  }),

  addNotification: (
    notification: Omit<UINotification, 'id' | 'timestamp'>
  ) => ({
    type: UI_ACTIONS.ADD_NOTIFICATION,
    payload: {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    },
  }),

  removeNotification: (id: string) => ({
    type: UI_ACTIONS.REMOVE_NOTIFICATION,
    payload: id,
  }),

  clearNotifications: () => ({
    type: UI_ACTIONS.CLEAR_NOTIFICATIONS,
  }),

  setWindowSize: (width: number, height: number) => ({
    type: UI_ACTIONS.SET_WINDOW_SIZE,
    payload: { width, height },
  }),

  setHighContrast: (enabled: boolean) => ({
    type: UI_ACTIONS.SET_HIGH_CONTRAST,
    payload: enabled,
  }),

  resetUIState: () => ({
    type: UI_ACTIONS.RESET_UI_STATE,
  }),
};

// Helper function to determine screen size
const getScreenSize = (width: number): UIState['screenSize'] => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Reducer
export const uiReducer = (
  state: UIState = initialState,
  action: { type: string; payload?: unknown }
): UIState => {
  switch (action.type) {
    case UI_ACTIONS.TOGGLE_FULLSCREEN:
      return {
        ...state,
        isFullscreen: !state.isFullscreen,
      };

    case UI_ACTIONS.SET_FULLSCREEN:
      return {
        ...state,
        isFullscreen: action.payload as boolean,
      };

    case UI_ACTIONS.SET_TIMESTEP: {
      const timestep = action.payload as number;
      return {
        ...state,
        timestep: Math.max(
          state.minTimestep,
          Math.min(state.maxTimestep, timestep)
        ),
      };
    }

    case UI_ACTIONS.SET_TIMESTEP_RANGE: {
      const { min, max } = action.payload as { min: number; max: number };
      return {
        ...state,
        minTimestep: min,
        maxTimestep: max,
        timestep: Math.max(min, Math.min(max, state.timestep)),
      };
    }

    case UI_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload as UIState['theme'],
      };

    case UI_ACTIONS.TOGGLE_DEBUG_INFO:
      return {
        ...state,
        showDebugInfo: !state.showDebugInfo,
      };

    case UI_ACTIONS.TOGGLE_STREAM_STATS:
      return {
        ...state,
        showStreamStats: !state.showStreamStats,
      };

    case UI_ACTIONS.SHOW_SETTINGS:
      return {
        ...state,
        showSettings: true,
      };

    case UI_ACTIONS.HIDE_SETTINGS:
      return {
        ...state,
        showSettings: false,
      };

    case UI_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [
          ...state.notifications,
          action.payload as UINotification,
        ],
      };

    case UI_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case UI_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
      };

    case UI_ACTIONS.SET_WINDOW_SIZE: {
      const { width, height } = action.payload as {
        width: number;
        height: number;
      };
      return {
        ...state,
        windowWidth: width,
        windowHeight: height,
        screenSize: getScreenSize(width),
      };
    }

    case UI_ACTIONS.SET_HIGH_CONTRAST:
      return {
        ...state,
        highContrast: action.payload as boolean,
      };

    case UI_ACTIONS.RESET_UI_STATE:
      return initialState;

    default:
      return state;
  }
};

// Selectors
export const selectIsFullscreen = (state: { ui: UIState }) =>
  state.ui.isFullscreen;
export const selectTimestep = (state: { ui: UIState }) => state.ui.timestep;
export const selectTimestepRange = (state: { ui: UIState }) => ({
  min: state.ui.minTimestep,
  max: state.ui.maxTimestep,
  current: state.ui.timestep,
});
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectShowDebugInfo = (state: { ui: UIState }) =>
  state.ui.showDebugInfo;
export const selectShowStreamStats = (state: { ui: UIState }) =>
  state.ui.showStreamStats;
export const selectNotifications = (state: { ui: UIState }) =>
  state.ui.notifications;
export const selectScreenSize = (state: { ui: UIState }) => state.ui.screenSize;
export const selectWindowSize = (state: { ui: UIState }) => ({
  width: state.ui.windowWidth,
  height: state.ui.windowHeight,
});

export default uiReducer;
