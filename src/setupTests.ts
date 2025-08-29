// jest-dom adds custom jest matchers for asserting on DOM nodes.
import '@testing-library/jest-dom';
// Add jest-extended matchers
import 'jest-extended';
import { cleanup } from '@testing-library/react';
// Import userEvent for simulating user interactions
import userEvent from '@testing-library/user-event';
// Import testing utilities
import { render, screen, waitFor, within } from '@testing-library/react';
import sinon from 'sinon';
import { mockAuthContext, mockJwt, mockTokens } from './__mocks__/auth';

// Define global types for MSW server
declare global {
  var server: {
    resetHandlers: () => void;
    close: () => void;
  };
}

// Make testing utilities available globally
declare global {
  namespace NodeJS {
    interface Global {
      render: typeof render;
      screen: typeof screen;
      waitFor: typeof waitFor;
      within: typeof within;
      userEvent: typeof userEvent;
    }
  }
}

// Add custom jest matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },
  toMatchOneOf(received, items: any[]) {
    const pass = items.some((item: any) => {
      try {
        expect(received).toEqual(item);
        return true;
      } catch {
        return false;
      }
    });
    return {
      message: () => `expected ${received} to match one of ${JSON.stringify(items)}`,
      pass
    };
  }
});

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.TEST_ACCESS_TOKEN = mockTokens.accessToken;
process.env.TEST_REFRESH_TOKEN = mockTokens.refreshToken;

// Auto-cleanup after each test
afterEach(() => {
  // Cleanup React Testing Library
  cleanup();
  // Restore all sinon stubs/mocks after each test
  sinon.restore();
  // Clear all mocks
  jest.clearAllMocks();
  // Reset any request handlers
  if (global.server) {
    global.server.resetHandlers();
  }
});

// Clean up test environment when all tests complete
afterAll(() => {
  // Close any open server connections
  if (global.server) {
    global.server.close();
  }
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    ok: true,
    status: 200,
    statusText: 'OK',
  })
) as jest.Mock;

// Handle console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: React.createFactory()') ||
       args[0].includes('Warning: componentWillMount'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  jest.clearAllMocks();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test if this occurs during testing
  throw new Error('Unhandled Promise rejection in test');
});

// Mock TextEncoder/TextDecoder if not available
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Make testing utilities globally available
(global as any).render = render;
(global as any).screen = screen;
(global as any).waitFor = waitFor;
(global as any).within = within;
(global as any).userEvent = userEvent;

// Mock useAuth hook using shared mock
jest.mock('./frontend/employer-dashboard/src/hooks/useAuth', () => ({
  __esModule: true,
  default: () => mockAuthContext
}));

// Mock jsonwebtoken using shared mock
jest.mock('jsonwebtoken', () => {
  const { mockJwt } = require('./__mocks__/auth');
  return mockJwt;
}); 