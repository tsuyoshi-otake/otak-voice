# Tests Directory Guide

## Test Organization

```
src/__tests__/
  modules/          Unit tests for src/modules/
  site-handlers/    Tests for src/site-handlers/
  helpers/          Test utilities and helpers
  integration/      Cross-module integration tests
  basic.test.js     Constants smoke tests
  background.test.js  Background service worker tests
  content.test.js   Content script initialization tests
  setup.js          Shared test setup utilities
```

## Test Environment

- Jest with `jsdom` environment (configured in `jest.config.js`)
- Chrome APIs mocked globally in `jest.setup.js` (project root)
- ES modules transpiled via Babel (`babel-jest`)
- Test files matched by `**/__tests__/**/*.test.js` and `*.spec.js`

## Chrome API Mocking Pattern

The global mock in `jest.setup.js` provides baseline Chrome APIs:

```javascript
global.chrome = {
  i18n: { getMessage: (key) => key },
  storage: {
    sync: { get: () => {}, set: () => {} },
    local: { get: () => {}, set: () => {} }
  }
};
```

For tests needing controllable mocks, override with `jest.fn()`:

```javascript
global.chrome = {
  i18n: { getMessage: jest.fn((key) => key) },
  storage: { sync: { get: jest.fn(), set: jest.fn() } },
  runtime: { id: 'test-id', onMessage: { addListener: jest.fn() } }
};
```

## Module Mocking Pattern

```javascript
jest.mock('../../modules/event-bus', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
  EVENTS: { /* constants */ }
}));
```

## Window Globals

`jest.setup.js` sets extension-specific window properties:

```javascript
global.window = {
  ...global.window,
  currentInputElement: null,
  isListening: false,
  apiKey: '',
  recognitionLang: 'ja-JP',
  processingState: 'idle',
  // ... other extension state
};
```

## Conventions

- Test files should be under 298 lines
- Use `jest.fn()` for mock functions
- Clean up DOM and mocks in `beforeEach`
- Use `jest.spyOn` for console mocking
- Console methods (`log`, `warn`, `error`) are mocked globally via `jest.setup.js`
- Reset `document.body.innerHTML` when tests manipulate the DOM

## Running Tests

```bash
npm test                      # All tests
npm run test:coverage         # With coverage report
npx jest path/to/test.js     # Single file
```

## Coverage

- Reports: text, lcov, html (output to `coverage/`)
- Minimum thresholds: 10% branches, 15% functions, 10% lines/statements
- Excluded from collection: test files, helpers, setup.js, node_modules, dist
