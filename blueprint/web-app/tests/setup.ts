import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock as unknown as Storage;

// Mock fetch
// Provide a default resolved fetch for stream config parsing
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

// Mock console methods in tests to avoid noise from expected warnings.
// Keep original functions so real errors still surface.
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

function isBenignConsoleMessage(args: unknown[]) {
  if (!args || args.length === 0) return false;
  const first = args[0];
  if (typeof first !== 'string') return false;
  const s = first as string;

  // Common benign messages we see during component lifecycle/testing
  const benign = [
    "Warning: ReactDOM.render is deprecated",
    "Can't call setState on a component that is not yet mounted",
    'No active stream instance to send message to',
    'Error initializing stream',
    'Error initializing stream:',
    'Failed to create session',
    'Failed to connect to session',
    'Cannot end stream - missing sessionId or streamServer',
    'Stream disconnection requested',
    'Message sent to Omniverse',
  ];

  return benign.some(b => s.includes(b));
}

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (isBenignConsoleMessage(args)) return;
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (isBenignConsoleMessage(args)) return;
    originalWarn.call(console, ...args);
  };

  // reduce noisy logs too
  console.log = (...args: unknown[]) => {
    if (isBenignConsoleMessage(args)) return;
    originalLog.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
