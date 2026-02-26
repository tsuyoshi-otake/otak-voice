# Site Handlers

Platform-specific DOM manipulation handlers for the otak-voice Chrome Extension. Each handler knows how to locate input fields, find submit buttons, and submit text on its target platform.

## Directory Structure

```
src/site-handlers/
  site-detector.js       # Detects current site, returns appropriate handler
  ai-chat.js             # Central dispatcher for AI chat platforms
  openai-chatgpt.js      # ChatGPT (chat.openai.com)
  anthropic-claude.js    # Claude (claude.ai)
  google-gemini.js       # Gemini (gemini.google.com)
  systemexe.js           # System.exe R&D platform
  twitter.js             # Twitter / X.com
  default.js             # Fallback for all other sites
```

## Detection Flow

`site-detector.js` checks `window.location.hostname` and DOM selectors to determine the site type (defined in `src/constants.js` as `SITE_TYPES`):

1. **SYSTEMEXE** -- hostname includes `systemexe-research-and-development.com` --> `systemexe.js`
2. **TWITTER** -- hostname includes `twitter.com` or `x.com` --> `twitter.js`
3. **AI_CHAT** -- detected via AI chat DOM selectors (submit buttons, SVG icons) --> `ai-chat.js`
4. **DEFAULT** -- everything else --> `default.js`

When `AI_CHAT` is selected, `ai-chat.js` acts as a secondary dispatcher. It calls each sub-handler's detection function (`isChatGPTSite()`, `isClaudeSite()`, `isGeminiSite()`) then falls back to hostname matching:

- `chat.openai.com` --> `openai-chatgpt.js`
- `claude.ai` / `anthropic.com` --> `anthropic-claude.js`
- `gemini.google.com` / `bard.google.com` --> `google-gemini.js`
- Unknown AI chat --> defaults to OpenAI handler

## Handler Interface

Every handler exports these functions:

### `findBestInputField()`
Returns the best `Element` for text input on the platform, or `null`. Each handler defines platform-specific CSS selectors (e.g., `CHATGPT_SELECTORS`, `CLAUDE_SELECTORS`, `GEMINI_SELECTORS`) to locate the correct textarea or contenteditable element.

### `submitAfterVoiceInput(inputField?)`
Locates and clicks the submit button after voice input. Returns `true` if submission started, `false` otherwise. Checks for disabled state before clicking.

### `findSubmitButtonForInput(inputElement)`
Finds the submit button associated with a given input element. Returns `Element | null`.

### Platform detection (AI chat sub-handlers only)
- `isChatGPTSite()` -- openai-chatgpt.js
- `isClaudeSite()` -- anthropic-claude.js
- `isGeminiSite()` -- google-gemini.js

## Shared Utilities (`src/modules/dom-utils.js`)

Handlers import common DOM helpers:

| Function | Purpose |
|---|---|
| `isButtonDisabled(button)` | Check if a button is disabled (attribute, class, or aria) |
| `filterVisibleElements(elements)` | Filter an element list to only visible elements |
| `isInputElement(element)` | Check if an element is a valid input target |
| `findBestSubmitButton(inputElement)` | Score and rank nearby submit buttons |
| `findBestInputField()` | Generic input field detection with scoring |
| `clickButtonWithFeedback(button)` | Click a button and provide visual feedback |
| `findElement(selector)` | Query a single element |
| `findAllElements(selector)` | Query all matching elements |
| `setInputValue(element, text)` | Set value with proper event dispatch |
| `dispatchEvent(element, eventType)` | Dispatch synthetic DOM events |

## Adding a New Handler

1. **Create the handler file** at `src/site-handlers/new-platform.js`:
   ```js
   import { isButtonDisabled, filterVisibleElements } from '../modules/dom-utils.js';

   const SELECTORS = [ /* platform-specific CSS selectors */ ];

   export function findBestInputField() { /* ... */ }
   export function submitAfterVoiceInput() { /* ... */ }
   export function findSubmitButtonForInput(inputElement) { /* ... */ }
   ```

2. **Register in `site-detector.js`**:
   - Import the handler module
   - Add hostname detection in `detectSiteType()`
   - Add a case in `getSiteHandler()` switch
   - If it is an AI chat variant, register in `ai-chat.js` instead

3. **Add a SITE_TYPES constant** in `src/constants.js` if it needs its own type.

4. **Write tests** at `src/__tests__/site-handlers/new-platform.test.js`. Follow existing test patterns -- mock `window.location`, `document.querySelector`, and `chrome.i18n`.

## Key Design Notes

- **Twitter** uses a modal-based approach instead of direct DOM insertion because X.com's React/Draft.js editor breaks when the DOM is manipulated directly.
- **AI chat dispatcher** (`ai-chat.js`) tries detection functions first, then hostname matching, then falls back to OpenAI as the default handler.
- All handlers use `chrome.i18n.getMessage()` for user-facing log messages.
- Event bus (`src/modules/event-bus.js`) is used for status updates via `publish(EVENTS.STATUS_UPDATED, ...)`.
