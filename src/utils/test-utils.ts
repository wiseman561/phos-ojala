import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';

// Add jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock auth context
const mockAuthContext = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null
};

// Mock router hooks
const mockRouter = {
  navigate: jest.fn(),
  location: {
    pathname: '/',
    state: { from: { pathname: '/dashboard' } }
  }
};

// The providers wrapper component
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(BrowserRouter, null, children);
};

// Custom render function with providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

// Create a user event instance
const createEvent = (options?: Parameters<typeof userEvent.setup>[0]) => {
  return userEvent.setup({
    advanceTimers: jest.advanceTimersByTime,
    ...options,
  });
};

// Helper to wait for a specific time
const waitMs = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Helper to create mock API responses
const mockApiResponse = <T>(data: T, status = 200, statusText = 'OK'): Response => {
  return {
    status,
    statusText,
    ok: status >= 200 && status < 300,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers(),
    clone: function() { return this; },
  } as Response;
};

// Helper to run accessibility tests
const testA11y = async (ui: React.ReactElement) => {
  const { container } = customRender(ui);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Mock auth API responses
const mockAuthResponses = {
  login: {
    success: {
      token: 'mock.token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'employer'
      }
    },
    error: {
      message: 'Invalid credentials'
    }
  },
  register: {
    success: {
      message: 'User registered successfully',
      user: {
        id: '2',
        name: 'New User',
        email: 'new@example.com',
        role: 'employer'
      }
    },
    error: {
      message: 'Email already exists'
    }
  },
  refresh: {
    success: {
      token: 'new.mock.token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'employer'
      }
    },
    error: {
      message: 'Invalid refresh token'
    }
  }
};

// Export everything from react testing library
export * from '@testing-library/react';

// Export our custom utilities
export {
  customRender as render,
  createEvent,
  waitMs,
  mockApiResponse,
  testA11y,
  mockAuthContext,
  mockRouter,
  mockAuthResponses
}; 