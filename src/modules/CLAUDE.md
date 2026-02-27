# Modules Directory - otak-voice Chrome Extension

Core functionality modules for the otak-voice voice input Chrome Extension.

## Module Overview

| File | Lines | Description |
|------|-------|-------------|
| `event-bus.js` | 197 | Pub/sub event system with 37 event types across 7 categories; includes `publishStatus()` convenience helper |
| `state.js` | 282 | Observable state management with `getState`/`setState` and subscriber notifications |
| `error-handler.js` | barrel | Re-exports from `error-types.js` + error handling functions |
| `error-types.js` | 169 | Error categories, codes, severity, AppError class |
| `settings.js` | barrel | Re-exports from settings-schema, settings-storage, settings-theme |
| `settings-schema.js` | 126 | Settings schema definition and validation |
| `settings-storage.js` | 262 | Settings load/save operations |
| `settings-theme.js` | 99 | Theme toggle and application |
| `dom-observer.js` | 129 | MutationObserver for SPA navigation with debounced handling |
| `history.js` | 119 | Voice input history tracking (max 10 entries) |
| `utils.js` | 76 | React state retry via `retryInputEvents` only |
| `dom-utils.js` | barrel | Re-exports from dom-visibility, dom-input-detection, dom-button-detection, dom-input-manipulation |
| `dom-visibility.js` | 66 | Element visibility detection |
| `dom-input-detection.js` | 153 | Input element finding and scoring; canonical `isInputElement` implementation |
| `dom-button-detection.js` | 210 | Button finding and scoring |
| `dom-input-manipulation.js` | 298 | Text input operations, event dispatch, Twitter handling; `clickButtonWithFeedback(button, delayMs?)` |
| `ui.js` | barrel | Re-exports from ui-status, ui-core, ui-settings-modal, ui-recognition-modal, ui-events |
| `ui-status.js` | 188 | Status display and processing state |
| `ui-core.js` | 224 | Core UI creation, menu items with ARIA/keyboard support |
| `ui-settings-modal.js` | 248 | Settings modal, draggable with viewport constraints, ESC close |
| `ui-recognition-modal.js` | 204 | Voice recognition text modal with Submit button (Ctrl+Enter) |
| `ui-events.js` | 190 | Event listeners and event bus subscriptions |
| `speech.js` | barrel | Re-exports from speech-utils, speech-recognition, speech-edit |
| `speech-utils.js` | 229 | Mic button state, audio effects, language update; re-exports `publishStatus as showStatus` |
| `speech-recognition.js` | 294 | Core speech recognition lifecycle |
| `speech-edit.js` | 230 | Speech-based editing functionality |
| `input-handler.js` | barrel | Re-exports from input-storage, input-menu, input-operations, input-handler-init |
| `input-storage.js` | 87 | Chrome storage operations for menu state |
| `input-menu.js` | 73 | Menu toggle with aria-expanded |
| `input-operations.js` | 255 | Input field operations, proofread, enhance handlers |
| `input-handler-init.js` | 167 | Initialization and event subscriptions |
| `gpt-service.js` | barrel | Re-exports from gpt-correction, gpt-proofreading, gpt-editing |
| `gpt-api-client.js` | 86 | Shared OpenAI API request infrastructure (`makeGPTRequest`, `validateApiKey`, `handleAPIError`) |
| `gpt-correction.js` | 142 | Voice input auto-correction |
| `gpt-proofreading.js` | 100 | Text proofreading |
| `gpt-editing.js` | 141 | Instruction-based text editing |

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
- **Layer 3** - Depends on Layers 1-2. `settings.js` uses state, event-bus, and error-handler. `utils.js` imports from state, event-bus, and dom-utils.
- **Layer 4** - Depends on all lower layers. These are the main feature modules.

## Event Bus Reference

### Usage Pattern

```javascript
import { publish, subscribe, publishStatus, EVENTS } from './event-bus.js';

// Subscribe (returns unsubscribe function)
const unsub = subscribe(EVENTS.SPEECH_RECOGNITION_STARTED, (data) => { ... });

// Publish a generic event
publish(EVENTS.SPEECH_RECOGNITION_RESULT, { final: true, text: 'hello', append: false });

// Publish a STATUS_UPDATED event (preferred shorthand)
publishStatus('statusClearSuccess');
publishStatus('statusProofreading', undefined, true); // persistent

// Cleanup
unsub();
```

`publishStatus(messageKey, substitutions?, persistent?)` is a Layer-1 convenience wrapper for
`publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent })`.
All layers can import it safely — no need for private proxy functions.

### Event Categories (37 total)

**UI Events (10):** Menu toggle, settings/recognition modals, append mode, processing state, status updates, UI recovery.
- `MENU_TOGGLED` - `{ expanded: boolean }`
- `PROCESSING_STATE_CHANGED` - `{ state: PROCESSING_STATE }`
- `STATUS_UPDATED` - `{ messageKey, substitutions, persistent }`
- `UI_RECOVERY_NEEDED` - triggers UI re-creation after SPA navigation

**Input Events (4):** Field found/clicked, input cleared, handler updates.
- `INPUT_FIELD_FOUND` - `{ element }`
- `INPUT_FIELD_CLICKED` - `{ element }`

**Speech Events (4):** Recognition start/stop/result, mic button click.
- `SPEECH_RECOGNITION_RESULT` - `{ final, text, append, submit }`

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
- **Input:** `currentInputElement`, `lastClickedInput`, `originalText`, `interimText`, `lastRecognizedText`, `appendMode`, `isEditing`
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

> **Note:** Import error utilities directly from `error-handler.js`. `gpt-api-client.js` no longer
> re-exports them; it only exports `makeGPTRequest`, `validateApiKey`, and `handleAPIError`.

## Barrel Files

Large modules have been split into focused sub-modules. Original files are now barrel re-exports for backward compatibility. Import from either the barrel or the specific sub-module:

```javascript
// Both work:
import { showStatus } from './ui.js';           // via barrel
import { showStatus } from './ui-status.js';     // direct
```

## Conventions

1. **Target file size:** All files should be under 298 lines. Files exceeding this are refactoring candidates.
2. **No circular imports:** Use the event bus for cross-module communication instead of direct imports.
3. **State management:** Use `state.js` (`getState`/`setState`) exclusively. No `window` globals for new code.
4. **Error handling:** Use `error-handler.js` (`createError`/`handleError`/`tryCatch`). Never swallow errors silently.
5. **Event naming:** Use namespace pattern `category:subcategory:action` (e.g., `speech:recognition:started`).
6. **i18n:** All user-facing strings use `chrome.i18n.getMessage()`. Error codes map to i18n keys via `ERROR_MESSAGE_KEYS`.
7. **Status messages:** Use `publishStatus(messageKey)` from `event-bus.js` instead of a private `showStatus` proxy. Do not duplicate the proxy pattern.
8. **`isInputElement`:** The canonical implementation is in `dom-input-detection.js` (includes visibility check). Import via `dom-utils.js`. Do not use the removed version from `utils.js`.
