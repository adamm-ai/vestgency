/**
 * Jest Configuration
 * ===================
 * Test infrastructure for Vestate/At Home React application
 *
 * Run tests with: npm test
 * Run with coverage: npm run test:coverage
 * Run in watch mode: npm run test:watch
 *
 * @see https://jestjs.io/docs/configuration
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Use jsdom for browser-like environment
  testEnvironment: 'jsdom',

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module name mapper for handling non-JS imports
  moduleNameMapper: {
    // Handle CSS/SCSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',

    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',

    // Handle path alias @ -> project root
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Transform TypeScript files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          // Override tsconfig for tests
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: 'ESNext',
          moduleResolution: 'node',
          types: ['jest', '@testing-library/jest-dom', 'node'],
        },
      },
    ],
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/__tests__/**/*.spec.ts?(x)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    // Exclude type definitions
    '!**/*.d.ts',
    // Exclude test files
    '!**/__tests__/**',
    '!**/__mocks__/**',
    // Exclude index files that just re-export
    '!**/index.ts',
  ],

  // Coverage thresholds (can be adjusted as test coverage improves)
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage output directory
  coverageDirectory: '<rootDir>/coverage',

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Globals for import.meta.env support
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:3000',
        MODE: 'test',
      },
    },
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(lucide-react|framer-motion)/)',
  ],
};
