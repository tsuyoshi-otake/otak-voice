# Modules Directory - otak-voice Chrome Extension

Core functionality modules for the otak-voice voice input Chrome Extension.

## Module Overview

| File | Lines | Description |
|------|-------|-------------|
| `event-bus.js` | 189 | Pub/sub event system with 39 event types across 7 categories |
| `state.js` | 276 | Observable state management with `getState`/`setState` and subscriber notifications |
| `error-handler.js` | 351 | Centralized error handling with categories, codes, severity levels, and i18n mapping |
| `settings.js` | 595 | Chrome storage sync settings with schema validation and event-driven persistence |
| `dom-observer.js` | 129 | MutationObserver for SPA navigation support with debounced mutation handling |
| `history.js` | 119 | Voice input history tracking (max 10 entries) with deduplication |
| `utils.js` | 143 | Generic utilities: `basicCleanup`, `isInputElement`, `forceSetTextAreaValue` |
| `dom-utils.js` | 913 | DOM operations: visibility checks, input detection, button detection, input manipulation, element actions |
| `ui.js` | 1357 | UI components: core menu, settings modal, recognition modal, event wiring |
| `speech.js` | 972 | Speech recognition lifecycle, edit mode, and speech utilities |
| `input-handler.js` | 942 | Input field management: storage, menu control, operations, initialization |
| `gpt-service.js` | 394 | OpenAI GPT integration: API client, auto-correction, proofreading, editing |

## Dependency Layers

```
Layer 4 (consumers):   ui.js, speech.js, input-handler.js
                            |          |          |
Layer 3 (services):    dom-utils.js, gpt-service.js, settings.js, utils.js
                            |          |                |          |
Layer 2 (core state):  state.js, error-handler.js, history.js
                            |          |                |
Layer 1 (no deps):     constants.js, icons.js, event-bus.js
```

- **Layer 1** - No internal dependencies. `constants.js` and `icons.js` live in `src/` (parent directory).
- **Layer 2** - Depends only on Layer 1. `state.js` imports from `constants.js`; `error-handler.js` imports from `event-bus.js`.
- **Layer 3** - Depends on Layers 1-2. `settings.js` uses state, event-bus, and error-handler.
- **Layer 4** - Depends on all lower layers. These are the main feature modules.

## Event Bus Reference

### Usage Pattern

```javascript
import { publish, subscribe, EVENTS } from './event-bus.js';

// Subscribe (returns unsubscribe function)
const unsub = subscribe(EVENTS.SPEECH_RECOGNITION_STARTED, (data) => { ... });

// Publish
publish(EVENTS.SPEECH_RECOGNITION_RESULT, { final: true, text: 'hello', append: false });

// Cleanup
unsub();
```

### Event Categories (39 total)

**UI Events (12):** Menu toggle, settings/recognition modals, append mode, auto-submit, processing state, status updates, UI recovery.
- `MENU_TOGGLED` - `{ expanded: boolean }`
- `PROCESSING_STATE_CHANGED` - `{ state: PROCESSING_STATE }`
- `STATUS_UPDATED` - `{ messageKey, substitutions, persistent }`
- `UI_RECOVERY_NEEDED` - triggers UI re-creation after SPA navigation

**Input Events (4):** Field found/clicked, input cleared, handler updates.
- `INPUT_FIELD_FOUND` - `{ element }`
- `INPUT_FIELD_CLICKED` - `{ element }`

**Speech Events (4):** Recognition start/stop/result, mic button click.
- `SPEECH_RECOGNITION_RESULT` - `{ final, text, append }`

**Settings Events (5):** Save/load, API key, language, theme updates.
- `SETTINGS_SAVED` - full settings object
- `SETTINGS_LOADED` - full settings object

**History Events (2):** `HISTORY_ADDED`, `HISTORY_PANEL_TOGGLED`

**GPT Events (9):** Started/completed/failed for correction, proofreading, and editing.
- Pattern: `GPT_CORRECTION_COMPLETED` - `{ text }`
- Pattern: `GPT_CORRECTION_FAILED` - `{ error }`

**System Events (3):** `INITIALIZATION_COMPLETE`, `INITIALIZATION_ERROR`, `ERROR_OCCURRED`

## State Management

```javascript
import { getState, setState, subscribe } from './state.js';

// Read state
const isListening = getState('isListening');
const allState = getState(); // returns copy of full state

// Update state (notifies subscribers only if value changed)
setState('isListening', true);
setState({ isListening: true, appendMode: false }); // batch update

// React to changes
const unsub = subscribe('isListening', (newValue) => { ... });
```

### State Keys
- **Input:** `currentInputElement`, `lastClickedInput`, `autoSubmit`, `originalText`, `interimText`, `lastRecognizedText`, `appendMode`, `isEditing`
- **UI:** `processingState`, `menuExpanded`, `showModalWindow`, `modalOriginalText`, `lastAppendedText`, `newRecognitionSession`
- **Speech:** `isListening`, `silenceTimeout`
- **Settings:** `apiKey`, `recognitionLang`, `autoDetectInputFields`, `autoCorrection`, `useHistoryContext`, `themeMode`, `autoCorrectionPrompt`, `proofreadingPrompt`

## Error Handling

```javascript
import { createError, handleError, tryCatch, ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY } from './error-handler.js';

// Create and handle an error
const error = createError(
  ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED,
  'Custom message',        // optional, falls back to i18n
  originalError,           // optional
  { userMessage: '...' },  // optional details
  ERROR_SEVERITY.ERROR     // INFO | WARNING | ERROR | CRITICAL
);
handleError(error, true, false, 'module-name');

// Or use tryCatch wrapper
const result = await tryCatch(asyncFn, {
  errorCode: ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
  source: 'gpt-service'
});
```

**Categories:** NETWORK, API, INPUT, PERMISSION, SPEECH, STORAGE, DOM, UNKNOWN

## Planned Refactoring

Large files are candidates for splitting into focused sub-modules:
- `dom-utils.js` (913 lines) -> `dom-visibility.js`, `dom-input-detection.js`, `dom-button-detection.js`, `dom-input-manipulation.js`, `dom-element-actions.js`
- `ui.js` (1357 lines) -> `ui-core.js`, `ui-settings-modal.js`, `ui-recognition-modal.js`, `ui-events.js`
- `speech.js` (972 lines) -> `speech-recognition.js`, `speech-edit.js`, `speech-utils.js`
- `input-handler.js` (942 lines) -> `storage-manager.js`, `menu-controller.js`, `input-operations.js`, `input-handler-init.js`
- `gpt-service.js` (394 lines) -> `gpt-api-client.js`, `gpt-correction.js`, `gpt-proofreading.js`, `gpt-editing.js`

## Conventions

1. **Target file size:** All files should be under 298 lines. Files exceeding this are refactoring candidates.
2. **No circular imports:** Use the event bus for cross-module communication instead of direct imports.
3. **State management:** Use `state.js` (`getState`/`setState`) exclusively. No `window` globals for new code.
4. **Error handling:** Use `error-handler.js` (`createError`/`handleError`/`tryCatch`). Never swallow errors silently.
5. **Event naming:** Use namespace pattern `category:subcategory:action` (e.g., `speech:recognition:started`).
6. **i18n:** All user-facing strings use `chrome.i18n.getMessage()`. Error codes map to i18n keys via `ERROR_MESSAGE_KEYS`.
