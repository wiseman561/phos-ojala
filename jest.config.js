/**
 * Jest configuration for the Phos Healthcare Platform
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'jsdom',

  // Root directory
  rootDir: '.',

  // Module name mapping for imports
  moduleNameMapper: {
    // Application aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@components/(.*)$': '<rootDir>/src/frontend/components/$1',
    '^@services/(.*)$': '<rootDir>/src/backend/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/src/contexts/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',

    // Mock paths
    '^../server$': '<rootDir>/src/__mocks__/server.js',
    '^../alertSeverity$': '<rootDir>/src/__mocks__/alertSeverity.js',
    '^../chat$': '<rootDir>/src/__mocks__/chat.js',
    '^../config/(.*)$': '<rootDir>/src/__mocks__/config/$1',
    '^../middleware/(.*)$': '<rootDir>/src/__mocks__/middleware/$1',
    '^../processor$': '<rootDir>/src/__mocks__/processor.js',

    // Fix paths for tests after moving to src/__tests__
    '\\.\\./\\.\\./(.*)/src/(.*)$': '<rootDir>/src/$1/$2',

    // Testing utilities
    '^@testing$': '<rootDir>/src/utils/test-utils.ts',
    '^@mocks/(.*)$': '<rootDir>/src/__mocks__/$1',

    // Static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/src/__mocks__/fileMock.js',
  },

  // Setup files to run before each test
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts'
  ],

  // Test matching patterns
  testMatch: [
    '<rootDir>/src/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}'
  ],

  // Paths to ignore for tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/build/',
    '/dist/',
    '/cypress/',
    '/.git/'
  ],

  // Code transformations
  transform: {
    // TypeScript files
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: {
          ignoreCodes: [151001],
          warnOnly: true
        }
      }
    ],
    // JavaScript files
    '^.+\\.(js|jsx|mjs)$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'ecmascript',
            jsx: true
          },
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        }
      }
    ]
  },

  // Ignore patterns for transforms
  transformIgnorePatterns: [
    'node_modules/(?!(sinon|@testing-library|@babel|@jest|@sinonjs|jest-extended|jest-axe)/)'
  ],

  // Module directories
  moduleDirectories: ['node_modules', 'src'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Testing timeout (10 seconds)
  testTimeout: 10000,

  // Coverage settings
  collectCoverage: false, // Only collect when explicitly requested
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,jsx,ts,tsx}',
    '!src/serviceWorker.{js,jsx,ts,tsx}',
    '!src/reportWebVitals.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/test-utils.*',
    '!src/**/setupTests.*',
    '!src/cypress/**',
    '!**/node_modules/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    'src/features/auth/**/*.{ts,tsx}': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Path ignore patterns
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/build/'],

  // Runtime options
  testEnvironmentOptions: {
    url: 'http://localhost',
    customExportConditions: ['node', 'node-addons']
  },

  // Debugging and reporting
  verbose: true,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'jest-junit.xml'
      }
    ]
  ],

  // Handle problem detection - disabled for now to reduce noise
  detectLeaks: false,
  detectOpenHandles: false,
  errorOnDeprecated: false,

  // Haste configuration - fixed to properly handle module naming collisions
  haste: {
    enableSymlinks: false,
    forceNodeFilesystemAPI: true
  },

  // Cache settings
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',

  // Watch settings
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/'
  ]
};
