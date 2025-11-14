// Mock performance for NVIDIA library
if (typeof performance === 'undefined') {
  global.performance = {
    mark: function() {},
    measure: function() {},
    clearMarks: function() {},
    clearMeasures: function() {},
    getEntriesByName: function() { return []; },
    getEntriesByType: function() { return []; },
    now: function() { return Date.now(); },
  };
} else {
  // Ensure all performance methods exist
  if (!performance.mark) performance.mark = function() {};
  if (!performance.measure) performance.measure = function() {};
  if (!performance.clearMarks) performance.clearMarks = function() {};
  if (!performance.clearMeasures) performance.clearMeasures = function() {};
  if (!performance.getEntriesByName) performance.getEntriesByName = function() { return []; };
  if (!performance.getEntriesByType) performance.getEntriesByType = function() { return []; };
  if (!performance.now) performance.now = function() { return Date.now(); };
}

// Create a simple mock for the NVIDIA library to avoid import issues
global.__NVIDIA_LIBRARY_MOCK__ = {
  AppStreamer: function() {
    return {
      start: function() { return Promise.resolve(); },
      stop: function() { return Promise.resolve(); },
      sendMessage: function() { return Promise.resolve(); },
      addEventListener: function() {},
      removeEventListener: function() {},
      destroy: function() {},
      setVideoElement: function() {},
      setAudioElement: function() {},
    };
  },
  eStatus: {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    ERROR: 'error',
    CONNECTING: 'connecting',
  },
  eAction: {
    START: 'start',
    STOP: 'stop',
  },
  StreamEvent: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    STREAM_START: 'stream_start',
    STREAM_STOP: 'stream_stop',
    MESSAGE_RECEIVED: 'message_received',
    ERROR: 'error',
  },
};

// Mock import.meta for Jest environment
// Since we can't define 'import' as a global property, we'll handle this differently
// We need to transform the constants file to avoid using import.meta

// Ensure React is properly loaded
// eslint-disable-next-line @typescript-eslint/no-var-requires
const React = require('react');
if (!React.lazy) {
  React.lazy = function(_fn) {
    return function LazyComponent(_props) {
      return React.createElement('div', { 'data-testid': 'lazy-component' }, 'Lazy Component');
    };
  };
}

// Default global fetch mock for stream config used by pages
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: async () =>
      JSON.stringify({
        source: 'local',
        local: { url: 'http://localhost:8080' },
      }),
  });
}