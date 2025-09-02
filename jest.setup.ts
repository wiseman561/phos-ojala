import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Add TextEncoder polyfill
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Custom Jest matchers
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} - ${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} - ${max}`,
        pass: false,
      };
    }
  },

  toMatchOneOf(received: any, expectedArray: any[]) {
    const pass = expectedArray.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to match one of ${expectedArray.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to match one of ${expectedArray.join(', ')}`,
        pass: false,
      };
    }
  }
}); 