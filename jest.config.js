/** @type {import('jest').Config} */
module.exports = {
  // Set the test environment to jsdom to simulate browser environment
  testEnvironment: 'jsdom',
  
  // Specify file extensions to be treated as test files
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  
  // Specify directories to ignore
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Setup files to run before tests
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  // Mock file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Configure coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
    '!**/dist/**'
  ],
  
  // Configure coverage directory
  coverageDirectory: 'coverage',
  
  // Mock Chrome API for testing
  globals: {
    chrome: {
      i18n: {
        getMessage: (key) => key
      },
      storage: {
        sync: {
          get: () => {},
          set: () => {}
        },
        local: {
          get: () => {},
          set: () => {}
        }
      }
    }
  }
};