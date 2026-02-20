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
 * Server Slice
 *
 * Manages server configurations, endpoints, and connectivity
 */

// Server state interface
export interface ServerState {
  // Primary server configurations
  streamServer: string;
  appServer: string;

  // Server connectivity status
  streamServerStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  appServerStatus: 'disconnected' | 'connecting' | 'connected' | 'error';

  // Server health and metadata
  streamServerHealth: {
    lastChecked: number | null;
    responseTime: number | null;
    version: string | null;
    features: string[];
  };

  appServerHealth: {
    lastChecked: number | null;
    responseTime: number | null;
    version: string | null;
    availableApps: number;
  };

  // Connection history and caching
  recentServers: {
    streamServers: string[];
    appServers: string[];
  };

  // API configuration
  timeout: number;
  retryAttempts: number;

  // Error handling
  lastError: {
    server: 'stream' | 'app' | null;
    message: string;
    timestamp: number;
  } | null;
}

// Initial state
const initialState: ServerState = {
  streamServer: '',
  appServer: '',

  streamServerStatus: 'disconnected',
  appServerStatus: 'disconnected',

  streamServerHealth: {
    lastChecked: null,
    responseTime: null,
    version: null,
    features: [],
  },

  appServerHealth: {
    lastChecked: null,
    responseTime: null,
    version: null,
    availableApps: 0,
  },

  recentServers: {
    streamServers: [],
    appServers: [],
  },

  timeout: 10000, // 10 seconds
  retryAttempts: 3,

  lastError: null,
};

// Action types
export const SERVER_ACTIONS = {
  // Server configuration
  SET_STREAM_SERVER: 'server/setStreamServer',
  SET_APP_SERVER: 'server/setAppServer',
  SET_SERVERS: 'server/setServers',

  // Connection status
  SET_STREAM_SERVER_STATUS: 'server/setStreamServerStatus',
  SET_APP_SERVER_STATUS: 'server/setAppServerStatus',

  // Health monitoring
  UPDATE_STREAM_SERVER_HEALTH: 'server/updateStreamServerHealth',
  UPDATE_APP_SERVER_HEALTH: 'server/updateAppServerHealth',

  // Recent servers
  ADD_RECENT_STREAM_SERVER: 'server/addRecentStreamServer',
  ADD_RECENT_APP_SERVER: 'server/addRecentAppServer',
  CLEAR_RECENT_SERVERS: 'server/clearRecentServers',

  // Configuration
  SET_TIMEOUT: 'server/setTimeout',
  SET_RETRY_ATTEMPTS: 'server/setRetryAttempts',

  // Error handling
  SET_SERVER_ERROR: 'server/setServerError',
  CLEAR_SERVER_ERROR: 'server/clearServerError',

  // Reset
  RESET_SERVER_STATE: 'server/resetServerState',
} as const;

// Action creators
export const serverActions = {
  setStreamServer: (url: string) => ({
    type: SERVER_ACTIONS.SET_STREAM_SERVER,
    payload: url,
  }),

  setAppServer: (url: string) => ({
    type: SERVER_ACTIONS.SET_APP_SERVER,
    payload: url,
  }),

  setServers: (streamServer: string, appServer: string) => ({
    type: SERVER_ACTIONS.SET_SERVERS,
    payload: { streamServer, appServer },
  }),

  setStreamServerStatus: (status: ServerState['streamServerStatus']) => ({
    type: SERVER_ACTIONS.SET_STREAM_SERVER_STATUS,
    payload: status,
  }),

  setAppServerStatus: (status: ServerState['appServerStatus']) => ({
    type: SERVER_ACTIONS.SET_APP_SERVER_STATUS,
    payload: status,
  }),

  updateStreamServerHealth: (
    health: Partial<ServerState['streamServerHealth']>
  ) => ({
    type: SERVER_ACTIONS.UPDATE_STREAM_SERVER_HEALTH,
    payload: health,
  }),

  updateAppServerHealth: (health: Partial<ServerState['appServerHealth']>) => ({
    type: SERVER_ACTIONS.UPDATE_APP_SERVER_HEALTH,
    payload: health,
  }),

  addRecentStreamServer: (url: string) => ({
    type: SERVER_ACTIONS.ADD_RECENT_STREAM_SERVER,
    payload: url,
  }),

  addRecentAppServer: (url: string) => ({
    type: SERVER_ACTIONS.ADD_RECENT_APP_SERVER,
    payload: url,
  }),

  setServerError: (server: 'stream' | 'app', message: string) => ({
    type: SERVER_ACTIONS.SET_SERVER_ERROR,
    payload: { server, message, timestamp: Date.now() },
  }),

  clearServerError: () => ({
    type: SERVER_ACTIONS.CLEAR_SERVER_ERROR,
  }),

  resetServerState: () => ({
    type: SERVER_ACTIONS.RESET_SERVER_STATE,
  }),
};

// Helper function to manage recent servers list
const addToRecentList = (
  list: string[],
  newItem: string,
  maxItems: number = 5
): string[] => {
  const filtered = list.filter(item => item !== newItem);
  return [newItem, ...filtered].slice(0, maxItems);
};

// Reducer
export const serverReducer = (
  state: ServerState = initialState,
  action: { type: string; payload?: unknown }
): ServerState => {
  switch (action.type) {
    case SERVER_ACTIONS.SET_STREAM_SERVER: {
      const url = action.payload as string;
      return {
        ...state,
        streamServer: url,
        streamServerStatus: 'disconnected',
        recentServers: {
          ...state.recentServers,
          streamServers: url
            ? addToRecentList(state.recentServers.streamServers, url)
            : state.recentServers.streamServers,
        },
      };
    }

    case SERVER_ACTIONS.SET_APP_SERVER: {
      const url = action.payload as string;
      return {
        ...state,
        appServer: url,
        appServerStatus: 'disconnected',
        recentServers: {
          ...state.recentServers,
          appServers: url
            ? addToRecentList(state.recentServers.appServers, url)
            : state.recentServers.appServers,
        },
      };
    }

    case SERVER_ACTIONS.SET_SERVERS: {
      const { streamServer, appServer } = action.payload as {
        streamServer: string;
        appServer: string;
      };
      return {
        ...state,
        streamServer,
        appServer,
        streamServerStatus: 'disconnected',
        appServerStatus: 'disconnected',
        recentServers: {
          streamServers: streamServer
            ? addToRecentList(state.recentServers.streamServers, streamServer)
            : state.recentServers.streamServers,
          appServers: appServer
            ? addToRecentList(state.recentServers.appServers, appServer)
            : state.recentServers.appServers,
        },
      };
    }

    case SERVER_ACTIONS.SET_STREAM_SERVER_STATUS:
      return {
        ...state,
        streamServerStatus: action.payload as ServerState['streamServerStatus'],
      };

    case SERVER_ACTIONS.SET_APP_SERVER_STATUS:
      return {
        ...state,
        appServerStatus: action.payload as ServerState['appServerStatus'],
      };

    case SERVER_ACTIONS.UPDATE_STREAM_SERVER_HEALTH:
      return {
        ...state,
        streamServerHealth: {
          ...state.streamServerHealth,
          ...(action.payload as Partial<ServerState['streamServerHealth']>),
          lastChecked: Date.now(),
        },
      };

    case SERVER_ACTIONS.UPDATE_APP_SERVER_HEALTH:
      return {
        ...state,
        appServerHealth: {
          ...state.appServerHealth,
          ...(action.payload as Partial<ServerState['appServerHealth']>),
          lastChecked: Date.now(),
        },
      };

    case SERVER_ACTIONS.ADD_RECENT_STREAM_SERVER: {
      const url = action.payload as string;
      return {
        ...state,
        recentServers: {
          ...state.recentServers,
          streamServers: addToRecentList(
            state.recentServers.streamServers,
            url
          ),
        },
      };
    }

    case SERVER_ACTIONS.ADD_RECENT_APP_SERVER: {
      const url = action.payload as string;
      return {
        ...state,
        recentServers: {
          ...state.recentServers,
          appServers: addToRecentList(state.recentServers.appServers, url),
        },
      };
    }

    case SERVER_ACTIONS.CLEAR_RECENT_SERVERS:
      return {
        ...state,
        recentServers: {
          streamServers: [],
          appServers: [],
        },
      };

    case SERVER_ACTIONS.SET_SERVER_ERROR:
      return {
        ...state,
        lastError: action.payload as ServerState['lastError'],
      };

    case SERVER_ACTIONS.CLEAR_SERVER_ERROR:
      return {
        ...state,
        lastError: null,
      };

    case SERVER_ACTIONS.RESET_SERVER_STATE:
      return initialState;

    default:
      return state;
  }
};

// Selectors
export const selectStreamServer = (state: { server: ServerState }) =>
  state.server.streamServer;
export const selectAppServer = (state: { server: ServerState }) =>
  state.server.appServer;
export const selectServers = (state: { server: ServerState }) => ({
  streamServer: state.server.streamServer,
  appServer: state.server.appServer,
});
export const selectServerStatuses = (state: { server: ServerState }) => ({
  streamServer: state.server.streamServerStatus,
  appServer: state.server.appServerStatus,
});
export const selectServerHealth = (state: { server: ServerState }) => ({
  streamServer: state.server.streamServerHealth,
  appServer: state.server.appServerHealth,
});
export const selectRecentServers = (state: { server: ServerState }) =>
  state.server.recentServers;
export const selectServerError = (state: { server: ServerState }) =>
  state.server.lastError;
export const selectIsAnyServerConnected = (state: { server: ServerState }) =>
  state.server.streamServerStatus === 'connected' ||
  state.server.appServerStatus === 'connected';

export default serverReducer;
