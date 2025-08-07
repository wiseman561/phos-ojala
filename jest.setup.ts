import '@testing-library/jest-dom';
import 'jest-axe/extend-expect';

// Add TextEncoder polyfill
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder; 