/**
 * Jest Setup File
 * ================
 * Global test configuration and mocks
 *
 * This file runs after the test framework is installed in the environment
 * but before each test file is executed.
 */

import '@testing-library/jest-dom';

// ============================================================================
// MOCK: localStorage
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string): string | null => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string): void => {
      delete store[key];
    }),
    clear: jest.fn((): void => {
      store = {};
    }),
    get length(): number {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ============================================================================
// MOCK: sessionStorage
// ============================================================================

const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string): string | null => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string): void => {
      delete store[key];
    }),
    clear: jest.fn((): void => {
      store = {};
    }),
    get length(): number {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// ============================================================================
// MOCK: fetch
// ============================================================================

const mockFetch = jest.fn();

global.fetch = mockFetch;

// Helper to reset fetch mock with default implementation
export const resetFetchMock = () => {
  mockFetch.mockReset();
  mockFetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
      headers: new Headers(),
    })
  );
};

// Initialize with default implementation
resetFetchMock();

// ============================================================================
// MOCK: window.matchMedia
// ============================================================================

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// ============================================================================
// MOCK: ResizeObserver
// ============================================================================

class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock;

// ============================================================================
// MOCK: IntersectionObserver
// ============================================================================

class IntersectionObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  root = null;
  rootMargin = '';
  thresholds = [];
  takeRecords = jest.fn(() => []);
}

global.IntersectionObserver = IntersectionObserverMock as any;

// ============================================================================
// MOCK: window.scrollTo
// ============================================================================

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// ============================================================================
// MOCK: import.meta.env (for Vite)
// ============================================================================

// Note: This is handled in jest.config.js globals, but we can extend here
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000',
        MODE: 'test',
        DEV: false,
        PROD: false,
      },
    },
  },
});

// ============================================================================
// MOCK: window.dispatchEvent for auth:expired
// ============================================================================

const originalDispatchEvent = window.dispatchEvent;
window.dispatchEvent = jest.fn((event: Event) => {
  return originalDispatchEvent.call(window, event);
});

// ============================================================================
// MOCK: Framer Motion
// ============================================================================

jest.mock('framer-motion', () => {
  const React = require('react');

  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('div', { ...props, ref }, children)
      ),
      span: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('span', { ...props, ref }, children)
      ),
      button: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('button', { ...props, ref }, children)
      ),
      input: React.forwardRef((props: any, ref: any) =>
        React.createElement('input', { ...props, ref })
      ),
      form: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('form', { ...props, ref }, children)
      ),
      section: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('section', { ...props, ref }, children)
      ),
      article: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('article', { ...props, ref }, children)
      ),
      header: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('header', { ...props, ref }, children)
      ),
      nav: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('nav', { ...props, ref }, children)
      ),
      aside: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('aside', { ...props, ref }, children)
      ),
      main: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('main', { ...props, ref }, children)
      ),
      footer: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('footer', { ...props, ref }, children)
      ),
      ul: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('ul', { ...props, ref }, children)
      ),
      li: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('li', { ...props, ref }, children)
      ),
      a: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('a', { ...props, ref }, children)
      ),
      p: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('p', { ...props, ref }, children)
      ),
      h1: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('h1', { ...props, ref }, children)
      ),
      h2: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('h2', { ...props, ref }, children)
      ),
      h3: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('h3', { ...props, ref }, children)
      ),
      img: React.forwardRef((props: any, ref: any) =>
        React.createElement('img', { ...props, ref })
      ),
      svg: React.forwardRef(({ children, ...props }: any, ref: any) =>
        React.createElement('svg', { ...props, ref }, children)
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useMotionValue: () => ({ get: () => 0, set: jest.fn() }),
    useTransform: () => ({ get: () => 0 }),
    useSpring: () => ({ get: () => 0, set: jest.fn() }),
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
    useInView: () => true,
    useScroll: () => ({
      scrollY: { get: () => 0 },
      scrollX: { get: () => 0 },
      scrollYProgress: { get: () => 0 },
      scrollXProgress: { get: () => 0 },
    }),
  };
});

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

// Suppress console errors/warnings during tests (optional)
// Uncomment if you want cleaner test output
// const originalError = console.error;
// const originalWarn = console.warn;
// beforeAll(() => {
//   console.error = jest.fn();
//   console.warn = jest.fn();
// });
// afterAll(() => {
//   console.error = originalError;
//   console.warn = originalWarn;
// });

// ============================================================================
// CLEANUP BETWEEN TESTS
// ============================================================================

beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Clear storage
  localStorageMock.clear();
  sessionStorageMock.clear();

  // Reset fetch mock
  resetFetchMock();
});

afterEach(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
});
