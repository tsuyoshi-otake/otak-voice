# CLAUDE.md - otak-voice

## Project Overview

otak-voice is a Chrome Extension (Manifest V3) that provides voice input with GPT-powered text correction on any webpage. The content script (`dist/content.js`) runs on all HTTP/HTTPS pages. A background service worker (`dist/background.js`) handles extension lifecycle events and message passing. The extension uses the Web Speech API for recognition and the OpenAI API for text correction/proofreading/editing.

## Quick Start

```bash
npm install              # Install dependencies
npm run build            # Build with esbuild (outputs to dist/)
npm test                 # Run Jest tests
npm run test:coverage    # Run tests with coverage reports
npm run test:integration # Run integration tests only
```

## Architecture

### Entry Points

- **Content script**: `src/content.js` - Initializes all modules via `runInitialization()`, creates UI, sets up DOM observer for SPA support, runs self-healing check every 10s.
- **Background script**: `src/background.js` - Handles `onInstalled` (saves defaults) and `onMessage` (settings retrieval).

### Core Patterns

- **Event Bus** (`src/modules/event-bus.js`): Publish-subscribe pattern for decoupled cross-module communication. All event names defined in `EVENTS` constant. Use `publish(EVENTS.X, data)` and `subscribe(EVENTS.X, handler)`. Use `publishStatus(messageKey, substitutions?, persistent?)` as a convenience wrapper for `STATUS_UPDATED` events — importable by all layers without circular dependency risk.
- **Observable State** (`src/modules/state.js`): Centralized state with `getState(key)` / `setState(key, value)`. Supports subscriber notifications on change. No window globals for state.
- **Site Handler Strategy** (`src/site-handlers/`): `site-detector.js` detects the current site and returns the appropriate handler (systemexe, twitter, ai-chat, default). Each handler exports a consistent interface for site-specific behavior.
- **Error Handling** (`src/modules/error-handler.js`): Structured errors via `AppError` class with `ERROR_CATEGORY`, `ERROR_CODE`, and `ERROR_SEVERITY`. Use `createError()`, `handleError()`, or `tryCatch()`.

### OpenAI Integration

- `gpt-4.1-mini` - Auto-correction (real-time, lightweight)
- `gpt-5.2` - Proofreading and editing (higher quality)
- Models defined in `src/constants.js` as `GPT_MODELS`

## Directory Structure

```
src/
  content.js              # Content script entry point
  background.js           # Background service worker entry point
  constants.js            # Shared constants (GPT_MODELS, SITE_TYPES, DEFAULT_SETTINGS, UI_FEEDBACK, GPT_PARAMS, PAPER_PLANE_SVG)
  icons.js                # SVG icon definitions
  modules/                # Core functionality modules
    event-bus.js           # Pub-sub event system
    state.js               # Observable state management
    gpt-service.js         # OpenAI API calls (correct, proofread, edit)
    speech.js              # Web Speech API integration
    ui.js                  # UI creation and event listeners
    input-handler.js       # Input field detection and text insertion
    settings.js            # Chrome storage settings management
    error-handler.js       # Structured error handling
    history.js             # Voice input history
    dom-observer.js        # MutationObserver for SPA support
    dom-utils.js           # DOM utility functions
    utils.js               # General utilities
  site-handlers/           # Site-specific behavior handlers
    site-detector.js       # Detects site type, returns handler
    default.js             # Default handler for generic sites
    ai-chat.js             # AI chat sites (ChatGPT, Claude, Gemini)
    twitter.js             # X/Twitter
    systemexe.js           # System.exe R&D
    openai-chatgpt.js      # OpenAI ChatGPT specific
    anthropic-claude.js    # Anthropic Claude specific
    google-gemini.js       # Google Gemini specific
  __tests__/               # Jest test files
    modules/               # Unit tests for src/modules/
    site-handlers/         # Unit tests for src/site-handlers/
    integration/           # Integration tests
    helpers/               # Test helper utilities
_locales/                  # i18n message files
  ja/                      # Japanese (default locale)
  en/                      # English
  vi/                      # Vietnamese
dist/                      # Build output (git-ignored)
scripts/                   # Build scripts (copy-assets.js)
```

## Key Conventions

### Code Style
- All source files should be under 298 lines.
- Use ES module imports/exports in source files.
- Use `chrome.i18n.getMessage()` for all user-facing strings. Never hardcode UI text.

### Communication
- Use `event-bus.js` for cross-module communication. Import `{ publish, subscribe, EVENTS }` from the event bus.
- Never create circular imports between modules. The event bus exists to prevent this.

### State Management
- Use `getState(key)` / `setState(key, value)` from `state.js` for all shared state.
- Do not store state on `window` globals. The state module handles backward compatibility internally.

### Error Handling
- Use `createError(ERROR_CODE, message, originalError, details, severity)` to create errors.
- Use `handleError(error, showNotification, persistent, source)` to handle them.
- Use `tryCatch(fn, options)` for async operations that should not crash.

### Internationalization
- Default locale is `ja` (Japanese). Supported: ja, en, vi.
- All message keys defined in `_locales/{lang}/messages.json`.
- Use `__MSG_keyName__` in manifest.json for extension name/description.

## Testing

### Setup
- Jest with `jsdom` environment.
- Chrome APIs mocked globally in `jest.setup.js`.
- Config in `jest.config.js`. Transform via `babel-jest`.

### Structure
- Test files mirror source: `src/__tests__/modules/*.test.js` and `src/__tests__/site-handlers/*.test.js`.
- Integration tests in `src/__tests__/integration/`.
- Test helpers in `src/__tests__/helpers/`.

### Running Tests
```bash
npm test                                    # All tests
npm run test:coverage                       # With coverage report
npm run test:integration                    # Integration tests only
npm run test:site-handlers                  # Site handler tests only
npx jest --testPathPattern="state"          # Run specific test file
```

## Build

esbuild bundles two entry points:

| Entry | Output | Format | Notes |
|---|---|---|---|
| `src/content.js` | `dist/content.js` | IIFE | Runs in page context |
| `src/background.js` | `dist/background.js` | ESM | Service worker (module type) |

After bundling, `scripts/copy-assets.js` copies static assets to `dist/`.

The built extension is loaded from the project root. `manifest.json` references `dist/content.js`, `dist/background.js`, and `style.css`.
