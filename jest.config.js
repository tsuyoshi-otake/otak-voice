/** @type {import('jest').Config} */
module.exports = {
  // Set the test environment to jsdom to simulate browser environment
  testEnvironment: 'jsdom',
  
  // Specify file extensions to be treated as test files
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],
  testRegex: null,
  
  // Specify directories to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/setup.js'
  ],
  
  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Setup files to run before tests
  setupFiles: ['<rootDir>/jest.setup.js'],
  
  // Mock file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // カバレッジ測定はtest:coverageコマンドで実行
  collectCoverage: false,
  
  // カバレッジレポート形式
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 最低カバレッジ基準（段階的に引き上げる）
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 10,
      statements: 10
    }
  },
  
  // Configure coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/__tests__/helpers/**',
    '!src/__tests__/setup.js',
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