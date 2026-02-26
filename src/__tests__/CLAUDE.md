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

### event-bus mock

Always include `publishStatus` in the event-bus mock. Modules such as `speech-utils.js` re-export
`publishStatus as showStatus` from `event-bus.js`, so omitting it causes `showStatus is not a function` errors at runtime.

```javascript
jest.mock('../../modules/event-bus', () => ({
  publish: jest.fn(),
  publishStatus: jest.fn(),
  subscribe: jest.fn(),
  EVENTS: { STATUS_UPDATED: 'status:updated', /* other keys */ }
}));
```

### dom-utils mock

Modules that previously imported `isInputElement` from `utils.js` now import it from `dom-utils.js`.
When testing those modules (e.g., `speech-recognition.js`, `speech-edit.js`, `ui-events.js`), mock
`dom-utils` and set the implementation there — not on `utils`:

```javascript
import * as domUtils from '../../modules/dom-utils';
jest.mock('../../modules/dom-utils');

// In beforeEach:
domUtils.isInputElement.mockImplementation(el =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
);
```

### General pattern

```javascript
jest.mock('../../modules/state');
jest.mock('../../modules/error-handler', () => ({
  handleError: jest.fn(),
  createError: jest.fn((code, msg, orig, ctx, sev) => ({ code, message: msg, originalError: orig })),
  ERROR_CODE: { SPEECH: { STOP_FAILED: 'SPEECH_STOP_FAILED' }, DOM: { ELEMENT_NOT_FOUND: '...' } },
  ERROR_CATEGORY: { SPEECH: 'SPEECH', DOM: 'DOM', API: 'API' },
  ERROR_SEVERITY: { INFO: 'INFO', WARNING: 'WARNING', ERROR: 'ERROR', CRITICAL: 'CRITICAL' }
}));
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
