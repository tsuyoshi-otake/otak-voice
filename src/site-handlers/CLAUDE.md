# Site Handlers

Platform-specific DOM manipulation handlers for the otak-voice Chrome Extension. Each handler knows how to locate input fields, find submit buttons, and submit text on its target platform.

## Directory Structure

```
src/site-handlers/
  site-detector.js       # Detects current site, returns appropriate handler; exports hasPaperPlaneSVG()
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
Locates and clicks the submit button after voice input. Returns `true` if submission started, `false` otherwise. AI chat handlers delegate to `clickButtonWithFeedback(button, UI_FEEDBACK.SUBMIT_DELAY_MS)` from `dom-utils.js` — do not duplicate button-highlight logic.

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
| `isInputElement(element)` | Check if an element is a valid input target (with visibility check) |
| `findBestSubmitButton(inputElement)` | Score and rank nearby submit buttons |
| `findBestInputField()` | Generic input field detection with scoring |
| `clickButtonWithFeedback(button, delayMs?)` | Highlight button, wait `delayMs` ms (default 500), then click |
| `findElement(selector)` | Query a single element |
| `findAllElements(selector)` | Query all matching elements |
| `setInputValue(element, text)` | Set value with proper event dispatch |
| `dispatchEvent(element, eventType)` | Dispatch synthetic DOM events |

## Paper Plane SVG Detection

The paper plane icon is used to identify AI chat submit buttons. Use the helpers instead of duplicating selectors:

```javascript
// In site-detector.js — safe to import from here:
import { hasPaperPlaneSVG } from './site-detector.js';
// Returns true if the SVG element contains the paper plane line + polygon

// In ai-chat.js / systemexe.js — do NOT import from site-detector.js (circular dependency)
// Use PAPER_PLANE_SVG constants from constants.js directly:
import { PAPER_PLANE_SVG } from '../constants.js';
const hasLine = svg.querySelector(PAPER_PLANE_SVG.LINE_SELECTOR);
const hasPolygon = svg.querySelector(PAPER_PLANE_SVG.POLYGON_SELECTOR);
```

## Adding a New Handler

1. **Create the handler file** at `src/site-handlers/new-platform.js`:
   ```js
   import { isButtonDisabled, filterVisibleElements, clickButtonWithFeedback } from '../modules/dom-utils.js';
   import { UI_FEEDBACK } from '../constants.js';

   const SELECTORS = [ /* platform-specific CSS selectors */ ];

   export function findBestInputField() { /* ... */ }
   export function submitAfterVoiceInput() {
       const button = findSubmitButton();
       if (!button || isButtonDisabled(button)) return false;
       return clickButtonWithFeedback(button, UI_FEEDBACK.SUBMIT_DELAY_MS);
   }
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
- Status messages use `publishStatus()` from `event-bus.js` — not `publish(EVENTS.STATUS_UPDATED, ...)` directly.
- Submit button feedback uses `UI_FEEDBACK` constants (`BUTTON_HIGHLIGHT_COLOR`, `BUTTON_HIGHLIGHT_BORDER`, `SUBMIT_DELAY_MS`) from `src/constants.js`.
- **Circular dependency warning:** `ai-chat.js` and `systemexe.js` are imported by `site-detector.js`, so they cannot import from `site-detector.js`. Use `PAPER_PLANE_SVG` constants from `constants.js` instead of `hasPaperPlaneSVG()`.
