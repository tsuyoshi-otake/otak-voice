(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/constants.js
  var API_KEY_STORAGE_KEY = "gpt_api_key";
  var RECOGNITION_LANG_STORAGE_KEY = "recognition_lang";
  var AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY = "auto_detect_input_fields";
  var AUTO_CORRECTION_STORAGE_KEY = "auto_correction";
  var USE_HISTORY_CONTEXT_STORAGE_KEY = "use_history_context";
  var THEME_STORAGE_KEY = "theme_mode";
  var AUTO_CORRECTION_PROMPT_STORAGE_KEY = "auto_correction_prompt";
  var PROOFREADING_PROMPT_STORAGE_KEY = "proofreading_prompt";
  var SHOW_MODAL_WINDOW_STORAGE_KEY = "showModalWindow";
  var AUTO_SUBMIT_STORAGE_KEY = "otak_voice_auto_submit_state";
  var SILENCE_TIMEOUT_STORAGE_KEY = "silence_timeout";
  var MAX_HISTORY = 10;
  var SITE_TYPES = {
    SYSTEMEXE: "systemexe",
    TWITTER: "twitter",
    AI_CHAT: "ai_chat",
    DEFAULT: "default"
  };
  var GPT_MODELS = {
    CORRECTION: "gpt-4o-mini",
    PROOFREADING: "gpt-4.1",
    EDITING: "gpt-4.1"
  };
  var THEME_MODES = {
    DARK: "dark",
    LIGHT: "light"
  };
  var DEFAULT_SETTINGS = {
    RECOGNITION_LANG: "ja-JP",
    AUTO_DETECT_INPUT_FIELDS: true,
    AUTO_CORRECTION: false,
    USE_HISTORY_CONTEXT: false,
    THEME: THEME_MODES.DARK,
    SHOW_MODAL_WINDOW: true,
    AUTO_SUBMIT: false,
    CLEAR_EXISTING_TEXT: false,
    SILENCE_TIMEOUT: 3e3,
    // 無音検出のデフォルトタイムアウト: 3秒
    AUTO_CORRECTION_PROMPT: "You are an assistant that corrects Japanese voice input in real-time. Please correct the content spoken by the user (the last message), fixing typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Consider the previous conversation history (if any) as context. Output only the corrected text.",
    PROOFREADING_PROMPT: "You are an assistant that proofreads Japanese text. For the entire text provided by the user, correct typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Please preserve the original meaning and nuance of the text as much as possible. Output only the corrected text."
  };
  var PROCESSING_STATE = {
    IDLE: "idle",
    PROOFREADING: "proofreading",
    EDITING: "editing",
    CORRECTING: "correcting"
  };

  // src/site-handlers/systemexe.js
  var systemexe_exports = {};
  __export(systemexe_exports, {
    findBestInputField: () => findBestInputField2,
    findSubmitButton: () => findSubmitButton,
    findSubmitButtonForInput: () => findSubmitButtonForInput,
    isSystemExePage: () => isSystemExePage,
    submitAfterVoiceInput: () => submitAfterVoiceInput
  });

  // src/modules/event-bus.js
  var _eventHandlers = {};
  function subscribe(eventName, handler) {
    if (typeof handler !== "function") {
      console.warn("Event handler must be a function");
      return () => {
      };
    }
    if (!_eventHandlers[eventName]) {
      _eventHandlers[eventName] = [];
    }
    _eventHandlers[eventName].push(handler);
    return () => {
      if (_eventHandlers[eventName]) {
        _eventHandlers[eventName] = _eventHandlers[eventName].filter((h) => h !== handler);
      }
    };
  }
  function publish(eventName, data) {
    if (!_eventHandlers[eventName]) {
      return;
    }
    _eventHandlers[eventName].forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    });
  }
  var EVENTS = {
    // UI events
    MENU_TOGGLED: "menu:toggled",
    SETTINGS_MODAL_TOGGLED: "settings:modal:toggled",
    APPEND_MODE_TOGGLED: "append:mode:toggled",
    AUTO_SUBMIT_TOGGLED: "auto:submit:toggled",
    AUTO_SUBMIT_STATE_CHANGED: "auto:submit:state:changed",
    PROCESSING_STATE_CHANGED: "processing:state:changed",
    STATUS_UPDATED: "status:updated",
    MODAL_VISIBILITY_TOGGLED: "modal:visibility:toggled",
    RECOGNITION_MODAL_UPDATED: "recognition:modal:updated",
    RECOGNITION_MODAL_SHOWN: "recognition:modal:shown",
    UI_RECOVERY_NEEDED: "ui:recovery:needed",
    MENU_STATE_UPDATE_NEEDED: "menu:state:update:needed",
    // Input events
    INPUT_CLEARED: "input:cleared",
    INPUT_FIELD_FOUND: "input:field:found",
    INPUT_FIELD_CLICKED: "input:field:clicked",
    INPUT_HANDLERS_UPDATE_NEEDED: "input:handlers:update:needed",
    // Speech events
    SPEECH_RECOGNITION_STARTED: "speech:recognition:started",
    SPEECH_RECOGNITION_STOPPED: "speech:recognition:stopped",
    SPEECH_RECOGNITION_RESULT: "speech:recognition:result",
    MIC_BUTTON_CLICKED: "mic:button:clicked",
    // Settings events
    SETTINGS_SAVED: "settings:saved",
    SETTINGS_LOADED: "settings:loaded",
    API_KEY_UPDATED: "api:key:updated",
    LANGUAGE_UPDATED: "language:updated",
    THEME_TOGGLED: "theme:toggled",
    // History events
    HISTORY_ADDED: "history:added",
    HISTORY_PANEL_TOGGLED: "history:panel:toggled",
    // GPT events
    GPT_CORRECTION_STARTED: "gpt:correction:started",
    GPT_CORRECTION_COMPLETED: "gpt:correction:completed",
    GPT_CORRECTION_FAILED: "gpt:correction:failed",
    GPT_PROOFREADING_STARTED: "gpt:proofreading:started",
    GPT_PROOFREADING_COMPLETED: "gpt:proofreading:completed",
    GPT_PROOFREADING_FAILED: "gpt:proofreading:failed",
    GPT_EDITING_STARTED: "gpt:editing:started",
    GPT_EDITING_COMPLETED: "gpt:editing:completed",
    GPT_EDITING_FAILED: "gpt:editing:failed",
    // System events
    INITIALIZATION_COMPLETE: "initialization:complete",
    INITIALIZATION_ERROR: "initialization:error",
    ERROR_OCCURRED: "error:occurred"
  };

  // src/modules/state.js
  var _state = {
    // Input handling state
    currentInputElement: null,
    lastClickedInput: null,
    autoSubmit: true,
    originalText: "",
    interimText: "",
    lastRecognizedText: "",
    appendMode: false,
    isEditing: false,
    // UI state
    processingState: PROCESSING_STATE.IDLE,
    menuExpanded: false,
    showModalWindow: true,
    modalOriginalText: "",
    lastAppendedText: "",
    newRecognitionSession: false,
    // Speech recognition state
    isListening: false,
    silenceTimeout: DEFAULT_SETTINGS.SILENCE_TIMEOUT,
    // Settings
    apiKey: "",
    recognitionLang: DEFAULT_SETTINGS.RECOGNITION_LANG,
    autoDetectInputFields: DEFAULT_SETTINGS.AUTO_DETECT_INPUT_FIELDS,
    autoCorrection: DEFAULT_SETTINGS.AUTO_CORRECTION,
    useHistoryContext: DEFAULT_SETTINGS.USE_HISTORY_CONTEXT,
    themeMode: DEFAULT_SETTINGS.THEME,
    autoCorrectionPrompt: DEFAULT_SETTINGS.AUTO_CORRECTION_PROMPT,
    proofreadingPrompt: DEFAULT_SETTINGS.PROOFREADING_PROMPT
  };
  var _subscribers = {};
  function getState(key) {
    if (key === void 0) {
      return { ..._state };
    }
    if (!(key in _state)) {
      return void 0;
    }
    return _state[key];
  }
  function setState(keyOrObject, value) {
    if (typeof keyOrObject === "object" && keyOrObject !== null) {
      const updates = {};
      let hasChanges = false;
      Object.entries(keyOrObject).forEach(([key2, val]) => {
        if (!(key2 in _state)) {
          return;
        }
        if (_state[key2] !== val) {
          updates[key2] = val;
          hasChanges = true;
        }
      });
      if (hasChanges) {
        Object.entries(updates).forEach(([key2, val]) => {
          _state[key2] = val;
        });
        Object.keys(updates).forEach((key2) => {
          _notifySubscribers(key2, _state[key2]);
        });
        return true;
      }
      return false;
    }
    const key = keyOrObject;
    if (!(key in _state)) {
      return false;
    }
    if (_state[key] !== value) {
      _state[key] = value;
      _notifySubscribers(key, value);
      return true;
    }
    return false;
  }
  function subscribe2(key, callback) {
    if (!(key in _state)) {
      return () => {
      };
    }
    if (typeof callback !== "function") {
      console.warn("Subscriber callback must be a function");
      return () => {
      };
    }
    if (!_subscribers[key]) {
      _subscribers[key] = [];
    }
    _subscribers[key].push(callback);
    return () => {
      if (_subscribers[key]) {
        _subscribers[key] = _subscribers[key].filter((cb) => cb !== callback);
      }
    };
  }
  function _notifySubscribers(key, value) {
    if (_subscribers[key]) {
      _subscribers[key].forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in state subscriber for key "${key}":`, error);
        }
      });
    }
  }
  function initializeStateFromGlobals(windowObj = window) {
    if (typeof windowObj === "undefined") {
      return;
    }
    const stateWindowMap = {
      currentInputElement: "currentInputElement",
      lastClickedInput: "lastClickedInput",
      autoSubmit: "autoSubmit",
      originalText: "originalText",
      isListening: "isListening",
      apiKey: "apiKey",
      recognitionLang: "recognitionLang",
      autoDetectInputFields: "autoDetectInputFields",
      autoCorrection: "autoCorrection",
      useHistoryContext: "useHistoryContext",
      themeMode: "themeMode",
      processingState: "processingState",
      showModalWindow: "showModalWindow",
      modalOriginalText: "modalOriginalText",
      lastAppendedText: "lastAppendedText",
      newRecognitionSession: "newRecognitionSession"
    };
    const updates = {};
    Object.entries(stateWindowMap).forEach(([stateKey, windowKey]) => {
      if (windowKey in windowObj && windowObj[windowKey] !== void 0) {
        updates[stateKey] = windowObj[windowKey];
      }
    });
    if (Object.keys(updates).length > 0) {
      setState(updates);
    }
  }
  function syncStateToGlobals(windowObj = window) {
    if (typeof windowObj === "undefined") {
      return;
    }
    const stateWindowMap = {
      currentInputElement: "currentInputElement",
      lastClickedInput: "lastClickedInput",
      autoSubmit: "autoSubmit",
      originalText: "originalText",
      isListening: "isListening",
      apiKey: "apiKey",
      recognitionLang: "recognitionLang",
      autoDetectInputFields: "autoDetectInputFields",
      autoCorrection: "autoCorrection",
      useHistoryContext: "useHistoryContext",
      themeMode: "themeMode",
      processingState: "processingState",
      showModalWindow: "showModalWindow",
      modalOriginalText: "modalOriginalText",
      lastAppendedText: "lastAppendedText",
      newRecognitionSession: "newRecognitionSession"
    };
    Object.entries(stateWindowMap).forEach(([stateKey, windowKey]) => {
      subscribe2(stateKey, (value) => {
        windowObj[windowKey] = value;
      });
      windowObj[windowKey] = _state[stateKey];
    });
  }
  function initializeState() {
    initializeStateFromGlobals();
    syncStateToGlobals();
    console.log("State management initialized");
  }

  // src/modules/history.js
  var voiceHistory = [];
  setupEventSubscriptions();
  function setupEventSubscriptions() {
    subscribe(EVENTS.HISTORY_PANEL_TOGGLED, () => {
      toggleHistoryPanel();
    });
    subscribe(EVENTS.HISTORY_ADDED, (text) => {
      addToHistory(text);
    });
  }
  function addToHistory(text) {
    if (!text || text.trim() === "") return;
    if (voiceHistory.length > 0 && voiceHistory[voiceHistory.length - 1].text === text) {
      return;
    }
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    voiceHistory.push({
      text,
      timestamp
    });
    if (voiceHistory.length > MAX_HISTORY) {
      voiceHistory.shift();
    }
    const panel = document.querySelector(".otak-voice-history");
    if (panel && getComputedStyle(panel).display !== "none") {
      updateHistoryPanel();
    }
  }
  function updateHistoryPanel() {
    const panel = document.querySelector(".otak-voice-history");
    if (!panel) return;
    const titleElement = panel.firstChild;
    panel.innerHTML = "";
    if (titleElement) panel.appendChild(titleElement);
    if (voiceHistory.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.textContent = chrome.i18n.getMessage("historyPanelEmpty");
      emptyMsg.style.color = "#888";
      emptyMsg.style.padding = "10px 4px";
      emptyMsg.style.fontSize = "13px";
      panel.appendChild(emptyMsg);
      return;
    }
    [...voiceHistory].reverse().forEach((item) => {
      const historyItem = document.createElement("div");
      historyItem.className = "otak-voice-history__item";
      const timeElem = document.createElement("div");
      timeElem.className = "otak-voice-history__time";
      timeElem.textContent = item.timestamp;
      const textElem = document.createElement("div");
      textElem.className = "otak-voice-history__text";
      textElem.textContent = item.text;
      historyItem.appendChild(timeElem);
      historyItem.appendChild(textElem);
      panel.appendChild(historyItem);
    });
  }
  function toggleHistoryPanel() {
    const panel = document.querySelector(".otak-voice-history");
    if (!panel) return;
    const currentDisplay = getComputedStyle(panel).display;
    if (currentDisplay === "none") {
      updateHistoryPanel();
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  }

  // src/modules/utils.js
  function retryInputEvents() {
    const inputField = getState("currentInputElement") || document.activeElement;
    if (isInputElement(inputField)) {
      const currentText = inputField.isContentEditable ? inputField.textContent : inputField.value;
      if (currentText && currentText.trim() !== "") {
        try {
          for (const eventType of ["keydown", "keyup", "keypress", "input", "change"]) {
            const event = eventType.startsWith("key") ? new KeyboardEvent(eventType, {
              key: "a",
              code: "KeyA",
              bubbles: true,
              cancelable: true
            }) : new Event(eventType, { bubbles: true, cancelable: true });
            inputField.dispatchEvent(event);
          }
          if (!inputField.isContentEditable) {
            const tempValue = currentText + " ";
            inputField.value = tempValue;
            inputField.dispatchEvent(new Event("input", { bubbles: true }));
            setTimeout(() => {
              inputField.value = currentText;
              inputField.dispatchEvent(new Event("input", { bubbles: true }));
              inputField.dispatchEvent(new Event("change", { bubbles: true }));
              setTimeout(() => {
                const useRecognitionModal = getState("useRecognitionModal");
                if (!useRecognitionModal) {
                  publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
                    final: true,
                    text: currentText,
                    append: false
                  });
                }
              }, 300);
            }, 50);
            return;
          }
        } catch (e) {
          console.error(chrome.i18n.getMessage("logStateUpdateError"), e);
        }
      }
    }
  }
  function isInputElement(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    const type = el.type ? el.type.toLowerCase() : "";
    const isReadOnly = el.readOnly || el.disabled || el.getAttribute("aria-readonly") === "true";
    return !isReadOnly && (tag === "textarea" || tag === "input" && ["text", "search", "email", "password", "url", "tel", ""].includes(type) || el.isContentEditable);
  }

  // src/modules/error-handler.js
  var ERROR_CATEGORY = {
    NETWORK: "network",
    // Network-related errors (fetch failures, timeouts)
    API: "api",
    // API-related errors (OpenAI API errors, status codes)
    INPUT: "input",
    // Input validation errors (missing fields, invalid formats)
    PERMISSION: "permission",
    // Permission-related errors (microphone access, etc.)
    SPEECH: "speech",
    // Speech recognition errors
    STORAGE: "storage",
    // Storage-related errors (Chrome storage)
    DOM: "dom",
    // DOM manipulation errors
    UNKNOWN: "unknown"
    // Uncategorized errors
  };
  var ERROR_CODE = {
    // Network errors
    [ERROR_CATEGORY.NETWORK]: {
      FETCH_FAILED: "network_fetch_failed",
      TIMEOUT: "network_timeout",
      OFFLINE: "network_offline"
    },
    // API errors
    [ERROR_CATEGORY.API]: {
      INVALID_KEY: "api_invalid_key",
      UNAUTHORIZED: "api_unauthorized",
      RATE_LIMIT: "api_rate_limit",
      BAD_REQUEST: "api_bad_request",
      SERVER_ERROR: "api_server_error",
      UNEXPECTED_RESPONSE: "api_unexpected_response"
    },
    // Input errors
    [ERROR_CATEGORY.INPUT]: {
      MISSING_API_KEY: "input_missing_api_key",
      INVALID_API_KEY_FORMAT: "input_invalid_api_key_format",
      EMPTY_CONTENT: "input_empty_content",
      FIELD_NOT_FOUND: "input_field_not_found"
    },
    // Permission errors
    [ERROR_CATEGORY.PERMISSION]: {
      MIC_DENIED: "permission_mic_denied",
      MIC_UNAVAILABLE: "permission_mic_unavailable"
    },
    // Speech recognition errors
    [ERROR_CATEGORY.SPEECH]: {
      NOT_SUPPORTED: "speech_not_supported",
      NO_SPEECH: "speech_no_speech",
      ABORTED: "speech_aborted",
      START_FAILED: "speech_start_failed",
      STOP_FAILED: "speech_stop_failed"
    },
    // Storage errors
    [ERROR_CATEGORY.STORAGE]: {
      SAVE_FAILED: "storage_save_failed",
      LOAD_FAILED: "storage_load_failed"
    },
    // DOM errors
    [ERROR_CATEGORY.DOM]: {
      ELEMENT_NOT_FOUND: "dom_element_not_found",
      EVENT_DISPATCH_FAILED: "dom_event_dispatch_failed",
      MANIPULATION_FAILED: "dom_manipulation_failed"
    },
    // Unknown errors
    [ERROR_CATEGORY.UNKNOWN]: {
      GENERAL: "unknown_error"
    }
  };
  var ERROR_MESSAGE_KEYS = {
    // Network errors
    [ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED]: "errorNetworkFetchFailed",
    [ERROR_CODE[ERROR_CATEGORY.NETWORK].TIMEOUT]: "errorNetworkTimeout",
    [ERROR_CODE[ERROR_CATEGORY.NETWORK].OFFLINE]: "errorNetworkOffline",
    // API errors
    [ERROR_CODE[ERROR_CATEGORY.API].INVALID_KEY]: "errorApiInvalidKey",
    [ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED]: "errorApiUnauthorized",
    [ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT]: "errorApiRateLimit",
    [ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST]: "errorApiBadRequest",
    [ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR]: "errorApiServerError",
    [ERROR_CODE[ERROR_CATEGORY.API].UNEXPECTED_RESPONSE]: "errorApiUnexpectedResponse",
    // Input errors
    [ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY]: "statusApiKeyMissing",
    [ERROR_CODE[ERROR_CATEGORY.INPUT].INVALID_API_KEY_FORMAT]: "statusApiKeyInvalid",
    [ERROR_CODE[ERROR_CATEGORY.INPUT].EMPTY_CONTENT]: "errorInputEmptyContent",
    [ERROR_CODE[ERROR_CATEGORY.INPUT].FIELD_NOT_FOUND]: "errorInputFieldNotFound",
    // Permission errors
    [ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_DENIED]: "statusSpeechErrorNotAllowed",
    [ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_UNAVAILABLE]: "statusSpeechErrorAudioCapture",
    // Speech recognition errors
    [ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED]: "errorSpeechNotSupported",
    [ERROR_CODE[ERROR_CATEGORY.SPEECH].NO_SPEECH]: "statusSpeechErrorNoSpeech",
    [ERROR_CODE[ERROR_CATEGORY.SPEECH].ABORTED]: "errorSpeechAborted",
    [ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED]: "statusSpeechStartError",
    [ERROR_CODE[ERROR_CATEGORY.SPEECH].STOP_FAILED]: "errorSpeechStopFailed",
    // Storage errors
    [ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED]: "errorStorageSaveFailed",
    [ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED]: "errorStorageLoadFailed",
    // DOM errors
    [ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND]: "errorDomElementNotFound",
    [ERROR_CODE[ERROR_CATEGORY.DOM].EVENT_DISPATCH_FAILED]: "errorDomEventDispatchFailed",
    [ERROR_CODE[ERROR_CATEGORY.DOM].MANIPULATION_FAILED]: "errorDomManipulationFailed",
    // Unknown errors
    [ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL]: "errorUnknown"
  };
  var ERROR_SEVERITY = {
    INFO: "info",
    // Informational messages, not critical
    WARNING: "warning",
    // Warnings that don't prevent core functionality
    ERROR: "error",
    // Errors that affect functionality but don't crash the app
    CRITICAL: "critical"
    // Critical errors that prevent core functionality
  };
  var AppError = class extends Error {
    /**
     * Create a new AppError
     * @param {string} code - Error code from ERROR_CODE
     * @param {string} message - Error message
     * @param {string} severity - Error severity from ERROR_SEVERITY
     * @param {Error|null} originalError - Original error if this is a wrapper
     * @param {Object|null} details - Additional error details
     */
    constructor(code, message, severity = ERROR_SEVERITY.ERROR, originalError = null, details = null) {
      super(message);
      this.name = "AppError";
      this.code = code;
      this.severity = severity;
      this.originalError = originalError;
      this.details = details;
      this.timestamp = /* @__PURE__ */ new Date();
    }
  };
  function createError(errorCode, customMessage = null, originalError = null, details = null, severity = ERROR_SEVERITY.ERROR) {
    const messageKey = ERROR_MESSAGE_KEYS[errorCode] || "errorUnknown";
    const message = customMessage || chrome.i18n.getMessage(messageKey);
    return new AppError(errorCode, message, severity, originalError, details);
  }
  function handleError(error, showNotification = true, persistent = false, source = null) {
    const appError = error instanceof AppError ? error : createError(
      ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL,
      error.message,
      error,
      null,
      ERROR_SEVERITY.ERROR
    );
    logError(appError, source);
    if (showNotification) {
      notifyUser(appError, persistent);
    }
    publish(EVENTS.ERROR_OCCURRED, {
      code: appError.code,
      message: appError.message,
      severity: appError.severity,
      source,
      timestamp: appError.timestamp
    });
  }
  function logError(error, source = null) {
    const sourcePrefix = source ? `[${source}] ` : "";
    const errorInfo = {
      code: error.code,
      message: error.message,
      details: error.details,
      originalError: error.originalError
    };
    switch (error.severity) {
      case ERROR_SEVERITY.INFO:
        console.log(`${sourcePrefix}Info:`, errorInfo);
        break;
      case ERROR_SEVERITY.WARNING:
        console.warn(`${sourcePrefix}Warning:`, errorInfo);
        break;
      case ERROR_SEVERITY.CRITICAL:
        console.error(`${sourcePrefix}CRITICAL ERROR:`, errorInfo);
        break;
      case ERROR_SEVERITY.ERROR:
      default:
        console.error(`${sourcePrefix}Error:`, errorInfo);
        break;
    }
  }
  function notifyUser(error, persistent = false) {
    const messageKey = ERROR_MESSAGE_KEYS[error.code] || "errorUnknown";
    const substitutions = error.details?.userMessage || error.message;
    publish(EVENTS.STATUS_UPDATED, {
      messageKey,
      substitutions,
      persistent
    });
  }
  async function tryCatch(fn, options = {}) {
    const {
      errorCode = ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL,
      showNotification = true,
      persistent = false,
      source = null
    } = options;
    try {
      return await fn();
    } catch (error) {
      const appError = createError(errorCode, null, error, null, ERROR_SEVERITY.ERROR);
      handleError(appError, showNotification, persistent, source);
      return null;
    }
  }
  function mapHttpStatusToErrorCode(statusCode) {
    if (statusCode >= 500) {
      return ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR;
    }
    switch (statusCode) {
      case 400:
        return ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST;
      case 401:
        return ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED;
      case 403:
        return ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED;
      case 404:
        return ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST;
      case 429:
        return ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT;
      default:
        return ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR;
    }
  }
  function mapSpeechErrorToErrorCode(speechErrorType) {
    switch (speechErrorType) {
      case "no-speech":
        return ERROR_CODE[ERROR_CATEGORY.SPEECH].NO_SPEECH;
      case "audio-capture":
        return ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_UNAVAILABLE;
      case "not-allowed":
        return ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_DENIED;
      case "aborted":
        return ERROR_CODE[ERROR_CATEGORY.SPEECH].ABORTED;
      case "network":
        return ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      case "service-not-allowed":
        return ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED;
      default:
        return ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED;
    }
  }

  // src/modules/settings.js
  function setupEventSubscriptions2() {
    subscribe(EVENTS.SETTINGS_SAVED, () => {
      console.log("Settings save button clicked");
      const apiKeyInput = document.getElementById("api-key-input");
      const langSelect = document.getElementById("recognition-lang-select");
      const autoDetectCheckbox = document.getElementById("auto-detect-input-fields-checkbox");
      const autoCorrectionCheckbox = document.getElementById("auto-correction-checkbox");
      const useHistoryContextCheckbox = document.getElementById("use-history-context-checkbox");
      const themeSelect = document.getElementById("theme-select");
      const showModalWindowCheckbox = document.getElementById("show-modal-window-checkbox");
      const autoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
      const silenceTimeoutInput = document.getElementById("silence-timeout-input");
      const autoCorrectionPromptTextarea = document.getElementById("auto-correction-prompt-textarea");
      const proofreadingPromptTextarea = document.getElementById("proofreading-prompt-textarea");
      if (!apiKeyInput || !langSelect) {
        showStatus("statusSettingsSaveError");
        return;
      }
      const settings = {
        apiKey: apiKeyInput.value.trim(),
        recognitionLang: langSelect.value,
        autoDetectInputFields: autoDetectCheckbox ? autoDetectCheckbox.checked : getState("autoDetectInputFields"),
        autoCorrection: autoCorrectionCheckbox ? autoCorrectionCheckbox.checked : getState("autoCorrection"),
        useHistoryContext: useHistoryContextCheckbox ? useHistoryContextCheckbox.checked : getState("useHistoryContext"),
        showModalWindow: showModalWindowCheckbox ? showModalWindowCheckbox.checked : getState("showModalWindow"),
        // 自動送信の状態をチェックボックスと一致させる（チェックがONの場合は自動送信をON、チェックがOFFの場合は自動送信をOFF）
        autoSubmit: autoSubmitCheckbox ? autoSubmitCheckbox.checked : getState("autoSubmit"),
        // clearExistingText: clearExistingTextCheckbox ? clearExistingTextCheckbox.checked : getState('clearExistingText'),
        themeMode: themeSelect ? themeSelect.value : getState("themeMode"),
        silenceTimeout: silenceTimeoutInput ? parseInt(silenceTimeoutInput.value, 10) || DEFAULT_SETTINGS.SILENCE_TIMEOUT : getState("silenceTimeout") || DEFAULT_SETTINGS.SILENCE_TIMEOUT,
        autoCorrectionPrompt: autoCorrectionPromptTextarea ? autoCorrectionPromptTextarea.value : getState("autoCorrectionPrompt"),
        proofreadingPrompt: proofreadingPromptTextarea ? proofreadingPromptTextarea.value : getState("proofreadingPrompt")
      };
      chrome.storage.sync.set({
        [API_KEY_STORAGE_KEY]: settings.apiKey,
        [RECOGNITION_LANG_STORAGE_KEY]: settings.recognitionLang,
        [AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY]: settings.autoDetectInputFields,
        [AUTO_CORRECTION_STORAGE_KEY]: settings.autoCorrection,
        [USE_HISTORY_CONTEXT_STORAGE_KEY]: settings.useHistoryContext,
        [SHOW_MODAL_WINDOW_STORAGE_KEY]: settings.showModalWindow,
        [AUTO_SUBMIT_STORAGE_KEY]: settings.autoSubmit,
        // [CLEAR_EXISTING_TEXT_STORAGE_KEY]: settings.clearExistingText,
        [THEME_STORAGE_KEY]: settings.themeMode,
        [SILENCE_TIMEOUT_STORAGE_KEY]: settings.silenceTimeout,
        [AUTO_CORRECTION_PROMPT_STORAGE_KEY]: settings.autoCorrectionPrompt,
        [PROOFREADING_PROMPT_STORAGE_KEY]: settings.proofreadingPrompt
      }, () => {
        showStatus("statusSettingsSaveSuccess");
        const modal = document.querySelector(".otak-voice-settings");
        if (modal) {
          modal.style.display = "none";
        }
        setState(settings);
        if (settings.themeMode) {
          applyTheme(settings.themeMode);
        }
        const modalToggleButton = document.querySelector(".otak-voice-menu__modal-toggle-btn");
        if (modalToggleButton) {
          if (settings.showModalWindow) {
            modalToggleButton.classList.remove("otak-voice-menu__modal-toggle-btn--active");
          } else {
            modalToggleButton.classList.add("otak-voice-menu__modal-toggle-btn--active");
          }
        }
        const autoSubmitButton = document.querySelector(".otak-voice-menu__append-btn");
        if (autoSubmitButton) {
          setState("autoSubmit", settings.autoSubmit);
          publish(EVENTS.AUTO_SUBMIT_STATE_CHANGED, settings.autoSubmit);
        }
      });
    });
    subscribe(EVENTS.SETTINGS_MODAL_TOGGLED, () => {
      console.log("Settings modal toggled");
    });
  }
  var SETTINGS_SCHEMA = {
    apiKey: {
      key: API_KEY_STORAGE_KEY,
      type: "string",
      default: "",
      validate: (value) => value === "" || value.startsWith("sk-"),
      errorMessage: "alertApiKeyInvalid"
    },
    recognitionLang: {
      key: RECOGNITION_LANG_STORAGE_KEY,
      type: "string",
      default: DEFAULT_SETTINGS.RECOGNITION_LANG,
      validate: (value) => typeof value === "string" && value.length > 0,
      errorMessage: "errorInvalidLanguage"
    },
    autoDetectInputFields: {
      key: AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY,
      type: "boolean",
      default: DEFAULT_SETTINGS.AUTO_DETECT_INPUT_FIELDS,
      validate: (value) => typeof value === "boolean",
      errorMessage: "errorInvalidBooleanSetting"
    },
    autoCorrection: {
      key: AUTO_CORRECTION_STORAGE_KEY,
      type: "boolean",
      default: DEFAULT_SETTINGS.AUTO_CORRECTION,
      validate: (value) => typeof value === "boolean",
      errorMessage: "errorInvalidBooleanSetting"
    },
    useHistoryContext: {
      key: USE_HISTORY_CONTEXT_STORAGE_KEY,
      type: "boolean",
      default: DEFAULT_SETTINGS.USE_HISTORY_CONTEXT,
      validate: (value) => typeof value === "boolean",
      errorMessage: "errorInvalidBooleanSetting"
    },
    themeMode: {
      key: THEME_STORAGE_KEY,
      type: "string",
      default: DEFAULT_SETTINGS.THEME,
      validate: (value) => value === THEME_MODES.DARK || value === THEME_MODES.LIGHT,
      errorMessage: "errorInvalidTheme"
    },
    showModalWindow: {
      key: SHOW_MODAL_WINDOW_STORAGE_KEY,
      type: "boolean",
      default: DEFAULT_SETTINGS.SHOW_MODAL_WINDOW,
      validate: (value) => typeof value === "boolean",
      errorMessage: "errorInvalidBooleanSetting"
    },
    autoSubmit: {
      key: AUTO_SUBMIT_STORAGE_KEY,
      type: "boolean",
      default: DEFAULT_SETTINGS.AUTO_SUBMIT,
      validate: (value) => typeof value === "boolean",
      errorMessage: "errorInvalidBooleanSetting"
    },
    silenceTimeout: {
      key: SILENCE_TIMEOUT_STORAGE_KEY,
      type: "number",
      default: DEFAULT_SETTINGS.SILENCE_TIMEOUT,
      validate: (value) => typeof value === "number" && value >= 500 && value <= 1e4,
      errorMessage: "errorInvalidSilenceTimeout"
    },
    autoCorrectionPrompt: {
      key: AUTO_CORRECTION_PROMPT_STORAGE_KEY,
      type: "string",
      default: DEFAULT_SETTINGS.AUTO_CORRECTION_PROMPT,
      validate: (value) => typeof value === "string" && value.length > 0,
      errorMessage: "errorInvalidPrompt"
    },
    proofreadingPrompt: {
      key: PROOFREADING_PROMPT_STORAGE_KEY,
      type: "string",
      default: DEFAULT_SETTINGS.PROOFREADING_PROMPT,
      validate: (value) => typeof value === "string" && value.length > 0,
      errorMessage: "errorInvalidPrompt"
    }
  };
  function getAllStorageKeys() {
    return Object.values(SETTINGS_SCHEMA).map((setting) => setting.key);
  }
  function validateSetting(settingName, value) {
    const schema = SETTINGS_SCHEMA[settingName];
    if (!schema) {
      return false;
    }
    return schema.validate(value);
  }
  async function loadSettings() {
    return tryCatch(
      async () => {
        const storageKeys = getAllStorageKeys();
        const result = await chrome.storage.sync.get(storageKeys);
        const settings = {};
        Object.entries(SETTINGS_SCHEMA).forEach(([settingName, schema]) => {
          const storageValue = result[schema.key];
          settings[settingName] = storageValue !== void 0 ? storageValue : schema.default;
        });
        if (settings.silenceTimeout === void 0) {
          settings.silenceTimeout = DEFAULT_SETTINGS.SILENCE_TIMEOUT;
        }
        setState(settings);
        console.log(chrome.i18n.getMessage("logSettingsLoaded"), {
          apiKey: settings.apiKey ? chrome.i18n.getMessage("logApiKeySet") : chrome.i18n.getMessage("logApiKeyNotSet"),
          language: settings.recognitionLang,
          autoDetect: settings.autoDetectInputFields ? "On" : "Off",
          autoCorrection: settings.autoCorrection ? "On" : "Off",
          useHistoryContext: settings.useHistoryContext ? "On" : "Off",
          showModalWindow: settings.showModalWindow ? "On" : "Off",
          theme: settings.themeMode
        });
        if (typeof window !== "undefined") {
          applyTheme(settings.themeMode);
          publish(EVENTS.SPEECH_RECOGNITION_STOPPED);
        }
        publish(EVENTS.SETTINGS_LOADED, settings);
        return settings;
      },
      {
        errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
        showNotification: true,
        source: "settings"
      }
    );
  }
  async function saveSetting(settingName, value) {
    return tryCatch(
      async () => {
        if (!SETTINGS_SCHEMA[settingName]) {
          throw createError(
            ERROR_CODE[ERROR_CATEGORY.INPUT].INVALID_API_KEY_FORMAT,
            `Invalid setting name: ${settingName}`,
            null,
            { settingName },
            ERROR_SEVERITY.ERROR
          );
        }
        if (!validateSetting(settingName, value)) {
          throw createError(
            ERROR_CODE[ERROR_CATEGORY.INPUT].INVALID_API_KEY_FORMAT,
            chrome.i18n.getMessage(SETTINGS_SCHEMA[settingName].errorMessage),
            null,
            { settingName, value },
            ERROR_SEVERITY.ERROR
          );
        }
        const storageKey = SETTINGS_SCHEMA[settingName].key;
        await chrome.storage.sync.set({ [storageKey]: value });
        setState(settingName, value);
        if (settingName === "themeMode") {
          applyTheme(value);
        } else if (settingName === "recognitionLang") {
          publish(EVENTS.LANGUAGE_UPDATED, value);
        }
        console.log(chrome.i18n.getMessage("logSettingSaved"), { [settingName]: value });
        return true;
      },
      {
        errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
        showNotification: true,
        source: "settings"
      }
    );
  }
  async function toggleTheme() {
    return tryCatch(
      async () => {
        const currentTheme = getState("themeMode");
        const newTheme = currentTheme === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;
        await saveSetting("themeMode", newTheme);
        showStatus(newTheme === THEME_MODES.DARK ? "statusThemeDark" : "statusThemeLight");
        return true;
      },
      {
        errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
        showNotification: true,
        source: "settings"
      }
    );
  }
  function applyTheme(theme, skipDomOperations = false) {
    if (theme !== THEME_MODES.DARK && theme !== THEME_MODES.LIGHT) {
      console.warn(`Invalid theme: ${theme}, using default`);
      theme = DEFAULT_SETTINGS.THEME;
    }
    if (skipDomOperations || typeof document === "undefined") {
      return theme;
    }
    try {
      if (document.documentElement) {
        document.documentElement.setAttribute("data-otak-theme", theme);
      }
      const themeSelect = document.getElementById("theme-select");
      if (themeSelect) {
        themeSelect.value = theme;
      }
      const themeToggleBtn = document.querySelector(".otak-voice-menu__theme-toggle-btn");
      if (themeToggleBtn) {
        if (theme === THEME_MODES.LIGHT) {
          themeToggleBtn.classList.add("otak-voice-menu__theme-toggle-btn--active");
          themeToggleBtn.title = chrome.i18n.getMessage("themeToggleToDark");
        } else {
          themeToggleBtn.classList.remove("otak-voice-menu__theme-toggle-btn--active");
          themeToggleBtn.title = chrome.i18n.getMessage("themeToggleToLight");
        }
      }
      const recognitionModal = document.querySelector(".otak-voice-recognition");
      if (recognitionModal) {
        recognitionModal.setAttribute("data-theme", theme);
      }
    } catch (error) {
      console.error("Error applying theme:", error);
    }
    return theme;
  }
  function showStatus(messageKey, substitutions, persistent = false) {
    publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
  }
  setupEventSubscriptions2();

  // src/icons.js
  var MENU_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
  <rect x="2" y="4" width="16" height="2"></rect>
  <rect x="2" y="9" width="16" height="2"></rect>
  <rect x="2" y="14" width="16" height="2"></rect>
</svg>
`;
  var MIC_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" />
  <path d="M5 10a5 5 0 0 0 10 0" />
  <line x1="10" y1="15" x2="10" y2="18" />
</svg>
`;
  var CLEAR_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <line x1="15" y1="5" x2="5" y2="15" />
  <line x1="5" y1="5" x2="15" y2="15" />
</svg>
`;
  var PROOFREAD_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <polyline points="16 6 8 14 4 10" />
</svg>
`;
  var EDIT_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M14 3l3 3L7 16H4v-3L14 3z" />
</svg>
`;
  var SETTINGS_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="4" y="4" width="12" height="12" rx="2" />
  <line x1="4" y1="8" x2="16" y2="8" />
  <line x1="7" y1="12" x2="13" y2="12" />
  <circle cx="10" cy="12" r="1" />
</svg>
`;
  var HISTORY_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <circle cx="10" cy="10" r="7" />
  <polyline points="10 5 10 10 13 12" />
</svg>
`;
  var LOADING_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M5 3h10v3L10 10l-5-4V3z" />
  <path d="M5 17h10v-3L10 10l-5 4v3z" />
</svg>
`;
  var MODAL_TOGGLE_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="5" width="14" height="10" rx="1" />
  <line x1="3" y1="8" x2="17" y2="8" />
  <circle cx="5" cy="6.5" r="0.5" fill="currentColor" />
</svg>
`;
  var THEME_TOGGLE_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <circle cx="10" cy="10" r="4" />
  <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
</svg>
`;
  var AUTO_SUBMIT_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
  <path d="M10 17V7" />
  <path d="M6 11l4-4 4 4" />
</svg>
`;

  // src/modules/ui.js
  function showStatus2(messageKey, substitutions, persistent = false) {
    const statusElem = document.querySelector(".otak-voice-status");
    if (!statusElem) return;
    const msg = chrome.i18n.getMessage(messageKey, substitutions);
    statusElem.textContent = msg;
    statusElem.style.display = "block";
    const processingState = getState("processingState");
    if (processingState !== PROCESSING_STATE.IDLE) {
      statusElem.classList.add("otak-voice-status--processing");
    } else {
      statusElem.classList.remove("otak-voice-status--processing");
    }
    const isErrorMessage = messageKey.startsWith("status") && (messageKey.includes("Error") || messageKey.includes("Empty") || messageKey.includes("NotFound") || messageKey === "statusProcessingInProgress" || messageKey === "statusAutoDetectOff");
    if (!persistent || isErrorMessage) {
      const timeout = isErrorMessage ? 3e3 : 5e3;
      setTimeout(() => {
        if (!statusElem) return;
        if (isErrorMessage) {
          statusElem.style.display = "none";
          statusElem.classList.remove("otak-voice-status--processing");
          return;
        }
        const currentProcessingState = getState("processingState");
        if (currentProcessingState === PROCESSING_STATE.IDLE) {
          statusElem.style.display = "none";
          statusElem.classList.remove("otak-voice-status--processing");
        }
      }, timeout);
    }
  }
  function createUI() {
    removeExistingElements();
    const menuButton = document.createElement("div");
    menuButton.className = "otak-voice-menu__btn";
    menuButton.id = "otak-voice-menu-btn";
    menuButton.innerHTML = MENU_ICON;
    document.body.appendChild(menuButton);
    const menuContainer = document.createElement("div");
    menuContainer.className = "otak-voice-menu__container";
    menuContainer.id = "otak-voice-menu-container";
    document.body.appendChild(menuContainer);
    const themeToggleButton = createMenuItem("theme-toggle-btn", THEME_TOGGLE_ICON, chrome.i18n.getMessage("themeToggleTooltip") || "\u30C6\u30FC\u30DE\u5207\u308A\u66FF\u3048");
    const themeMode = getState("themeMode");
    menuContainer.appendChild(themeToggleButton);
    const modalToggleButton = createMenuItem("modal-toggle-btn", MODAL_TOGGLE_ICON, chrome.i18n.getMessage("modalToggleTooltip"));
    const showModalWindow = getState("showModalWindow");
    if (!showModalWindow) {
      modalToggleButton.classList.add("otak-voice-menu__modal-toggle-btn--active");
    }
    menuContainer.appendChild(modalToggleButton);
    const micButton = createMenuItem("input-btn", MIC_ICON, chrome.i18n.getMessage("micTooltip"));
    menuContainer.appendChild(micButton);
    const autoSubmitButton = createMenuItem("append-btn", AUTO_SUBMIT_ICON, chrome.i18n.getMessage("autoSubmitTooltip"));
    menuContainer.appendChild(autoSubmitButton);
    const autoSubmit = getState("autoSubmit");
    if (autoSubmit !== void 0) {
      updateAutoSubmitButtonState(autoSubmit);
    }
    const clearButton = createMenuItem("clear-btn", CLEAR_ICON, chrome.i18n.getMessage("clearTooltip"));
    menuContainer.appendChild(clearButton);
    const proofreadButton = createMenuItem("proofread-btn", PROOFREAD_ICON, chrome.i18n.getMessage("proofreadTooltip"));
    menuContainer.appendChild(proofreadButton);
    const editButton = createMenuItem("edit-btn", EDIT_ICON, chrome.i18n.getMessage("editTooltip"));
    menuContainer.appendChild(editButton);
    const settingsButton = createMenuItem("settings-btn", SETTINGS_ICON, chrome.i18n.getMessage("settingsTooltip"));
    menuContainer.appendChild(settingsButton);
    const historyButton = createMenuItem("history-btn", HISTORY_ICON, chrome.i18n.getMessage("historyTooltip"));
    menuContainer.appendChild(historyButton);
    const statusDisplay = document.createElement("div");
    statusDisplay.className = "otak-voice-status";
    document.body.appendChild(statusDisplay);
    createSettingsModal();
    createHistoryPanel();
    const modalToggleBtn = document.querySelector(".otak-voice-menu__modal-toggle-btn");
    if (modalToggleBtn) {
      modalToggleBtn.addEventListener("click", toggleModalVisibility);
    }
    function updateEditProofreadButtonsState2() {
      const proofreadButton2 = document.querySelector(".otak-voice-menu__proofread-btn");
      const editButton2 = document.querySelector(".otak-voice-menu__edit-btn");
      if (!proofreadButton2 || !editButton2) return;
      const currentInputElement = getState("currentInputElement");
      if (!currentInputElement || currentInputElement.value === "" && !currentInputElement.textContent || currentInputElement.value && currentInputElement.value.trim() === "" || currentInputElement.textContent && currentInputElement.textContent.trim() === "") {
        proofreadButton2.classList.add("otak-voice-menu__item--disabled");
        editButton2.classList.add("otak-voice-menu__item--disabled");
      } else {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE) {
          proofreadButton2.classList.remove("otak-voice-menu__item--disabled");
          editButton2.classList.remove("otak-voice-menu__item--disabled");
        }
      }
    }
    const themeToggleBtn = document.querySelector(".otak-voice-menu__theme-toggle-btn");
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", toggleTheme);
    }
    updateEditProofreadButtonsState2();
  }
  function updateEditProofreadButtonsState() {
    const proofreadButton = document.querySelector(".otak-voice-menu__proofread-btn");
    const editButton = document.querySelector(".otak-voice-menu__edit-btn");
    if (!proofreadButton || !editButton) return;
    const currentInputElement = getState("currentInputElement");
    if (!currentInputElement || currentInputElement.value === "" && !currentInputElement.textContent || currentInputElement.value && currentInputElement.value.trim() === "" || currentInputElement.textContent && currentInputElement.textContent.trim() === "") {
      proofreadButton.classList.add("otak-voice-menu__item--disabled");
      editButton.classList.add("otak-voice-menu__item--disabled");
    } else {
      const processingState = getState("processingState");
      if (processingState === PROCESSING_STATE.IDLE) {
        proofreadButton.classList.remove("otak-voice-menu__item--disabled");
        editButton.classList.remove("otak-voice-menu__item--disabled");
      }
    }
  }
  function setupEventSubscriptions3() {
    subscribe(EVENTS.STATUS_UPDATED, (data) => {
      showStatus2(data.messageKey, data.substitutions, data.persistent);
    });
    subscribe(EVENTS.RECOGNITION_MODAL_SHOWN, (data) => {
      showRecognitionTextModal(data.text, data.isInitial);
    });
    subscribe(EVENTS.RECOGNITION_MODAL_UPDATED, (text) => {
      updateRecognitionModal(text);
    });
    subscribe(EVENTS.PROCESSING_STATE_CHANGED, (state) => {
      updateProcessingState(state);
      updateEditProofreadButtonsState();
    });
    subscribe(EVENTS.AUTO_SUBMIT_STATE_CHANGED, (autoSubmit) => {
      const modal = document.getElementById("otak-voice-settings-modal");
      if (modal && modal.style.display === "block") {
        const autoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
        if (autoSubmitCheckbox) {
          autoSubmitCheckbox.checked = autoSubmit;
        }
      }
    });
    subscribe(EVENTS.MODAL_VISIBILITY_TOGGLED, (showModalWindow) => {
      const modal = document.getElementById("otak-voice-settings-modal");
      if (modal && modal.style.display === "block") {
        const showModalWindowCheckbox = document.getElementById("show-modal-window-checkbox");
        if (showModalWindowCheckbox) {
          showModalWindowCheckbox.checked = showModalWindow;
        }
      }
    });
    subscribe(EVENTS.SETTINGS_LOADED, (settings) => {
      const apiKeyInput = document.getElementById("api-key-input");
      if (apiKeyInput) {
        apiKeyInput.value = settings.apiKey || "";
      }
      const langSelect = document.getElementById("recognition-lang-select");
      if (langSelect) {
        langSelect.value = settings.recognitionLang;
      }
      const themeSelect = document.getElementById("theme-select");
      if (themeSelect) {
        themeSelect.value = settings.themeMode;
      }
      const autoDetectCheckbox = document.getElementById("auto-detect-input-fields-checkbox");
      if (autoDetectCheckbox) {
        autoDetectCheckbox.checked = settings.autoDetectInputFields;
      }
      const autoCorrectionCheckbox = document.getElementById("auto-correction-checkbox");
      if (autoCorrectionCheckbox) {
        autoCorrectionCheckbox.checked = settings.autoCorrection;
      }
      const useHistoryContextCheckbox = document.getElementById("use-history-context-checkbox");
      if (useHistoryContextCheckbox) {
        useHistoryContextCheckbox.checked = settings.useHistoryContext;
      }
      const showModalWindowCheckbox = document.getElementById("show-modal-window-checkbox");
      if (showModalWindowCheckbox) {
        showModalWindowCheckbox.checked = settings.showModalWindow;
      }
      const autoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
      if (autoSubmitCheckbox) {
        const currentAutoSubmit = getState("autoSubmit");
        autoSubmitCheckbox.checked = currentAutoSubmit;
      }
      const autoCorrectionPromptTextarea = document.getElementById("auto-correction-prompt-textarea");
      if (autoCorrectionPromptTextarea) {
        autoCorrectionPromptTextarea.value = settings.autoCorrectionPrompt;
      }
      const proofreadingPromptTextarea = document.getElementById("proofreading-prompt-textarea");
      if (proofreadingPromptTextarea) {
        proofreadingPromptTextarea.value = settings.proofreadingPrompt;
      }
      const modalToggleButton = document.querySelector(".otak-voice-menu__modal-toggle-btn");
      if (modalToggleButton) {
        if (settings.showModalWindow) {
          modalToggleButton.classList.remove("otak-voice-menu__modal-toggle-btn--active");
        } else {
          modalToggleButton.classList.add("otak-voice-menu__modal-toggle-btn--active");
        }
      }
      const autoSubmitButton = document.querySelector(".otak-voice-menu__append-btn");
      if (autoSubmitButton && settings.autoSubmit !== void 0) {
        if (typeof updateAutoSubmitButtonState === "function") {
          updateAutoSubmitButtonState(settings.autoSubmit);
        }
      }
    });
    subscribe(EVENTS.INPUT_FIELD_CLICKED, () => {
      updateEditProofreadButtonsState();
    });
    subscribe(EVENTS.INPUT_FIELD_FOUND, () => {
      updateEditProofreadButtonsState();
    });
    subscribe(EVENTS.SPEECH_RECOGNITION_RESULT, () => {
      updateEditProofreadButtonsState();
    });
  }
  function updateSettingsModalValues() {
    const apiKeyInput = document.getElementById("api-key-input");
    const langSelect = document.getElementById("recognition-lang-select");
    const autoDetectCheckbox = document.getElementById("auto-detect-input-fields-checkbox");
    const themeSelect = document.getElementById("theme-select");
    const showModalWindowCheckbox = document.getElementById("show-modal-window-checkbox");
    const autoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
    const silenceTimeoutInput = document.getElementById("silence-timeout-input");
    const apiKey = getState("apiKey");
    const recognitionLang = getState("recognitionLang");
    const autoDetectInputFields = getState("autoDetectInputFields");
    const autoCorrection = getState("autoCorrection");
    const useHistoryContext = getState("useHistoryContext");
    const themeMode = getState("themeMode");
    const showModalWindow = getState("showModalWindow");
    const autoSubmit = getState("autoSubmit");
    const silenceTimeout = getState("silenceTimeout") || 3e3;
    if (apiKeyInput) apiKeyInput.value = apiKey || "";
    if (langSelect) langSelect.value = recognitionLang || "ja-JP";
    if (autoDetectCheckbox) {
      autoDetectCheckbox.checked = autoDetectInputFields === true;
      if (typeof updateAutoDetectTooltip2 === "function") {
        updateAutoDetectTooltip2();
      }
    }
    const autoCorrectionCheckbox = document.getElementById("auto-correction-checkbox");
    if (autoCorrectionCheckbox) {
      autoCorrectionCheckbox.checked = autoCorrection === true;
      if (typeof updateAutoCorrectionTooltip2 === "function") {
        updateAutoCorrectionTooltip2();
      }
    }
    const useHistoryContextCheckbox = document.getElementById("use-history-context-checkbox");
    if (useHistoryContextCheckbox) {
      useHistoryContextCheckbox.checked = useHistoryContext === true;
      if (typeof updateUseHistoryContextTooltip2 === "function") {
        updateUseHistoryContextTooltip2();
      }
    }
    if (showModalWindowCheckbox) {
      showModalWindowCheckbox.checked = showModalWindow === true;
    }
    if (autoSubmitCheckbox) {
      autoSubmitCheckbox.checked = autoSubmit;
    }
    if (themeSelect) {
      themeSelect.value = themeMode || THEME_MODES.DARK;
    }
    if (silenceTimeoutInput) {
      silenceTimeoutInput.value = silenceTimeout;
    }
  }
  function toggleModalVisibility() {
    const currentShowModalWindow = getState("showModalWindow");
    const newShowModalWindow = !currentShowModalWindow;
    saveSetting("showModalWindow", newShowModalWindow);
    const modalToggleButton = document.querySelector(".otak-voice-menu__modal-toggle-btn");
    if (modalToggleButton) {
      if (newShowModalWindow) {
        modalToggleButton.classList.remove("otak-voice-menu__modal-toggle-btn--active");
      } else {
        modalToggleButton.classList.add("otak-voice-menu__modal-toggle-btn--active");
      }
    }
    const showModalWindowCheckbox = document.getElementById("show-modal-window-checkbox");
    if (showModalWindowCheckbox) {
      showModalWindowCheckbox.checked = newShowModalWindow;
    }
    const settingsModal = document.getElementById("otak-voice-settings-modal");
    if (settingsModal && settingsModal.style.display === "block") {
      updateSettingsModalValues();
    }
    const existingModal = document.querySelector(".otak-voice-recognition");
    if (existingModal && !newShowModalWindow) {
      existingModal.remove();
    }
    publish(EVENTS.MODAL_VISIBILITY_TOGGLED, newShowModalWindow);
    showStatus2(newShowModalWindow ? "statusModalVisible" : "statusModalHidden");
  }
  function createMenuItem(id, iconSvg, tooltip) {
    const item = document.createElement("div");
    item.className = `otak-voice-menu__${id} otak-voice-menu__item`;
    const iconContainer = document.createElement("div");
    iconContainer.className = "otak-voice-menu__icon-container";
    iconContainer.innerHTML = iconSvg;
    item.appendChild(iconContainer);
    const label = document.createElement("div");
    label.className = "otak-voice-menu__label";
    label.textContent = tooltip;
    item.appendChild(label);
    return item;
  }
  function removeExistingElements() {
    const elementSelectors = [
      ".otak-voice-menu__btn",
      ".otak-voice-menu__container",
      ".otak-voice-menu__input-btn",
      ".otak-voice-menu__append-btn",
      ".otak-voice-menu__proofread-btn",
      ".otak-voice-menu__edit-btn",
      ".otak-voice-menu__settings-btn",
      ".otak-voice-menu__history-btn",
      ".otak-voice-menu__clear-btn",
      ".otak-voice-status",
      ".otak-voice-settings",
      ".otak-voice-history",
      ".otak-voice-menu__modal-toggle-btn",
      ".otak-voice-menu__theme-toggle-btn"
    ];
    elementSelectors.forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) element.remove();
    });
  }
  function createSettingsModal() {
    const modal = document.createElement("div");
    modal.className = "otak-voice-settings";
    modal.id = "otak-voice-settings-modal";
    const langOptions = [
      { value: "ja-JP", textKey: "modalSettingsLangJa" },
      { value: "en-US", textKey: "modalSettingsLangEn" },
      { value: "vi-VN", textKey: "modalSettingsLangVi" }
    ];
    const langSelectOptionsHTML = langOptions.map(
      (lang) => `<option value="${lang.value}">${chrome.i18n.getMessage(lang.textKey)}</option>`
    ).join("");
    const themeOptions = [
      { value: THEME_MODES.DARK, textKey: "modalSettingsThemeDark" },
      { value: THEME_MODES.LIGHT, textKey: "modalSettingsThemeLight" }
    ];
    const themeSelectOptionsHTML = themeOptions.map(
      (theme) => `<option value="${theme.value}">${chrome.i18n.getMessage(theme.textKey)}</option>`
    ).join("");
    modal.innerHTML = `
        <h3>${chrome.i18n.getMessage("modalSettingsTitle")}</h3>
        <p>${chrome.i18n.getMessage("modalSettingsDescription")}</p>
        
        <div class="otak-voice-settings__grid">
            <!-- API\u8A2D\u5B9A\u30D6\u30ED\u30C3\u30AF -->
            <div class="otak-voice-settings__block">
                <h4>API\u8A2D\u5B9A</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="api-key-input">OpenAI API Key</label>
                    <input type="text" id="api-key-input" placeholder="${chrome.i18n.getMessage("modalSettingsInputPlaceholder")}">
                    <div class="otak-voice-settings__help-text">
                        OpenAI\u306EAPI\u306B\u306E\u307F\u4F7F\u7528\u3055\u308C\u307E\u3059\u3002<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">API\u30AD\u30FC\u306E\u53D6\u5F97\u30FB\u7BA1\u7406\u306F\u3053\u3061\u3089</a>
                    </div>
                </div>
            </div>

            <!-- \u8A00\u8A9E\u30FB\u30C6\u30FC\u30DE\u8A2D\u5B9A\u30D6\u30ED\u30C3\u30AF -->
            <div class="otak-voice-settings__block">
                <h4>\u8868\u793A\u8A2D\u5B9A</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="recognition-lang-select">${chrome.i18n.getMessage("modalSettingsLangLabel")}</label>
                    <select id="recognition-lang-select">
                        ${langSelectOptionsHTML}
                    </select>

                    <label for="theme-select">${chrome.i18n.getMessage("modalSettingsThemeLabel")}</label>
                    <select id="theme-select">
                        ${themeSelectOptionsHTML}
                    </select>
                </div>
            </div>

            <!-- \u6A5F\u80FD\u8A2D\u5B9A\u30D6\u30ED\u30C3\u30AF -->
            <div class="otak-voice-settings__block">
                <h4>\u6A5F\u80FD\u8A2D\u5B9A</h4>
                <div class="otak-voice-settings__block-content">
                    <div class="otak-voice-settings__item">
                        <label for="auto-detect-input-fields-checkbox">${chrome.i18n.getMessage("settingAutoDetectInputFieldsLabel")}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="auto-detect-input-fields-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="auto-correction-checkbox">${chrome.i18n.getMessage("settingAutoCorrectionLabel")}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="auto-correction-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="use-history-context-checkbox">${chrome.i18n.getMessage("settingUseHistoryContextLabel")}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="use-history-context-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="show-modal-window-checkbox">\u30E2\u30FC\u30C0\u30EB\u30A6\u30A3\u30F3\u30C9\u30A6\u8868\u793A</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="show-modal-window-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="auto-submit-checkbox">\u81EA\u52D5\u9001\u4FE1</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="auto-submit-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>
                    
                    <div class="otak-voice-settings__item">
                        <label for="silence-timeout-input">\u7121\u97F3\u691C\u51FA\u6642\u9593 (\u30DF\u30EA\u79D2)</label>
                        <input type="number" id="silence-timeout-input" min="500" max="10000" step="500" value="3000" class="otak-voice-settings__number-input">
                    </div>

                </div>
            </div>

            <!-- \u30D7\u30ED\u30F3\u30D7\u30C8\u8A2D\u5B9A\u30D6\u30ED\u30C3\u30AF -->
            <div class="otak-voice-settings__block">
                <h4>\u30D7\u30ED\u30F3\u30D7\u30C8\u8A2D\u5B9A</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="auto-correction-prompt-textarea">${chrome.i18n.getMessage("autoCorrectionPromptLabel")}</label>
                    <textarea id="auto-correction-prompt-textarea" rows="4" placeholder="${chrome.i18n.getMessage("promptPlaceholder")}"></textarea>

                    <label for="proofreading-prompt-textarea">${chrome.i18n.getMessage("proofreadingPromptLabel")}</label>
                    <textarea id="proofreading-prompt-textarea" rows="4" placeholder="${chrome.i18n.getMessage("promptPlaceholder")}"></textarea>
                </div>
            </div>
        </div>

        <div class="button-row">
            <a id="otak-voice-version-link" href="https://github.com/tsuyoshi-otake/otak-voice" target="_blank">Version: 3.1</a>
            <div class="button-group">
                <button class="otak-voice-settings__cancel-btn">${chrome.i18n.getMessage("modalSettingsButtonCancel")}</button>
                <button class="otak-voice-settings__save-btn">${chrome.i18n.getMessage("modalSettingsButtonSave")}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    makeDraggable(modal);
    const apiKeyInput = document.getElementById("api-key-input");
    if (apiKeyInput) {
      apiKeyInput.addEventListener("change", () => {
        saveSetting("apiKey", apiKeyInput.value.trim());
      });
    }
    const langSelect = document.getElementById("recognition-lang-select");
    if (langSelect) {
      langSelect.addEventListener("change", () => {
        saveSetting("recognitionLang", langSelect.value);
      });
    }
    const themeSelect = document.getElementById("theme-select");
    if (themeSelect) {
      themeSelect.addEventListener("change", () => {
        saveSetting("themeMode", themeSelect.value);
      });
    }
    const autoDetectCheckbox = document.getElementById("auto-detect-input-fields-checkbox");
    if (autoDetectCheckbox) {
      autoDetectCheckbox.addEventListener("change", () => {
        saveSetting("autoDetectInputFields", autoDetectCheckbox.checked);
      });
    }
    const autoCorrectionCheckbox = document.getElementById("auto-correction-checkbox");
    if (autoCorrectionCheckbox) {
      autoCorrectionCheckbox.addEventListener("change", () => {
        saveSetting("autoCorrection", autoCorrectionCheckbox.checked);
      });
    }
    const useHistoryContextCheckbox = document.getElementById("use-history-context-checkbox");
    if (useHistoryContextCheckbox) {
      useHistoryContextCheckbox.addEventListener("change", () => {
        saveSetting("useHistoryContext", useHistoryContextCheckbox.checked);
      });
    }
    const showModalWindowCheckbox = document.getElementById("show-modal-window-checkbox");
    const autoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
    const silenceTimeoutInput = document.getElementById("silence-timeout-input");
    if (silenceTimeoutInput) {
      silenceTimeoutInput.addEventListener("change", () => {
        const value = parseInt(silenceTimeoutInput.value, 10);
        const validValue = Math.min(Math.max(value, 500), 1e4);
        if (value !== validValue) {
          silenceTimeoutInput.value = validValue;
        }
        saveSetting("silenceTimeout", validValue);
      });
    }
    const autoCorrectionPromptTextarea = document.getElementById("auto-correction-prompt-textarea");
    if (autoCorrectionPromptTextarea) {
      autoCorrectionPromptTextarea.addEventListener("change", () => {
        saveSetting("autoCorrectionPrompt", autoCorrectionPromptTextarea.value);
      });
    }
    const proofreadingPromptTextarea = document.getElementById("proofreading-prompt-textarea");
    if (proofreadingPromptTextarea) {
      proofreadingPromptTextarea.addEventListener("change", () => {
        saveSetting("proofreadingPrompt", proofreadingPromptTextarea.value);
      });
    }
  }
  function makeDraggable(element) {
    const header = element.querySelector("h3");
    if (!header) return;
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    header.style.cursor = "move";
    header.onmousedown = (e) => {
      isDragging = true;
      offsetX = e.clientX - element.offsetLeft;
      offsetY = e.clientY - element.offsetTop;
      if (element.classList.contains("otak-voice-settings")) {
        element.classList.add("otak-voice-settings--dragging");
      } else if (element.classList.contains("otak-voice-recognition")) {
        element.classList.add("otak-voice-recognition--dragging");
      } else {
        element.classList.add("otak-voice-modal--dragging");
      }
    };
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      element.style.left = e.clientX - offsetX + "px";
      element.style.top = e.clientY - offsetY + "px";
      element.style.transform = "none";
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
      if (element.classList.contains("otak-voice-settings")) {
        element.classList.remove("otak-voice-settings--dragging");
      } else if (element.classList.contains("otak-voice-recognition")) {
        element.classList.remove("otak-voice-recognition--dragging");
      } else {
        element.classList.remove("otak-voice-modal--dragging");
      }
    });
  }
  function createHistoryPanel() {
    const panel = document.createElement("div");
    panel.className = "otak-voice-history";
    panel.innerHTML = `<div>${chrome.i18n.getMessage("historyPanelTitle")}</div>`;
    document.body.appendChild(panel);
    updateHistoryPanel();
  }
  function setupEventListeners() {
    const menuButton = document.querySelector(".otak-voice-menu__btn");
    if (menuButton) {
      menuButton.addEventListener("click", () => {
        publish(EVENTS.MENU_TOGGLED);
      });
    }
    const micButton = document.querySelector(".otak-voice-menu__input-btn");
    if (micButton) {
      micButton.addEventListener("click", () => {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE && !micButton.classList.contains("otak-voice-menu__item--disabled")) {
          publish(EVENTS.MIC_BUTTON_CLICKED);
        } else if (processingState !== PROCESSING_STATE.IDLE) {
          showStatus2("statusProcessingInProgress");
        }
      });
    }
    const autoSubmitButton = document.querySelector(".otak-voice-menu__append-btn");
    if (autoSubmitButton) {
      autoSubmitButton.addEventListener("click", () => {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE && !autoSubmitButton.classList.contains("otak-voice-menu__item--disabled")) {
          publish(EVENTS.AUTO_SUBMIT_TOGGLED, { fromMenuButton: true });
        } else if (processingState !== PROCESSING_STATE.IDLE) {
          showStatus2("statusProcessingInProgress");
        }
      });
    }
    const clearButton = document.querySelector(".otak-voice-menu__clear-btn");
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE && !clearButton.classList.contains("otak-voice-menu__item--disabled")) {
          publish(EVENTS.INPUT_CLEARED);
        } else if (processingState !== PROCESSING_STATE.IDLE) {
          showStatus2("statusProcessingInProgress");
        }
      });
    }
    const proofreadButton = document.querySelector(".otak-voice-menu__proofread-btn");
    if (proofreadButton) {
      proofreadButton.addEventListener("click", () => {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE && !proofreadButton.classList.contains("otak-voice-menu__item--disabled")) {
          publish(EVENTS.GPT_PROOFREADING_STARTED);
        } else if (processingState !== PROCESSING_STATE.IDLE) {
          showStatus2("statusProcessingInProgress");
        }
      });
    }
    const editButton = document.querySelector(".otak-voice-menu__edit-btn");
    if (editButton) {
      editButton.addEventListener("click", () => {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE && !editButton.classList.contains("otak-voice-menu__item--disabled")) {
          publish(EVENTS.GPT_EDITING_STARTED);
        } else if (processingState !== PROCESSING_STATE.IDLE) {
          showStatus2("statusProcessingInProgress");
        }
      });
    }
    const settingsButton = document.querySelector(".otak-voice-menu__settings-btn");
    if (settingsButton) {
      settingsButton.addEventListener("click", () => {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE && !settingsButton.classList.contains("otak-voice-menu__item--disabled")) {
          publish(EVENTS.SETTINGS_MODAL_TOGGLED);
        } else if (processingState !== PROCESSING_STATE.IDLE) {
          showStatus2("statusProcessingInProgress");
        }
      });
    }
    const historyButton = document.querySelector(".otak-voice-menu__history-btn");
    if (historyButton) {
      historyButton.addEventListener("click", () => {
        const processingState = getState("processingState");
        if (processingState === PROCESSING_STATE.IDLE && !historyButton.classList.contains("otak-voice-menu__item--disabled")) {
          publish(EVENTS.HISTORY_PANEL_TOGGLED);
        } else if (processingState !== PROCESSING_STATE.IDLE) {
          showStatus2("statusProcessingInProgress");
        }
      });
    }
    const saveButton = document.querySelector(".otak-voice-settings__save-btn");
    const cancelButton = document.querySelector(".otak-voice-settings__cancel-btn");
    if (saveButton) {
      saveButton.addEventListener("click", () => {
        publish(EVENTS.SETTINGS_SAVED);
      });
    }
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        publish(EVENTS.SETTINGS_MODAL_TOGGLED);
      });
    }
    const autoDetectCheckbox = document.getElementById("auto-detect-input-fields-checkbox");
    if (autoDetectCheckbox) {
      updateAutoDetectTooltip2();
      autoDetectCheckbox.addEventListener("change", updateAutoDetectTooltip2);
    }
    setupEventSubscriptions3();
    const autoCorrectionCheckbox = document.getElementById("auto-correction-checkbox");
    if (autoCorrectionCheckbox) {
      updateAutoCorrectionTooltip2();
      autoCorrectionCheckbox.addEventListener("change", updateAutoCorrectionTooltip2);
    }
    const useHistoryContextCheckbox = document.getElementById("use-history-context-checkbox");
    if (useHistoryContextCheckbox) {
      updateUseHistoryContextTooltip2();
      useHistoryContextCheckbox.addEventListener("change", updateUseHistoryContextTooltip2);
    }
    const showModalWindowCheckbox = document.getElementById("show-modal-window-checkbox");
    if (showModalWindowCheckbox) {
      showModalWindowCheckbox.checked = getState("showModalWindow");
    }
    document.addEventListener("focusin", (e) => {
      if (isInputElement(e.target) && getState("autoDetectInputFields") === false && !getState("isListening")) {
        publish(EVENTS.MIC_BUTTON_CLICKED);
      }
    });
  }
  var processingStateTimeoutId = null;
  function updateProcessingState(state) {
    setState("processingState", state);
    const proofreadButton = document.querySelector(".otak-voice-menu__proofread-btn");
    const editButton = document.querySelector(".otak-voice-menu__edit-btn");
    const micButton = document.querySelector(".otak-voice-menu__input-btn");
    const appendButton = document.querySelector(".otak-voice-menu__append-btn");
    const clearButton = document.querySelector(".otak-voice-menu__clear-btn");
    const settingsButton = document.querySelector(".otak-voice-menu__settings-btn");
    const historyButton = document.querySelector(".otak-voice-menu__history-btn");
    const isProcessing = state !== PROCESSING_STATE.IDLE;
    const themeToggleButton = document.querySelector(".otak-voice-menu__theme-toggle-btn");
    const modalToggleButton = document.querySelector(".otak-voice-menu__modal-toggle-btn");
    const allButtons = [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton];
    allButtons.forEach((button) => {
      if (button) {
        if (isProcessing) {
          button.classList.add("otak-voice-menu__item--disabled");
        } else {
          button.classList.remove("otak-voice-menu__item--disabled");
        }
      }
    });
    if (processingStateTimeoutId) {
      clearTimeout(processingStateTimeoutId);
      processingStateTimeoutId = null;
    }
    if (isProcessing) {
      processingStateTimeoutId = setTimeout(() => {
        console.log("\u51E6\u7406\u72B6\u614B\u304C30\u79D2\u9593\u5909\u66F4\u3055\u308C\u306A\u304B\u3063\u305F\u305F\u3081\u3001\u81EA\u52D5\u7684\u306B\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3059");
        updateProcessingState(PROCESSING_STATE.IDLE);
        const statusElem2 = document.querySelector(".otak-voice-status");
        if (statusElem2) {
          statusElem2.style.display = "none";
          statusElem2.classList.remove("otak-voice-status--processing");
        }
      }, 3e4);
    }
    if (proofreadButton) {
      if (state === PROCESSING_STATE.PROOFREADING) {
        proofreadButton.classList.add("otak-voice-menu__proofread-btn--processing");
        proofreadButton.classList.remove("otak-voice-menu__item--disabled");
        const iconContainer = proofreadButton.querySelector(".otak-voice-menu__icon-container");
        if (iconContainer) {
          iconContainer.innerHTML = LOADING_ICON;
        }
      } else {
        proofreadButton.classList.remove("otak-voice-menu__proofread-btn--processing");
        const iconContainer = proofreadButton.querySelector(".otak-voice-menu__icon-container");
        if (iconContainer) {
          iconContainer.innerHTML = PROOFREAD_ICON;
        }
      }
    }
    if (editButton) {
      if (state === PROCESSING_STATE.EDITING) {
        editButton.classList.add("otak-voice-menu__edit-btn--processing");
        editButton.classList.remove("otak-voice-menu__item--disabled");
        const iconContainer = editButton.querySelector(".otak-voice-menu__icon-container");
        if (iconContainer) {
          iconContainer.innerHTML = LOADING_ICON;
        }
      } else {
        editButton.classList.remove("otak-voice-menu__edit-btn--processing");
        const iconContainer = editButton.querySelector(".otak-voice-menu__icon-container");
        if (iconContainer) {
          iconContainer.innerHTML = EDIT_ICON;
        }
      }
    }
    const statusElem = document.querySelector(".otak-voice-status");
    if (statusElem && statusElem.style.display === "block") {
      if (isProcessing) {
        statusElem.classList.add("otak-voice-status--processing");
      } else {
        statusElem.classList.remove("otak-voice-status--processing");
      }
    }
  }
  function updateAutoDetectTooltip2() {
    const autoDetectCheckbox = document.getElementById("auto-detect-input-fields-checkbox");
    const autoDetectLabel = autoDetectCheckbox?.closest(".otak-voice-settings__switch");
    if (autoDetectCheckbox && autoDetectLabel) {
      const tooltipKey = autoDetectCheckbox.checked ? "settingAutoDetectTooltipOn" : "settingAutoDetectTooltipOff";
    } else {
    }
  }
  function updateAutoCorrectionTooltip2() {
    const autoCorrectionCheckbox = document.getElementById("auto-correction-checkbox");
    const autoCorrectionLabel = autoCorrectionCheckbox?.closest(".otak-voice-settings__switch");
    if (autoCorrectionCheckbox && autoCorrectionLabel) {
      const tooltipKey = autoCorrectionCheckbox.checked ? "settingAutoCorrectionTooltipOn" : "settingAutoCorrectionTooltipOff";
    }
  }
  function updateUseHistoryContextTooltip2() {
    const useHistoryContextCheckbox = document.getElementById("use-history-context-checkbox");
    const useHistoryContextLabel = useHistoryContextCheckbox?.closest(".otak-voice-settings__switch");
    if (useHistoryContextCheckbox && useHistoryContextLabel) {
      const tooltipKey = useHistoryContextCheckbox.checked ? "settingUseHistoryContextTooltipOn" : "settingUseHistoryContextTooltipOff";
    }
  }
  function showRecognitionTextModal(text = "", isInitial = false) {
    if (isInitial) {
      setState("newRecognitionSession", true);
      setState("lastAppendedText", "");
    }
    if (!getState("showModalWindow")) {
      return;
    }
    const currentTheme = getState("themeMode") || THEME_MODES.DARK;
    let modal = document.querySelector(".otak-voice-recognition");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "otak-voice-recognition";
      document.documentElement.setAttribute("data-otak-theme", currentTheme);
      modal.innerHTML = `
      <h3>${chrome.i18n.getMessage("recognitionModalTitle")}</h3>
      <textarea placeholder="${isInitial ? chrome.i18n.getMessage("recognitionModalPlaceholder") : ""}">${text}</textarea>
      <div class="otak-voice-recognition__button-container">
        <button class="otak-voice-recognition__copy-btn">${chrome.i18n.getMessage("recognitionModalCopyButton")}</button>
        <button class="otak-voice-recognition__close-btn">${chrome.i18n.getMessage("recognitionModalCloseButton")}</button>
      </div>
    `;
      const copyButton = modal.querySelector(".otak-voice-recognition__copy-btn");
      copyButton.onclick = () => {
        const textarea = modal.querySelector("textarea");
        textarea.select();
        document.execCommand("copy");
        const originalText2 = copyButton.textContent;
        copyButton.textContent = chrome.i18n.getMessage("recognitionModalCopied");
        const autoSubmit = getState("autoSubmit");
        if (autoSubmit) {
          setTimeout(() => {
            modal.remove();
          }, 1e3);
        } else {
          setTimeout(() => {
            if (modal.querySelector(".otak-voice-recognition__copy-btn")) {
              copyButton.textContent = originalText2;
            }
          }, 2e3);
        }
      };
      const closeButton = modal.querySelector(".otak-voice-recognition__close-btn");
      closeButton.onclick = () => {
        modal.remove();
      };
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && document.querySelector(".otak-voice-recognition")) {
          modal.remove();
        }
      });
      document.body.appendChild(modal);
      makeDraggable(modal);
    } else {
      const textarea = modal.querySelector("textarea");
      if (textarea) {
        textarea.value = text;
      }
    }
    if (!isInitial && text.trim() !== "") {
      const textarea = modal.querySelector("textarea");
      if (textarea) {
        textarea.select();
      }
    }
    return modal;
  }
  function updateRecognitionModal(text) {
    if (!getState("showModalWindow")) {
      return;
    }
    const modal = document.querySelector(".otak-voice-recognition");
    if (modal) {
      const textarea = modal.querySelector("textarea");
      if (textarea) {
        textarea.value = text;
      }
    }
  }

  // src/modules/dom-utils.js
  function isElementVisible(element) {
    if (!element) return false;
    try {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0 && rect.height > 0 && element.offsetParent !== null;
    } catch (error) {
      console.error("Error checking element visibility:", error);
      return false;
    }
  }
  function isElementInViewport(element) {
    if (!element) return false;
    try {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    } catch (error) {
      console.error("Error checking if element is in viewport:", error);
      return false;
    }
  }
  function isInputElement2(element) {
    if (!element) return false;
    try {
      if (element.isContentEditable) {
        return isElementVisible(element);
      }
      const validTagNames = ["INPUT", "TEXTAREA"];
      if (validTagNames.includes(element.tagName)) {
        if (element.tagName === "INPUT") {
          const validInputTypes = ["text", "search", "email", "password", "url", "tel", "number", null, ""];
          if (!validInputTypes.includes(element.type)) {
            return false;
          }
        }
        return isElementVisible(element) && !element.disabled && !element.readOnly;
      }
      return false;
    } catch (error) {
      console.error("Error checking if element is an input element:", error);
      return false;
    }
  }
  function findAllInputElements() {
    try {
      const elements = Array.from(document.querySelectorAll(
        'input[type="text"], input[type="search"], input[type="email"], input[type="password"], input[type="url"], input[type="tel"], textarea, [contenteditable="true"]'
      ));
      return elements.filter(isInputElement2);
    } catch (error) {
      console.error("Error finding input elements:", error);
      return [];
    }
  }
  function isButtonDisabled(button) {
    if (!button) return true;
    try {
      return button.disabled || button.getAttribute("aria-disabled") === "true" || button.classList.contains("disabled") || button.classList.contains("cursor-not-allowed") || button.classList.contains("opacity-50") || getComputedStyle(button).opacity < "0.9";
    } catch (error) {
      console.error("Error checking if button is disabled:", error);
      return true;
    }
  }
  function findAllButtons() {
    try {
      return Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]')).filter(isElementVisible);
    } catch (error) {
      console.error("Error finding buttons:", error);
      return [];
    }
  }
  function findButtonsForInput(inputElement) {
    if (!inputElement) return [];
    try {
      const candidates = [];
      if (inputElement.form) {
        const formButtons = Array.from(inputElement.form.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        candidates.push(...formButtons);
      }
      if (!inputElement.form) {
        let parent = inputElement.parentElement;
        let depth = 0;
        while (parent && depth < 10) {
          const buttons = Array.from(parent.querySelectorAll('button, input[type="submit"], input[type="button"]'));
          candidates.push(...buttons);
          parent = parent.parentElement;
          depth++;
        }
      }
      return [...new Set(candidates)].filter(isElementVisible);
    } catch (error) {
      console.error("Error finding buttons for input:", error);
      return [];
    }
  }
  function scoreSubmitButton(button, inputElement) {
    if (!button || !inputElement) return 0;
    try {
      let score = 0;
      const text = (button.textContent || "").toLowerCase();
      const value = (button.value || "").toLowerCase();
      const id = (button.id || "").toLowerCase();
      const className = (button.className || "").toLowerCase();
      const type = (button.type || "").toLowerCase();
      const submitKeywords = ["\u9001\u4FE1", "\u6295\u7A3F", "submit", "post", "send", "\u78BA\u5B9A", "\u5B9F\u884C", "ok", "\u4E86\u89E3"];
      for (const keyword of submitKeywords) {
        if (text.includes(keyword)) score += 5;
        if (value.includes(keyword)) score += 4;
        if (id.includes(keyword)) score += 3;
        if (className.includes(keyword)) score += 2;
      }
      if (type === "submit") score += 10;
      if (button.getAttribute("role") === "button") score += 2;
      if (inputElement.form && inputElement.form.querySelectorAll('button, input[type="submit"]').length === 1) {
        score += 8;
      }
      const hasSubmitIcon = button.querySelector('i.fa-paper-plane, i.fa-send, svg[data-icon="paper-plane"]');
      if (hasSubmitIcon) score += 5;
      const inputRect = inputElement.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      if (Math.abs(buttonRect.left - inputRect.right) < 100 && Math.abs(buttonRect.top - inputRect.top) < 50) {
        score += 3;
      }
      if (buttonRect.top > inputRect.bottom && Math.abs(buttonRect.left - inputRect.left) < 100) {
        score += 3;
      }
      if (buttonRect.top > inputRect.top && buttonRect.left > inputRect.left && buttonRect.left < inputRect.right + 100) {
        score += 4;
      }
      const hasImage = button.querySelector("img");
      if (hasImage) {
        const imgSrc = hasImage.src.toLowerCase();
        if (imgSrc.includes("send") || imgSrc.includes("submit") || imgSrc.includes("arrow")) {
          score += 3;
        }
      }
      const hasSVG = button.querySelector("svg");
      if (hasSVG) {
        score += 2;
      }
      if (isButtonDisabled(button)) {
        score -= 20;
      }
      return score;
    } catch (error) {
      console.error("Error scoring submit button:", error);
      return 0;
    }
  }
  function findBestSubmitButton(inputElement) {
    if (!inputElement) return null;
    try {
      const buttons = findButtonsForInput(inputElement);
      const allButtons = findAllButtons();
      const allCandidates = [.../* @__PURE__ */ new Set([...buttons, ...allButtons])];
      const scoredButtons = allCandidates.map((button) => ({
        button,
        score: scoreSubmitButton(button, inputElement)
      }));
      scoredButtons.sort((a, b) => b.score - a.score);
      if (scoredButtons.length > 0) {
        const bestButton = scoredButtons[0].button;
        if (isButtonDisabled(bestButton)) {
          return scoredButtons.length > 1 ? scoredButtons[1].button : null;
        }
        return bestButton;
      }
      return null;
    } catch (error) {
      console.error("Error finding best submit button:", error);
      return null;
    }
  }
  function scoreInputField(element) {
    if (!element) return 0;
    try {
      let score = 0;
      if (!isElementVisible(element)) return 0;
      if (isElementInViewport(element)) score += 5;
      const attributes = ["id", "name", "className", "placeholder", "aria-label", "title"];
      const chatKeywords = ["chat", "message", "\u5165\u529B", "\u9001\u4FE1", "input", "text", "comment"];
      const searchKeywords = ["search", "\u691C\u7D22"];
      for (const attr of attributes) {
        const value = element[attr] || element.getAttribute(attr);
        if (!value) continue;
        const lowerValue = value.toString().toLowerCase();
        for (const keyword of chatKeywords) {
          if (lowerValue.includes(keyword)) {
            score += 3;
            break;
          }
        }
        for (const keyword of searchKeywords) {
          if (lowerValue.includes(keyword)) {
            score += 2;
            break;
          }
        }
      }
      if (element.tagName === "TEXTAREA") score += 2;
      const rect = element.getBoundingClientRect();
      const area = rect.width * rect.height;
      const areaScore = Math.min(5, Math.floor(area / 5e3));
      score += areaScore;
      if (element.isContentEditable) score -= 1;
      return score;
    } catch (error) {
      console.error("Error scoring input field:", error);
      return 0;
    }
  }
  function findBestInputField() {
    try {
      const inputElements = findAllInputElements();
      if (inputElements.length === 0) return null;
      const scoredInputs = inputElements.map((element) => ({
        element,
        score: scoreInputField(element)
      }));
      scoredInputs.sort((a, b) => b.score - a.score);
      return scoredInputs.length > 0 ? scoredInputs[0].element : null;
    } catch (error) {
      console.error("Error finding best input field:", error);
      return null;
    }
  }
  function dispatchEvent(element, eventType, options = {}) {
    if (!element) return false;
    try {
      let event;
      switch (eventType) {
        case "input":
          if (options.inputType) {
            event = new InputEvent("input", {
              inputType: options.inputType,
              data: options.data,
              bubbles: true,
              cancelable: true,
              ...options
            });
          } else {
            event = new Event("input", { bubbles: true, cancelable: true, ...options });
          }
          break;
        case "change":
          event = new Event("change", { bubbles: true, cancelable: true, ...options });
          break;
        case "keydown":
        case "keyup":
        case "keypress":
          event = new KeyboardEvent(eventType, {
            key: options.key || "",
            code: options.code || "",
            bubbles: true,
            cancelable: true,
            ...options
          });
          break;
        case "focus":
        case "blur":
          event = new FocusEvent(eventType, { bubbles: true, ...options });
          break;
        default:
          event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
      }
      return element.dispatchEvent(event);
    } catch (error) {
      console.error(`Error dispatching ${eventType} event:`, error);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].EVENT_DISPATCH_FAILED,
        `Failed to dispatch ${eventType} event`,
        error,
        { element, eventType, options },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "dom-utils");
      return false;
    }
  }
  function setInputValue(element, text) {
    if (!element || !isInputElement2(element)) return false;
    try {
      element.focus();
      if (element.isContentEditable) {
        element.textContent = text;
      } else {
        element.value = text;
      }
      dispatchEvent(element, "input", { inputType: "insertText", data: text });
      dispatchEvent(element, "change");
      if (text.length > 0) {
        const lastChar = text[text.length - 1];
        dispatchEvent(element, "keydown", { key: lastChar });
        dispatchEvent(element, "keyup", { key: lastChar });
      }
      return true;
    } catch (error) {
      console.error("Error setting input value:", error);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
        "Failed to set input value",
        error,
        { element, text },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "dom-utils");
      return false;
    }
  }
  function handleTwitterInput(element, text) {
    if (!element || !element.isContentEditable) return false;
    try {
      const isTwitterInput = element.closest('[data-testid^="tweetTextarea"], [aria-label*="\u30C4\u30A4\u30FC\u30C8"], [aria-label*="Tweet"], [aria-label*="\u8FD4\u4FE1"], [aria-label*="Reply"], [aria-label*="Post"], [aria-label*="\u6295\u7A3F"]');
      if (!isTwitterInput) return false;
      element.focus();
      const blockKey = `otakvoice-block-${Date.now()}`;
      const offsetKey = `${blockKey}-0-0`;
      let dataContentsDiv = element.querySelector('div[data-contents="true"]');
      if (!dataContentsDiv) {
        element.innerHTML = "";
        dataContentsDiv = document.createElement("div");
        dataContentsDiv.setAttribute("data-contents", "true");
        element.appendChild(dataContentsDiv);
      }
      let dataBlockDiv = dataContentsDiv.querySelector('div[data-block="true"]');
      if (!dataBlockDiv) {
        dataBlockDiv = document.createElement("div");
        dataBlockDiv.setAttribute("data-block", "true");
        dataBlockDiv.style.position = "relative";
        dataContentsDiv.appendChild(dataBlockDiv);
      }
      let innerDiv = dataBlockDiv.querySelector("div[data-offset-key]");
      if (!innerDiv) {
        innerDiv = document.createElement("div");
        innerDiv.setAttribute("data-offset-key", offsetKey);
        innerDiv.style.position = "relative";
        dataBlockDiv.appendChild(innerDiv);
      }
      let offsetSpan = innerDiv.querySelector(`span[data-offset-key="${offsetKey}"]`);
      if (!offsetSpan) {
        offsetSpan = document.createElement("span");
        offsetSpan.setAttribute("data-offset-key", offsetKey);
        innerDiv.appendChild(offsetSpan);
      }
      let textSpan = element.querySelector('span[data-text="true"]');
      if (!textSpan) {
        textSpan = document.createElement("span");
        textSpan.setAttribute("data-text", "true");
        offsetSpan.appendChild(textSpan);
      }
      textSpan.textContent = text;
      dispatchEvent(element, "input", { inputType: "insertText", data: text });
      dispatchEvent(element, "change");
      if (text.length > 0) {
        const lastChar = text[text.length - 1];
        dispatchEvent(element, "keydown", { key: lastChar });
        dispatchEvent(element, "keyup", { key: lastChar });
      }
      dispatchEvent(element, "blur");
      dispatchEvent(element, "focus");
      return true;
    } catch (error) {
      console.error("Error handling Twitter input:", error);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].TWITTER_INPUT_FAILED,
        "Failed to handle Twitter input",
        error,
        { element, text },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "dom-utils");
      return false;
    }
  }
  function writeToInputField(element, text) {
    if (!element || !isInputElement2(element)) {
      publish(EVENTS.ERROR_OCCURRED, {
        source: "dom-utils",
        message: "Invalid input element for writing text",
        error: new Error("Invalid input element")
      });
      return false;
    }
    try {
      if (element.isContentEditable) {
        const twitterResult = handleTwitterInput(element, text);
        if (twitterResult) return true;
      }
      if (element.isContentEditable) {
        element.focus();
        document.execCommand("selectAll", false, null);
        document.execCommand("delete", false, null);
        const success = document.execCommand("insertText", false, text);
        if (success) {
          dispatchEvent(element, "input", { inputType: "insertText", data: text });
          dispatchEvent(element, "change");
          return true;
        }
      }
      return setInputValue(element, text);
    } catch (error) {
      console.error("Error writing to input field:", error);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
        "Failed to write to input field",
        error,
        { element, text },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "dom-utils");
      try {
        if (element.isContentEditable) {
          element.textContent = text;
        } else {
          element.value = text;
        }
        dispatchEvent(element, "input");
        dispatchEvent(element, "change");
        return true;
      } catch (fallbackError) {
        console.error("Fallback error writing to input field:", fallbackError);
        return false;
      }
    }
  }
  function clickButtonWithFeedback(button) {
    if (!button || isButtonDisabled(button)) return false;
    try {
      const originalBackgroundColor = button.style.backgroundColor;
      const originalBorder = button.style.border;
      button.style.backgroundColor = "#4CAF50";
      button.style.border = "2px solid #2E7D32";
      setTimeout(() => {
        button.style.backgroundColor = originalBackgroundColor;
        button.style.border = originalBorder;
        button.click();
        publish(EVENTS.STATUS_UPDATED, {
          messageKey: "statusSubmitClicked",
          persistent: false
        });
      }, 500);
      return true;
    } catch (error) {
      console.error("Error clicking button with feedback:", error);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].BUTTON_CLICK_FAILED,
        "Failed to click button with feedback",
        error,
        { button },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "dom-utils");
      return false;
    }
  }
  function clearInputField(element) {
    if (!element || !isInputElement2(element)) return false;
    try {
      element.focus();
      if (element.isContentEditable) {
        element.textContent = "";
      } else {
        element.value = "";
      }
      dispatchEvent(element, "input");
      dispatchEvent(element, "change");
      return true;
    } catch (error) {
      console.error("Error clearing input field:", error);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
        "Failed to clear input field",
        error,
        { element },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "dom-utils");
      return false;
    }
  }
  function findElement(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error(`Error finding element with selector "${selector}":`, error);
      return null;
    }
  }
  function findAllElements(selector, parent = document) {
    try {
      return Array.from(parent.querySelectorAll(selector));
    } catch (error) {
      console.error(`Error finding elements with selector "${selector}":`, error);
      return [];
    }
  }

  // src/site-handlers/systemexe.js
  function findSubmitButton() {
    const systemExeButton = findElement("#buttonSubmitMessageConversation");
    if (systemExeButton) {
      return systemExeButton;
    }
    const systemExeButtons = findAllElements(".buttonSubmitMessageConversation");
    if (systemExeButtons.length > 0) {
      return systemExeButtons[0];
    }
    const allButtons = document.querySelectorAll("button");
    for (const button of allButtons) {
      const svg = button.querySelector("svg");
      if (svg) {
        const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
        const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');
        if (hasLine && hasPolygon) {
          console.log("Found paper airplane SVG button in System.exe site");
          return button;
        }
      }
    }
    const cursorNotAllowedDivs = document.querySelectorAll("div.cursor-not-allowed");
    for (const div of cursorNotAllowedDivs) {
      const svg = div.querySelector("svg");
      if (svg) {
        const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
        const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');
        if (hasLine && hasPolygon) {
          console.log("Found paper airplane SVG in cursor-not-allowed div");
          return div;
        }
      }
    }
    return null;
  }
  function submitAfterVoiceInput() {
    const submitButton = findSubmitButton();
    if (submitButton) {
      if (submitButton.classList.contains("cursor-not-allowed")) {
        const style = window.getComputedStyle(submitButton);
        if (style.opacity === "1") {
          console.log("Found enabled button with cursor-not-allowed class");
          const svg = submitButton.querySelector("svg");
          if (svg) {
            console.log("Clicking SVG inside cursor-not-allowed div");
            svg.click();
            return true;
          }
          submitButton.click();
          return true;
        }
      }
      if (isButtonDisabled(submitButton)) {
        console.log(chrome.i18n.getMessage("logSubmitButtonDisabled"));
        if (typeof retryInputEvents === "function") {
          retryInputEvents();
        }
        return false;
      }
      clickButtonWithFeedback(submitButton);
      return true;
    }
    return false;
  }
  function findSubmitButtonForInput(inputElement) {
    const systemExeButton = findSubmitButton();
    if (systemExeButton) {
      return systemExeButton;
    }
    return null;
  }
  function findBestInputField2() {
    const textareas = findAllElements("textarea");
    for (const textarea of textareas) {
      if (textarea.id === "messageInput" || textarea.classList.contains("messageInput") || textarea.placeholder?.includes("\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u5165\u529B") || textarea.placeholder?.includes("Enter message")) {
        return textarea;
      }
    }
    for (const textarea of textareas) {
      if (isElementVisible(textarea)) {
        return textarea;
      }
    }
    return null;
  }
  function isSystemExePage() {
    const hostname = window.location.hostname;
    return hostname.includes("systemexe") || hostname.includes("system.exe") || document.title.includes("System.exe");
  }

  // src/site-handlers/ai-chat.js
  var ai_chat_exports = {};
  __export(ai_chat_exports, {
    findAIChatSubmitButton: () => findAIChatSubmitButton,
    findPaperPlaneButton: () => findPaperPlaneButton,
    findSubmitButtonForInput: () => findSubmitButtonForInput2,
    submitAfterVoiceInput: () => submitAfterVoiceInput2
  });
  function findPaperPlaneButton() {
    const allButtons = document.querySelectorAll("button");
    for (const button of allButtons) {
      const svg = button.querySelector("svg");
      if (svg) {
        const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
        const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');
        if (hasLine && hasPolygon) {
          console.log(chrome.i18n.getMessage("logPaperPlaneButtonFound"));
          return button;
        }
      }
      if (button.classList.contains("bg-primary/40") && button.getAttribute("type") === "submit") {
        const svg2 = button.querySelector("svg");
        if (svg2) {
          console.log(chrome.i18n.getMessage("logBgPrimaryButtonFound"));
          return button;
        }
      }
    }
    return null;
  }
  function findAIChatSubmitButton() {
    const aiChatSelectors = [
      // OpenAI ChatGPT
      "form.stretch button.absolute",
      'button[data-testid="send-button"]',
      // Claude (英語と日本語)
      'button[aria-label="Send message"]',
      'button[aria-label="\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u4FE1"]',
      ".claude-submit-button",
      // Bard / Gemini
      'button[aria-label="Send"]',
      "button.send-button",
      // Bing Chat
      "button.submit-button",
      "button.chat-send-button",
      // Perplexity
      "button.send-message-button",
      // System.exe Research and Development
      "#buttonSubmitMessageConversation",
      ".buttonSubmitMessageConversation",
      // Button with paper airplane SVG icon
      'button[type="submit"] svg[viewBox="0 0 24 24"]',
      // Claude.ai上向き矢印アイコン
      'button svg[viewBox="0 0 256 256"]',
      // Claude.ai特有のクラス名
      "button.bg-accent-main-000",
      // Claude.ai送信ボタン（直接入力の場合）
      'button[aria-label="Send message"]',
      'button[aria-label="\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u4FE1"]',
      // Common AI chat
      "button.chat-submit",
      "button.ai-submit-button",
      "button.ai-chat-send"
    ];
    for (const selector of aiChatSelectors) {
      const buttons = document.querySelectorAll(selector);
      if (buttons.length > 0) {
        const visibleButtons = Array.from(buttons).filter((button) => {
          const style = window.getComputedStyle(button);
          const rect = button.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0 && rect.height > 0;
        });
        if (visibleButtons.length > 0) {
          return visibleButtons[0];
        }
      }
    }
    const iconButtons = document.querySelectorAll("button");
    for (const button of iconButtons) {
      const hasSendIcon = button.querySelector('svg, i.fa-paper-plane, i.fa-send, i.fa-arrow, img[src*="send"]');
      if (hasSendIcon) {
        const rect = button.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.top > window.innerHeight * 0.5) {
            return button;
          }
        }
      }
    }
    return null;
  }
  function isButtonDisabled2(button) {
    return button.disabled || button.getAttribute("aria-disabled") === "true" || button.classList.contains("disabled") || button.classList.contains("cursor-not-allowed") || button.classList.contains("opacity-50") || getComputedStyle(button).opacity < "0.9";
  }
  function submitAfterVoiceInput2() {
    setTimeout(() => {
      const paperPlaneButton = findPaperPlaneButton();
      if (paperPlaneButton) {
        if (isButtonDisabled2(paperPlaneButton)) {
          console.log(chrome.i18n.getMessage("logPaperPlaneButtonDisabled"));
          if (typeof retryInputEvents === "function") {
            retryInputEvents();
          }
          return;
        }
        const originalBackgroundColor = paperPlaneButton.style.backgroundColor;
        paperPlaneButton.style.backgroundColor = "#4CAF50";
        setTimeout(() => {
          paperPlaneButton.style.backgroundColor = originalBackgroundColor;
          paperPlaneButton.click();
          if (typeof showStatus2 === "function") {
            showStatus2("statusSubmitClicked");
          }
        }, 300);
        return;
      }
      const submitButton = findAIChatSubmitButton();
      if (submitButton) {
        if (isButtonDisabled2(submitButton)) {
          console.log(chrome.i18n.getMessage("logSubmitButtonDisabled"));
          if (typeof retryInputEvents === "function") {
            retryInputEvents();
          }
          return;
        }
        const originalBackgroundColor = submitButton.style.backgroundColor;
        submitButton.style.backgroundColor = "#4CAF50";
        setTimeout(() => {
          submitButton.style.backgroundColor = originalBackgroundColor;
          submitButton.click();
          if (typeof showStatus2 === "function") {
            showStatus2("statusSubmitClicked");
          }
        }, 300);
      } else {
        if (window.DefaultHandler && typeof window.DefaultHandler.submitAfterVoiceInput === "function") {
          window.DefaultHandler.submitAfterVoiceInput();
        }
      }
    }, 500);
    return true;
  }
  function findSubmitButtonForInput2(inputElement) {
    const paperPlaneButton = findPaperPlaneButton();
    if (paperPlaneButton) {
      return paperPlaneButton;
    }
    const aiChatButton = findAIChatSubmitButton();
    if (aiChatButton) {
      return aiChatButton;
    }
    return null;
  }

  // src/site-handlers/twitter.js
  var twitter_exports = {};
  __export(twitter_exports, {
    findBestInputField: () => findBestInputField3,
    findSubmitButtonForInput: () => findSubmitButtonForInput3,
    isTwitterPage: () => isTwitterPage,
    submitAfterVoiceInput: () => submitAfterVoiceInput3
  });
  function findBestInputField3() {
    console.log("x.com site handler: findBestInputField called");
    console.log("x.com site handler: Returning null to disable auto-detection on twitter.com");
    publish(EVENTS.STATUS_UPDATED, {
      messageKey: "statusTwitterNotSupported",
      persistent: true
    });
    return null;
  }
  function findSubmitButtonForInput3(inputElement) {
    console.log("x.com site handler: findSubmitButtonForInput called");
    if (!inputElement) return null;
    const tweetButton = findElement('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
    if (tweetButton) {
      console.log("x.com site handler: Found tweet button");
      return tweetButton;
    }
    console.log("x.com site handler: Could not find tweet button");
    return null;
  }
  function submitAfterVoiceInput3() {
    console.log("x.com site handler: submitAfterVoiceInput called");
    const lastRecognizedText = window.lastRecognizedText;
    if (lastRecognizedText) {
      showRecognitionTextModal(lastRecognizedText);
      publish(EVENTS.STATUS_UPDATED, {
        messageKey: "statusTwitterUseModal",
        persistent: false
      });
      return true;
    }
    return false;
  }
  function isTwitterPage() {
    const hostname = window.location.hostname;
    return hostname.includes("twitter.com") || hostname.includes("x.com") || hostname.includes("mobile.twitter.com");
  }

  // src/site-handlers/default.js
  var default_exports = {};
  __export(default_exports, {
    findBestInputField: () => findBestInputField4,
    findSubmitButtonForInput: () => findSubmitButtonForInput4,
    submitAfterVoiceInput: () => submitAfterVoiceInput4
  });
  function findSubmitButtonForInput4(inputElement) {
    if (!inputElement) return null;
    const button = findBestSubmitButton(inputElement);
    if (button) {
      console.log(chrome.i18n.getMessage("logSubmitButtonFound"), button);
    } else {
      console.log(chrome.i18n.getMessage("logSubmitButtonNotFound"));
    }
    return button;
  }
  function findBestInputField4() {
    const specificTextarea = findElement('textarea.textarea.w-full.resize-none.pl-2.pr-2[placeholder="\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u5165\u529B..."]');
    if (specificTextarea && isInputElement2(specificTextarea)) {
      console.log(chrome.i18n.getMessage("logSpecificTextareaFound"));
      return specificTextarea;
    }
    const specificTextareaAlt = findElement('textarea.textarea.w-full.resize-none[placeholder="\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u5165\u529B..."]');
    if (specificTextareaAlt && isInputElement2(specificTextareaAlt)) {
      console.log(chrome.i18n.getMessage("logSimilarTextareaFound"));
      return specificTextareaAlt;
    }
    const tailwindTextarea = findElement("textarea.textarea.w-full.resize-none");
    if (tailwindTextarea && isInputElement2(tailwindTextarea)) {
      console.log(chrome.i18n.getMessage("logTailwindTextareaFound"));
      return tailwindTextarea;
    }
    const placeholderTextareas = findAllElements('textarea[placeholder*="\u30E1\u30C3\u30BB\u30FC\u30B8"], textarea[placeholder*="message"]');
    const visiblePlaceholderTextarea = placeholderTextareas.find(isInputElement2);
    if (visiblePlaceholderTextarea) {
      console.log(chrome.i18n.getMessage("logMessageTextareaFound"));
      return visiblePlaceholderTextarea;
    }
    const bestInput = findBestInputField();
    if (bestInput) {
      console.log(chrome.i18n.getMessage("logGenericInputFound"));
    }
    return bestInput;
  }
  function submitAfterVoiceInput4() {
    let targetElement = document.activeElement;
    if (!isInputElement2(targetElement)) {
      targetElement = window.lastClickedInput && isInputElement2(window.lastClickedInput) ? window.lastClickedInput : findBestInputField4();
      if (targetElement) {
        targetElement.focus();
        publish(EVENTS.STATUS_UPDATED, { messageKey: "statusInputFound" });
      } else {
        publish(EVENTS.STATUS_UPDATED, { messageKey: "statusInputNotFound" });
        return false;
      }
    }
    let submitButton = findSubmitButtonForInput4(targetElement);
    if (submitButton) {
      if (isButtonDisabled(submitButton)) {
        publish(EVENTS.STATUS_UPDATED, { messageKey: "statusSubmitDisabled" });
        return false;
      }
      clickButtonWithFeedback(submitButton);
      return true;
    } else {
      publish(EVENTS.STATUS_UPDATED, { messageKey: "statusSubmitButtonNotFound" });
      return false;
    }
  }

  // src/site-handlers/site-detector.js
  function detectSiteType() {
    if (window.location.hostname.includes("systemexe-research-and-development.com")) {
      return SITE_TYPES.SYSTEMEXE;
    }
    if (window.location.hostname.includes("twitter.com") || window.location.hostname.includes("x.com")) {
      return SITE_TYPES.TWITTER;
    }
    const aiChatSelectors = [
      // OpenAI ChatGPT
      "form.stretch button.absolute",
      'button[data-testid="send-button"]',
      // Claude
      'button[aria-label="Send message"]',
      ".claude-submit-button",
      // Bard / Gemini
      'button[aria-label="Send"]',
      "button.send-button",
      // Bing Chat
      "button.submit-button",
      "button.chat-send-button",
      // Perplexity
      "button.send-message-button",
      // System.exe Research and Development
      "#buttonSubmitMessageConversation",
      ".buttonSubmitMessageConversation",
      // Button with paper airplane SVG icon
      'button[type="submit"] svg[viewBox="0 0 24 24"]',
      // Common AI chat
      "button.chat-submit",
      "button.ai-submit-button",
      "button.ai-chat-send"
    ];
    for (const selector of aiChatSelectors) {
      if (document.querySelector(selector)) {
        return SITE_TYPES.AI_CHAT;
      }
    }
    const allButtons = document.querySelectorAll("button");
    for (const button of allButtons) {
      const svg = button.querySelector("svg");
      if (svg) {
        const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
        const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');
        if (hasLine && hasPolygon) {
          return SITE_TYPES.AI_CHAT;
        }
      }
    }
    return SITE_TYPES.DEFAULT;
  }
  function getSiteHandler() {
    const siteType = detectSiteType();
    switch (siteType) {
      case SITE_TYPES.SYSTEMEXE:
        console.log("Using SystemExe site handler");
        return systemexe_exports;
      case SITE_TYPES.TWITTER:
        console.log("Using x.com (Twitter) site handler");
        return twitter_exports;
      case SITE_TYPES.AI_CHAT:
        console.log("Using AI Chat site handler");
        return ai_chat_exports;
      default:
        console.log("Using Default site handler");
        return default_exports;
    }
  }

  // src/modules/gpt-service.js
  async function correctWithGPT(text) {
    const apiKey = getState("apiKey");
    if (!apiKey) {
      const error = createError(
        ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY,
        null,
        null,
        null,
        ERROR_SEVERITY.INFO
        // INFO level since this is expected behavior
      );
      handleError(error, true, false, "gpt-service");
      return text;
    }
    if (!text || text.trim() === "") return text;
    try {
      publish(EVENTS.STATUS_UPDATED, {
        messageKey: "statusCorrecting",
        substitutions: void 0,
        persistent: true
      });
      const useHistoryContext = getState("useHistoryContext");
      const conversationHistory = useHistoryContext ? voiceHistory.slice(-5).map((item) => ({
        role: "user",
        // Treat history as user utterances
        content: item.text
      })) : [];
      const customPrompt = getState("autoCorrectionPrompt");
      const systemPrompt = customPrompt || "You are an assistant that corrects Japanese voice input in real-time. Please correct the content spoken by the user (the last message), fixing typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Consider the previous conversation history (if any) as context. Output only the corrected text.";
      const requestBody = {
        model: GPT_MODELS.CORRECTION,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          ...conversationHistory,
          // Expand conversation history
          {
            role: "user",
            content: text
            // Current voice input
          }
        ],
        max_tokens: 150,
        // Expect short response
        temperature: 0.3
        // Encourage more deterministic output
      };
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = mapHttpStatusToErrorCode(response.status);
        const error = createError(
          errorCode,
          null,
          null,
          {
            status: response.status,
            apiError: errorData.error?.message || "Unknown API error",
            originalResponse: errorData
          },
          ERROR_SEVERITY.ERROR
        );
        handleError(error, true, false, "gpt-service");
        if (response.status === 401) {
          publish(EVENTS.SETTINGS_MODAL_TOGGLED);
        }
        return text;
      }
      const data = await response.json();
      updateProcessingState(PROCESSING_STATE.IDLE);
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const correctedText = data.choices[0].message.content.trim();
        publish(EVENTS.STATUS_UPDATED, {
          messageKey: "statusCorrectionSuccess",
          substitutions: void 0,
          persistent: false
        });
        return correctedText;
      } else {
        console.warn(chrome.i18n.getMessage("logApiResponseUnexpected"), data);
        publish(EVENTS.STATUS_UPDATED, {
          messageKey: "statusCorrectionResponseError",
          substitutions: void 0,
          persistent: false
        });
        return text;
      }
    } catch (error) {
      updateProcessingState(PROCESSING_STATE.IDLE);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        null,
        error,
        null,
        ERROR_SEVERITY.ERROR
      );
      handleError(appError, true, false, "gpt-service");
      return text;
    }
  }
  async function proofreadWithGPT(text) {
    const apiKey = getState("apiKey");
    if (!apiKey) throw new Error(chrome.i18n.getMessage("statusApiKeyMissing"));
    try {
      publish(EVENTS.STATUS_UPDATED, {
        messageKey: "statusProofreadingModel",
        substitutions: GPT_MODELS.PROOFREADING,
        persistent: true
      });
      const customPrompt = getState("proofreadingPrompt");
      const systemPrompt = customPrompt || "You are an assistant that proofreads Japanese text. For the entire text provided by the user, correct typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Please preserve the original meaning and nuance of the text as much as possible. Output only the corrected text.";
      const requestBody = {
        model: GPT_MODELS.PROOFREADING,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 32768,
        // Support for long output
        temperature: 0.5
        // Moderate creativity for proofreading
      };
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = mapHttpStatusToErrorCode(response.status);
        throw createError(
          errorCode,
          `API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || "Details unknown"}`,
          null,
          {
            status: response.status,
            apiError: errorData.error?.message || "Unknown API error",
            originalResponse: errorData
          },
          ERROR_SEVERITY.ERROR
        );
      }
      const data = await response.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const correctedText = data.choices[0].message.content.trim();
        return correctedText;
      } else {
        console.error(chrome.i18n.getMessage("logOpenAiApiResponseUnexpected"), data);
        throw new Error(chrome.i18n.getMessage("statusCorrectionResponseError"));
      }
    } catch (error) {
      if (error.name === "AppError") {
        throw error;
      }
      console.error(chrome.i18n.getMessage("logProofreadRequestError"), error);
      throw createError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        null,
        error,
        null,
        ERROR_SEVERITY.ERROR
      );
    }
  }
  async function editWithGPT(currentText, instruction, activeElement) {
    console.log("Editing with GPT:", { currentText, instruction });
    const apiKey = getState("apiKey");
    try {
      publish(EVENTS.STATUS_UPDATED, {
        messageKey: "statusEditing",
        substitutions: void 0,
        persistent: true
      });
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GPT_MODELS.EDITING,
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that edits text based on user instructions. Apply the instructions to the provided text and output only the resulting edited text, without any explanations or introductory phrases."
            },
            {
              role: "user",
              content: `Existing text:
---
${currentText}
---

Edit instruction:
---
${instruction}
---

Edited text:`
            }
          ],
          max_tokens: 32768,
          temperature: 0.5
          // Lower temperature for more predictable editing
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorCode = mapHttpStatusToErrorCode(response.status);
        const error = createError(
          errorCode,
          null,
          null,
          {
            status: response.status,
            apiError: errorData.error?.message || "Unknown API error",
            originalResponse: errorData
          },
          ERROR_SEVERITY.ERROR
        );
        handleError(error, true, false, "gpt-service");
        return;
      }
      const data = await response.json();
      updateProcessingState(PROCESSING_STATE.IDLE);
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const editedText = data.choices[0].message.content.trim();
        console.log("Edited text:", editedText);
        setTimeout(() => {
          if (activeElement.isContentEditable) {
            activeElement.textContent = editedText;
            activeElement.dispatchEvent(new Event("input", { bubbles: true }));
            activeElement.dispatchEvent(new Event("change", { bubbles: true }));
          } else {
            try {
              simulateTypingIntoElement(activeElement, editedText);
            } catch (error) {
              console.error("Error simulating typing:", error);
              activeElement.value = editedText;
              activeElement.dispatchEvent(new Event("input", { bubbles: true }));
              activeElement.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        }, 100);
        publish(EVENTS.STATUS_UPDATED, {
          messageKey: "statusEditingComplete",
          substitutions: void 0,
          persistent: false
        });
      } else {
        updateProcessingState(PROCESSING_STATE.IDLE);
        const error = createError(
          ERROR_CODE[ERROR_CATEGORY.API].UNEXPECTED_RESPONSE,
          null,
          null,
          { originalResponse: data },
          ERROR_SEVERITY.ERROR
        );
        handleError(error, true, false, "gpt-service");
      }
    } catch (error) {
      updateProcessingState(PROCESSING_STATE.IDLE);
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        null,
        error,
        null,
        ERROR_SEVERITY.ERROR
      );
      handleError(appError, true, false, "gpt-service");
    }
  }

  // src/modules/input-handler.js
  var MENU_EXPANDED_STORAGE_KEY = "menu_expanded_state";
  var AUTO_SUBMIT_STORAGE_KEY2 = "otak_voice_auto_submit_state";
  var menuExpanded = false;
  async function loadMenuState() {
    const result = await tryCatch(
      async () => {
        try {
          return await chrome.storage.sync.get([MENU_EXPANDED_STORAGE_KEY]);
        } catch (storageError) {
          const error = createError(
            ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
            null,
            storageError,
            { key: MENU_EXPANDED_STORAGE_KEY },
            ERROR_SEVERITY.WARNING
          );
          handleError(error, false, false, "input-handler");
          return {};
        }
      },
      {
        errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
        showNotification: false,
        source: "input-handler"
      }
    );
    if (result && result[MENU_EXPANDED_STORAGE_KEY] !== void 0) {
      menuExpanded = result[MENU_EXPANDED_STORAGE_KEY];
    } else {
      menuExpanded = false;
    }
  }
  async function loadAutoSubmitState() {
    console.log("Loading auto submit state from storage...");
    const result = await tryCatch(
      async () => {
        try {
          console.log("Requesting auto submit state with key:", AUTO_SUBMIT_STORAGE_KEY2);
          return await chrome.storage.sync.get([AUTO_SUBMIT_STORAGE_KEY2]);
        } catch (storageError) {
          const error = createError(
            ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
            null,
            storageError,
            { key: AUTO_SUBMIT_STORAGE_KEY2 },
            ERROR_SEVERITY.WARNING
          );
          handleError(error, false, false, "input-handler");
          return {};
        }
      },
      {
        errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
        showNotification: false,
        source: "input-handler"
      }
    );
    if (result && result[AUTO_SUBMIT_STORAGE_KEY2] !== void 0) {
      console.log("Auto submit state found in storage:", result[AUTO_SUBMIT_STORAGE_KEY2]);
      setState("autoSubmit", result[AUTO_SUBMIT_STORAGE_KEY2]);
      updateAutoSubmitButtonState(result[AUTO_SUBMIT_STORAGE_KEY2]);
    } else {
      console.log("Auto submit state not found in storage, using default value: false");
      setState("autoSubmit", false);
      updateAutoSubmitButtonState(false);
    }
  }
  async function saveAutoSubmitState(state) {
    await tryCatch(
      async () => {
        try {
          console.log("Saving auto submit state:", state);
          await chrome.storage.sync.set({ [AUTO_SUBMIT_STORAGE_KEY2]: state });
          console.log("Auto submit state saved successfully");
          publish(EVENTS.AUTO_SUBMIT_STATE_CHANGED, state);
          const autoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
          if (autoSubmitCheckbox) {
            autoSubmitCheckbox.checked = state;
          }
        } catch (storageError) {
          const error = createError(
            ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
            null,
            storageError,
            { key: AUTO_SUBMIT_STORAGE_KEY2, value: state },
            ERROR_SEVERITY.WARNING
          );
          handleError(error, false, false, "input-handler");
          throw error;
        }
      },
      {
        errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
        showNotification: false,
        source: "input-handler"
      }
    );
  }
  async function saveMenuState(state) {
    await tryCatch(
      async () => {
        try {
          await chrome.storage.sync.set({ [MENU_EXPANDED_STORAGE_KEY]: state });
        } catch (storageError) {
          const error = createError(
            ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
            null,
            storageError,
            { key: MENU_EXPANDED_STORAGE_KEY, value: state },
            ERROR_SEVERITY.WARNING
          );
          handleError(error, false, false, "input-handler");
          throw error;
        }
      },
      {
        errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
        showNotification: false,
        source: "input-handler"
      }
    );
  }
  function toggleMenu() {
    const menuContainer = document.getElementById("otak-voice-menu-container");
    const menuButton = document.getElementById("otak-voice-menu-btn");
    if (!menuContainer || !menuButton) return;
    const currentMenuExpanded = getState("menuExpanded");
    const newMenuExpanded = !currentMenuExpanded;
    setState("menuExpanded", newMenuExpanded);
    menuExpanded = newMenuExpanded;
    updateMenuState();
    saveMenuState(newMenuExpanded);
  }
  function updateMenuState() {
    const menuContainer = document.getElementById("otak-voice-menu-container");
    const menuButton = document.getElementById("otak-voice-menu-btn");
    if (!menuContainer || !menuButton) {
      console.log("Menu elements not found");
      return;
    }
    const menuExpanded2 = getState("menuExpanded");
    if (menuExpanded2) {
      menuContainer.classList.add("otak-voice-menu__container--expanded");
      menuButton.classList.add("otak-voice-menu__btn--expanded");
      menuButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="15" y1="5" x2="5" y2="15"></line>
          <line x1="5" y1="5" x2="15" y2="15"></line>
        </svg>`;
    } else {
      menuContainer.classList.remove("otak-voice-menu__container--expanded");
      menuButton.classList.remove("otak-voice-menu__btn--expanded");
      menuButton.innerHTML = MENU_ICON;
      const historyPanel = document.getElementById("otak-voice-history-panel");
      if (historyPanel) historyPanel.style.display = "none";
      const settingsModal = document.getElementById("otak-voice-settings-modal");
      if (settingsModal) settingsModal.style.display = "none";
    }
  }
  function toggleSettingsModal() {
    const modal = document.getElementById("otak-voice-settings-modal");
    if (!modal) return;
    const currentDisplay = modal.style.display || "none";
    modal.style.display = currentDisplay === "none" ? "block" : "none";
    if (currentDisplay === "none") {
      const apiKeyInput = document.getElementById("api-key-input");
      const langSelect = document.getElementById("recognition-lang-select");
      const autoDetectCheckbox = document.getElementById("auto-detect-input-fields-checkbox");
      const themeSelect = document.getElementById("theme-select");
      const apiKey = getState("apiKey");
      const recognitionLang = getState("recognitionLang");
      const autoDetectInputFields = getState("autoDetectInputFields");
      const autoCorrection = getState("autoCorrection");
      const useHistoryContext = getState("useHistoryContext");
      const themeMode = getState("themeMode");
      if (apiKeyInput) apiKeyInput.value = apiKey || "";
      if (langSelect) langSelect.value = recognitionLang || "ja-JP";
      if (autoDetectCheckbox) {
        autoDetectCheckbox.checked = autoDetectInputFields === true;
        if (typeof updateAutoDetectTooltip === "function") {
          updateAutoDetectTooltip();
        }
      }
      const autoCorrectionCheckbox = document.getElementById("auto-correction-checkbox");
      if (autoCorrectionCheckbox) {
        autoCorrectionCheckbox.checked = autoCorrection === true;
        if (typeof updateAutoCorrectionTooltip === "function") {
          updateAutoCorrectionTooltip();
        }
      }
      const useHistoryContextCheckbox = document.getElementById("use-history-context-checkbox");
      if (useHistoryContextCheckbox) {
        useHistoryContextCheckbox.checked = useHistoryContext === true;
        if (typeof updateUseHistoryContextTooltip === "function") {
          updateUseHistoryContextTooltip();
        }
      }
      if (themeSelect) {
        themeSelect.value = themeMode || THEME_MODES.DARK;
      }
    }
  }
  function updateAutoSubmitButtonState(autoSubmit) {
    const autoSubmitButton = document.querySelector(".otak-voice-menu__append-btn");
    if (!autoSubmitButton) return;
    if (autoSubmit) {
      autoSubmitButton.classList.remove("otak-voice-menu__append-btn--active");
      autoSubmitButton.style.backgroundColor = "";
      autoSubmitButton.style.color = "";
      autoSubmitButton.style.borderColor = "";
      autoSubmitButton.style.boxShadow = "";
      publish(EVENTS.STATUS_UPDATED, { messageKey: "statusAutoSubmitOn", persistent: false });
      const statusElem = document.querySelector(".otak-voice-status");
      if (statusElem) {
        statusElem.textContent = chrome.i18n.getMessage("statusAutoSubmitOn");
        statusElem.style.display = "block";
      }
    } else {
      autoSubmitButton.classList.add("otak-voice-menu__append-btn--active");
      autoSubmitButton.style.backgroundColor = "";
      autoSubmitButton.style.color = "";
      autoSubmitButton.style.borderColor = "";
      autoSubmitButton.style.boxShadow = "";
      publish(EVENTS.STATUS_UPDATED, { messageKey: "statusAutoSubmitOff", persistent: false });
      const statusElem = document.querySelector(".otak-voice-status");
      if (statusElem) {
        statusElem.textContent = chrome.i18n.getMessage("statusAutoSubmitOff");
        statusElem.style.display = "block";
      }
    }
  }
  function toggleAutoSubmit(fromMenuButton = false) {
    const autoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
    if (fromMenuButton || !autoSubmitCheckbox) {
      const currentAutoSubmit = getState("autoSubmit");
      const newAutoSubmit = !currentAutoSubmit;
      setState("autoSubmit", newAutoSubmit);
      console.log("Toggling auto submit state to:", newAutoSubmit);
      saveAutoSubmitState(newAutoSubmit);
      updateAutoSubmitButtonState(newAutoSubmit);
      const settingsModal = document.getElementById("otak-voice-settings-modal");
      if (settingsModal && settingsModal.style.display === "block" && typeof updateSettingsModalValues === "function") {
        updateSettingsModalValues();
      } else {
        const modalAutoSubmitCheckbox = document.getElementById("auto-submit-checkbox");
        if (modalAutoSubmitCheckbox) {
          modalAutoSubmitCheckbox.checked = newAutoSubmit;
        }
      }
    } else {
      console.log("Auto submit checkbox changed, will be applied when Save is clicked");
    }
  }
  function clearCurrentInput() {
    const previousActiveElement = document.activeElement;
    const wasPreviousElementInput = isInputElement2(previousActiveElement);
    if (wasPreviousElementInput) {
      let targetElement2 = previousActiveElement;
      if (clearInputField(targetElement2)) {
        const currentInputElement = getState("currentInputElement");
        if (targetElement2 === currentInputElement) {
          setState("originalText", "");
        }
        publish(EVENTS.STATUS_UPDATED, { messageKey: "statusClearSuccess" });
        return;
      }
    }
    let targetElement = document.activeElement;
    if (!isInputElement2(targetElement)) {
      const lastClickedInput = getState("lastClickedInput");
      if (lastClickedInput && isInputElement2(lastClickedInput)) {
        targetElement = lastClickedInput;
      } else if (getState("autoDetectInputFields")) {
        targetElement = findBestInputField5();
      } else {
        targetElement = null;
      }
      if (targetElement) {
        targetElement.focus();
        publish(EVENTS.STATUS_UPDATED, { messageKey: "statusInputFound" });
      } else {
        if (!getState("autoDetectInputFields")) {
          publish(EVENTS.STATUS_UPDATED, { messageKey: "statusAutoDetectOff" });
        } else {
          publish(EVENTS.STATUS_UPDATED, { messageKey: "statusClearNotFound" });
        }
        return;
      }
    }
    if (clearInputField(targetElement)) {
      const currentInputElement = getState("currentInputElement");
      if (targetElement === currentInputElement) {
        setState("originalText", "");
      }
      publish(EVENTS.STATUS_UPDATED, { messageKey: "statusClearSuccess" });
    } else {
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
        "Failed to clear input field",
        null,
        { element: targetElement },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "input-handler");
    }
  }
  function findBestInputField5() {
    const siteHandler = getSiteHandler();
    if (siteHandler && typeof siteHandler.findBestInputField === "function") {
      const inputField = siteHandler.findBestInputField();
      if (inputField) {
        return inputField;
      }
    }
    return findBestInputField();
  }
  function autoSubmitAfterVoiceInput() {
    const siteHandler = getSiteHandler();
    if (siteHandler && typeof siteHandler.submitAfterVoiceInput === "function") {
      return siteHandler.submitAfterVoiceInput();
    }
    return false;
  }
  function writeToInputField2(el, txt) {
    if (!el) return;
    const result = writeToInputField(el, txt);
    if (!result) {
      console.error(chrome.i18n.getMessage("logWriteToInputFieldFailed"));
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
        "Failed to write to input field",
        null,
        { element: el, text: txt },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "input-handler");
    }
  }
  function simulateTypingIntoElement(element, text) {
    console.log("[Debug] simulateTypingIntoElement: \u958B\u59CB", { element, text });
    if (!element || text === void 0 || text === null) {
      console.log("[Debug] simulateTypingIntoElement: \u8981\u7D20\u307E\u305F\u306F\u30C6\u30AD\u30B9\u30C8\u304C\u7A7A\u306E\u305F\u3081\u7D42\u4E86");
      return false;
    }
    const result = writeToInputField(element, text);
    if (result) {
      console.log("[Debug] simulateTypingIntoElement: DOM abstraction layer succeeded");
      return true;
    } else {
      console.error(chrome.i18n.getMessage("logTypingSimulateError"));
      const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
        "Failed to simulate typing into element",
        null,
        { element, text },
        ERROR_SEVERITY.WARNING
      );
      handleError(appError, false, false, "input-handler");
      return false;
    }
  }
  function handleEnterKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (this.tagName.toLowerCase() === "textarea" && !e.ctrlKey) {
        return;
      }
      window.currentInputElement = this;
      if (!window.useRecognitionModal) {
        autoSubmitAfterVoiceInput();
      }
    }
  }
  function enhanceInputElementHandlers() {
    const inputElements = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
    inputElements.forEach((el) => {
      el.removeEventListener("keydown", handleEnterKey);
      el.addEventListener("keydown", handleEnterKey);
    });
  }
  async function proofreadCurrentInput() {
    const processingState = getState("processingState");
    if (processingState && processingState !== PROCESSING_STATE.IDLE) {
      showStatus3("statusProcessingInProgress");
      return;
    }
    setState("processingState", PROCESSING_STATE.PROOFREADING);
    let currentInputElement = document.activeElement;
    if (!isInputElement2(currentInputElement)) {
      const lastClickedInput = getState("lastClickedInput");
      if (lastClickedInput && isInputElement2(lastClickedInput)) {
        currentInputElement = lastClickedInput;
      } else if (getState("autoDetectInputFields")) {
        currentInputElement = findBestInputField5();
      } else {
        currentInputElement = null;
      }
      if (currentInputElement) {
        currentInputElement.focus();
        setState("currentInputElement", currentInputElement);
        showStatus3("statusInputFound");
      } else {
        if (!getState("autoDetectInputFields")) {
          showStatus3("statusAutoDetectOff");
        } else {
          showStatus3("statusProofreadNotFound");
        }
        setState("processingState", PROCESSING_STATE.IDLE);
        return;
      }
    } else {
      setState("currentInputElement", currentInputElement);
    }
    let content = "";
    if (currentInputElement.isContentEditable) {
      content = currentInputElement.textContent || "";
    } else {
      content = currentInputElement.value || "";
    }
    if (!content.trim()) {
      showStatus3("statusProofreadEmpty");
      setState("processingState", PROCESSING_STATE.IDLE);
      return;
    }
    const apiKey = getState("apiKey");
    if (!apiKey || apiKey.trim() === "") {
      const error = createError(
        ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY,
        null,
        null,
        null,
        ERROR_SEVERITY.WARNING
      );
      handleError(error, true, false, "input-handler");
      setState("processingState", PROCESSING_STATE.IDLE);
      toggleSettingsModal();
      return;
    }
    showStatus3("statusProofreading", void 0, true);
    try {
      const corrected = await proofreadWithGPT(content);
      if (corrected) {
        if (simulateTypingIntoElement(currentInputElement, corrected)) {
        } else {
          if (currentInputElement.isContentEditable) {
            currentInputElement.textContent = corrected;
          } else {
            currentInputElement.value = corrected;
          }
          currentInputElement.dispatchEvent(new Event("input", { bubbles: true }));
          currentInputElement.dispatchEvent(new Event("change", { bubbles: true }));
        }
        showStatus3("statusProofreadSuccess");
        setState("processingState", PROCESSING_STATE.IDLE);
      } else {
        showStatus3("statusProofreadError");
        setState("processingState", PROCESSING_STATE.IDLE);
      }
    } catch (error) {
      if (error.name === "AppError") {
        handleError(error, true, false, "input-handler");
      } else {
        const appError = createError(
          ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR,
          null,
          error,
          null,
          ERROR_SEVERITY.ERROR
        );
        handleError(appError, true, false, "input-handler");
      }
      setState("processingState", PROCESSING_STATE.IDLE);
    }
  }
  async function initInputHandler() {
    initializeState();
    console.log("Initializing input handler - loading states...");
    await loadMenuState();
    await loadAutoSubmitState();
    console.log("States loaded successfully");
    setState("menuExpanded", menuExpanded);
    document.addEventListener("click", (e) => {
      if (isInputElement2(e.target)) {
        setState("lastClickedInput", e.target);
        publish(EVENTS.INPUT_FIELD_CLICKED, e.target);
      }
    }, true);
    setupEventSubscriptions4();
  }
  function setupEventSubscriptions4() {
    subscribe(EVENTS.MENU_TOGGLED, () => {
      toggleMenu();
    });
    subscribe(EVENTS.SETTINGS_MODAL_TOGGLED, () => {
      toggleSettingsModal();
    });
    subscribe(EVENTS.AUTO_SUBMIT_TOGGLED, (data) => {
      const fromMenuButton = data && data.fromMenuButton === true;
      toggleAutoSubmit(fromMenuButton);
    });
    subscribe(EVENTS.AUTO_SUBMIT_STATE_CHANGED, (autoSubmit) => {
      setState("autoSubmit", autoSubmit);
      updateAutoSubmitButtonState(autoSubmit);
    });
    subscribe(EVENTS.INPUT_CLEARED, () => {
      clearCurrentInput();
    });
    subscribe(EVENTS.GPT_PROOFREADING_STARTED, () => {
      proofreadCurrentInput();
    });
    subscribe(EVENTS.INPUT_FIELD_FOUND, () => {
      const bestInputField = findBestInputField5();
      if (bestInputField) {
        setState("currentInputElement", bestInputField);
      }
    });
    subscribe(EVENTS.SPEECH_RECOGNITION_RESULT, (data) => {
      const { final, text } = data;
      const currentInputElement = getState("currentInputElement");
      if (!currentInputElement) return;
      if (final) {
        if (simulateTypingIntoElement(currentInputElement, text)) {
        } else {
          writeToInputField2(currentInputElement, text);
        }
        const useRecognitionModal = getState("useRecognitionModal");
        const autoSubmit = getState("autoSubmit");
        if (!useRecognitionModal && autoSubmit) {
          autoSubmitAfterVoiceInput();
        }
      } else {
        writeToInputField2(currentInputElement, text);
      }
    });
    subscribe(EVENTS.MENU_STATE_UPDATE_NEEDED, async () => {
      try {
        await loadMenuState();
        updateMenuState();
      } catch (error) {
        if (error.message.includes("Extension context invalidated")) {
        } else {
          console.error("Error updating menu state:", error);
          publish(EVENTS.ERROR_OCCURRED, {
            source: "input-handler",
            message: "Error updating menu state",
            error
          });
        }
      }
    });
    subscribe(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED, () => {
      try {
        enhanceInputElementHandlers();
      } catch (error) {
        if (error.message.includes("Extension context invalidated")) {
        } else {
          const appError = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].EVENT_DISPATCH_FAILED,
            "Error enhancing input handlers",
            error,
            null,
            ERROR_SEVERITY.WARNING
          );
          handleError(appError, false, false, "input-handler");
        }
      }
    });
  }
  function showStatus3(messageKey, substitutions, persistent = false) {
    publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
  }

  // src/modules/dom-observer.js
  function setupDOMObserver() {
    console.log(chrome.i18n.getMessage("logDomObserverStart"));
    setupEventSubscriptions5();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const textareas = node.querySelectorAll("textarea");
              if (textareas.length > 0) {
                console.log(chrome.i18n.getMessage("logSpaNavigationDetected"), textareas);
                const voiceMenuBtn = document.getElementById("otak-voice-menu-btn");
                if (!voiceMenuBtn) {
                  console.log(chrome.i18n.getMessage("logSpaUiReinit"));
                  publish(EVENTS.UI_RECOVERY_NEEDED);
                  initVoiceInput();
                } else {
                  console.log("Page transition detected: Reapplying menu state");
                  publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
                }
                try {
                  publish(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
                  enhanceInputElementHandlers();
                } catch (error) {
                  if (error.message.includes("Extension context invalidated")) {
                  } else {
                    console.error("Error enhancing input handlers after SPA navigation:", error);
                    publish(EVENTS.ERROR_OCCURRED, {
                      source: "dom-observer",
                      message: "Error enhancing input handlers after SPA navigation",
                      error
                    });
                  }
                }
                break;
              }
            }
          }
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    setInterval(() => {
      const voiceMenuBtn = document.getElementById("otak-voice-menu-btn");
      if (!voiceMenuBtn) {
        console.log(chrome.i18n.getMessage("logPollingUiNotFound"));
        publish(EVENTS.UI_RECOVERY_NEEDED);
        initVoiceInput();
      } else {
        publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
      }
      try {
        publish(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
        enhanceInputElementHandlers();
      } catch (error) {
        if (error.message.includes("Extension context invalidated")) {
        } else {
          console.error("Error enhancing input handlers in interval:", error);
          publish(EVENTS.ERROR_OCCURRED, {
            source: "dom-observer",
            message: "Error enhancing input handlers in interval",
            error
          });
        }
      }
    }, 5e3);
  }
  function setupEventSubscriptions5() {
    subscribe(EVENTS.MENU_STATE_UPDATE_NEEDED, () => {
      console.log("Menu state update needed (event received in dom-observer)");
    });
    subscribe(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED, () => {
      console.log("Input handlers update needed (event received in dom-observer)");
    });
    subscribe(EVENTS.UI_RECOVERY_NEEDED, () => {
      console.log("UI recovery needed (event received in dom-observer)");
    });
  }

  // src/modules/speech.js
  var recognitionInstance = null;
  setState({
    isListening: false,
    isEditing: false
  });
  function setupEventSubscriptions6() {
    subscribe(EVENTS.MIC_BUTTON_CLICKED, handleMicButtonClick);
    subscribe(EVENTS.GPT_EDITING_STARTED, handleEditButtonClick);
    subscribe(EVENTS.LANGUAGE_UPDATED, updateRecognitionLanguage);
  }
  function handleMicButtonClick() {
    const previousActiveElement = document.activeElement;
    const wasPreviousElementInput = isInputElement(previousActiveElement);
    publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: "", isInitial: true });
    let currentInputElement = null;
    if (wasPreviousElementInput) {
      currentInputElement = previousActiveElement;
      setState("currentInputElement", currentInputElement);
      console.log("[Debug handleMicButtonClick: Using previous input element:", currentInputElement);
    } else {
      currentInputElement = document.activeElement;
      if (!isInputElement(currentInputElement)) {
        const lastClickedInput = getState("lastClickedInput");
        const autoDetectInputFields = getState("autoDetectInputFields");
        if (lastClickedInput && isInputElement(lastClickedInput)) {
          currentInputElement = lastClickedInput;
        } else if (autoDetectInputFields) {
          publish(EVENTS.INPUT_FIELD_FOUND);
          currentInputElement = getState("currentInputElement");
        } else {
          currentInputElement = null;
        }
        if (currentInputElement) {
          currentInputElement.focus();
          setState("currentInputElement", currentInputElement);
          console.log("[Debug] handleMicButtonClick: Found input via lastClickedInput or findBestInputField:", currentInputElement);
          showStatus4("statusInputFound");
        } else {
          setState("useRecognitionModal", true);
          console.log("[Debug] handleMicButtonClick: No input field found, will use modal dialog");
          showStatus4("statusUsingModalDialog");
          toggleSpeechRecognition();
          return;
        }
      }
    }
    toggleSpeechRecognition();
  }
  function toggleSpeechRecognition() {
    const isListening = getState("isListening");
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  }
  function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(chrome.i18n.getMessage("alertSpeechApiNotAvailable"));
      return;
    }
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {
        console.warn("Previous recognition stop error:", e);
      }
      recognitionInstance = null;
    }
    showStatus4("statusPreparingRecognition", void 0, true);
    recognitionInstance = new SpeechRecognition();
    const recognition = recognitionInstance;
    recognition.lang = getState("recognitionLang");
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    if ("speechSetting" in recognition) {
      try {
        recognition.speechSetting = {
          speechRecognitionTimeoutMs: 100,
          // 無音検出の時間を短く
          speechRecognitionMaxAlternatives: 1,
          speechRecognitionGrammars: []
        };
      } catch (e) {
        console.warn("Failed to set speechSetting:", e);
      }
    }
    let lastResultTime = 0;
    let silenceTimer = null;
    const silenceTimeout = getState("silenceTimeout") || DEFAULT_SETTINGS.SILENCE_TIMEOUT;
    recognition.onstart = function() {
      setState("isListening", true);
      updateMicButtonState(true);
      setState("interimText", "");
      playBeepSound("start");
      showStatus4("statusListening");
      setState("recognitionReady", true);
    };
    recognition.onresult = async function(event) {
      const results = event.results;
      const result = results[results.length - 1];
      const transcript = result[0].transcript;
      setState("lastRecognizedText", transcript);
      lastResultTime = Date.now();
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      silenceTimer = setTimeout(() => {
        console.log("[Speech] Silence detected for " + silenceTimeout + "ms, stopping recognition");
        if (recognitionInstance) {
          try {
            recognitionInstance.stop();
          } catch (e) {
            console.warn("Error stopping recognition after silence:", e);
          }
        }
      }, silenceTimeout);
      const showModalWindow = getState("showModalWindow");
      if (showModalWindow) {
        if (!result.isFinal) {
          publish(EVENTS.RECOGNITION_MODAL_UPDATED, transcript);
        } else {
          const cleaned = basicCleanup(transcript);
          try {
            const autoCorrection = getState("autoCorrection");
            const corrected = autoCorrection ? await correctWithGPT(cleaned) : cleaned;
            setState("lastRecognizedText", corrected);
            publish(EVENTS.RECOGNITION_MODAL_UPDATED, corrected);
            addToHistory(corrected);
            showStatus4("statusCorrectionSuccess");
          } catch (error) {
            console.error(chrome.i18n.getMessage("logCorrectionError"), error);
            publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
            addToHistory(cleaned);
            showStatus4("statusCorrectionError", error.message || "Unknown error");
          }
        }
        return;
      }
      if (!result.isFinal) {
        publish(EVENTS.RECOGNITION_MODAL_UPDATED, transcript);
      }
      const currentInputElement = getState("currentInputElement");
      const useRecognitionModal = getState("useRecognitionModal");
      if (!currentInputElement || useRecognitionModal) {
        if (result.isFinal) {
          const cleaned = basicCleanup(transcript);
          publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
          try {
            const autoCorrection = getState("autoCorrection");
            const corrected = autoCorrection ? await correctWithGPT(cleaned) : cleaned;
            setState("lastRecognizedText", corrected);
            publish(EVENTS.RECOGNITION_MODAL_UPDATED, corrected);
            addToHistory(corrected);
            showStatus4("statusCorrectionSuccess");
          } catch (error) {
            console.error(chrome.i18n.getMessage("logCorrectionError"), error);
            publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
            addToHistory(cleaned);
            showStatus4("statusCorrectionError", error.message || "Unknown error");
          }
          return;
        }
        return;
      }
      if (result.isFinal) {
        const cleaned = basicCleanup(transcript);
        try {
          const autoCorrection = getState("autoCorrection");
          const corrected = autoCorrection ? await correctWithGPT(cleaned) : cleaned;
          setState("lastRecognizedText", corrected);
          const siteType = detectSiteType();
          if (siteType === "twitter") {
            publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: corrected, isInitial: false });
            addToHistory(corrected);
            showStatus4("statusCorrectionSuccess");
            return;
          }
          const currentInputElement2 = getState("currentInputElement");
          publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
            final: true,
            text: corrected,
            append: false
          });
          addToHistory(corrected);
          showStatus4("statusCorrectionSuccess");
        } catch (error) {
          console.error(chrome.i18n.getMessage("logCorrectionErrorOverwrite"), error);
          const siteType = detectSiteType();
          if (siteType === "twitter") {
            publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: cleaned, isInitial: false });
            addToHistory(cleaned);
            showStatus4("statusCorrectionError", error.message || "Unknown error");
            return;
          }
          const currentInputElement2 = getState("currentInputElement");
          publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
            final: true,
            text: cleaned,
            append: false
          });
          addToHistory(cleaned);
          showStatus4("statusCorrectionError", error.message || "Unknown error");
        }
      } else {
        const currentInputElement2 = getState("currentInputElement");
        publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
          final: false,
          text: transcript,
          append: false
        });
      }
    };
    recognition.onend = function() {
      const wasListening = getState("isListening");
      setState("isListening", false);
      updateMicButtonState(false);
      playBeepSound("end");
      setState("useRecognitionModal", false);
      setState("recognitionReady", false);
      const existingModal = document.querySelector(".otak-voice-recognition");
      if (existingModal) {
        const textarea = existingModal.querySelector("textarea");
        if (textarea && textarea.value.trim() !== "") {
          const copyButton = existingModal.querySelector(".otak-voice-recognition__copy-btn");
          if (copyButton) {
            copyButton.click();
          }
        } else {
          existingModal.remove();
        }
      }
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };
    recognition.onerror = function(event) {
      const errorCode = mapSpeechErrorToErrorCode(event.error);
      const error = createError(errorCode, null, null, { originalError: event.error });
      handleError(error, true, false, "speech");
      setState("isListening", false);
      updateMicButtonState(false);
      recognitionInstance = null;
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    };
    try {
      setTimeout(() => {
        try {
          recognition.start();
          console.log("[Speech] Recognition started after warmup");
        } catch (e) {
          const error = createError(
            ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED,
            null,
            e,
            null,
            ERROR_SEVERITY.ERROR
          );
          handleError(error, true, false, "speech");
          setState("isListening", false);
          updateMicButtonState(false);
          recognitionInstance = null;
        }
      }, 300);
    } catch (e) {
      const error = createError(
        ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED,
        null,
        e,
        null,
        ERROR_SEVERITY.ERROR
      );
      handleError(error, true, false, "speech");
      setState("isListening", false);
      updateMicButtonState(false);
      recognitionInstance = null;
    }
  }
  function stopSpeechRecognition() {
    const isListening = getState("isListening");
    if (recognitionInstance && isListening) {
      try {
        recognitionInstance.stop();
        showStatus4("statusSpeechStop");
      } catch (e) {
        const error = createError(
          ERROR_CODE[ERROR_CATEGORY.SPEECH].STOP_FAILED,
          null,
          e,
          null,
          ERROR_SEVERITY.ERROR
        );
        handleError(error, true, false, "speech");
        setState("isListening", false);
        updateMicButtonState(false);
        recognitionInstance = null;
      }
    } else {
      setState("isListening", false);
      updateMicButtonState(false);
    }
  }
  function updateMicButtonState(active) {
    const micButton = document.querySelector(".otak-voice-menu__input-btn");
    if (!micButton) return;
    if (active) {
      micButton.classList.add("otak-voice-menu__input-btn--active");
    } else {
      micButton.classList.remove("otak-voice-menu__input-btn--active");
    }
    micButton.title = chrome.i18n.getMessage("micTooltip");
    const label = micButton.querySelector(".otak-voice-menu__label");
    if (label) {
      label.textContent = chrome.i18n.getMessage("micTooltip");
    }
  }
  function handleEditButtonClick() {
    const processingState = getState("processingState");
    if (processingState && processingState !== PROCESSING_STATE.IDLE) {
      showStatus4("statusProcessingInProgress");
      return;
    }
    setState("processingState", PROCESSING_STATE.EDITING);
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
      const lastClickedInput = getState("lastClickedInput");
      publish(EVENTS.INPUT_FIELD_FOUND);
      targetElement = lastClickedInput && isInputElement(lastClickedInput) ? lastClickedInput : getState("currentInputElement");
      if (targetElement) {
        targetElement.focus();
        showStatus4("statusInputFound");
      } else {
        showStatus4("statusEditFound");
        return;
      }
    }
    const currentText = targetElement.isContentEditable ? targetElement.textContent : targetElement.value;
    if (!currentText || currentText.trim() === "") {
      showStatus4("statusEditEmpty");
      return;
    }
    const apiKey = getState("apiKey");
    if (!apiKey || apiKey.trim() === "") {
      showStatus4("statusApiKeyMissing");
      publish(EVENTS.SETTINGS_MODAL_TOGGLED);
      return;
    }
    setState("isEditing", true);
    showStatus4("statusEditListening", void 0, true);
    const targetInputElement = targetElement;
    startEditInstructionRecognition(targetInputElement);
  }
  function startEditInstructionRecognition(targetElement) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const error = createError(
        ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED,
        null,
        null,
        null,
        ERROR_SEVERITY.ERROR
      );
      handleError(error, true, true, "speech");
      setState("isEditing", false);
      return;
    }
    if (recognitionInstance) {
      try {
        recognitionInstance.stop();
      } catch (e) {
        console.warn("Previous recognition stop error:", e);
      }
    }
    const recognition = new SpeechRecognition();
    recognitionInstance = recognition;
    recognition.lang = getState("recognitionLang");
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    const statusElem = document.querySelector(".otak-voice-status");
    if (statusElem) {
      statusElem.textContent = chrome.i18n.getMessage("statusEditListening");
      statusElem.style.display = "block";
      statusElem.classList.add("otak-voice-status--processing");
    }
    recognition.onstart = function() {
      setState("isListening", true);
      updateMicButtonState(true);
    };
    recognition.onresult = function(event) {
      const results = event.results;
      const result = results[results.length - 1];
      const transcript = result[0].transcript;
      if (!result.isFinal) {
        if (statusElem) {
          statusElem.textContent = chrome.i18n.getMessage("statusEditListeningInterim") + ": " + transcript;
        }
        return;
      }
      const instruction = transcript.trim();
      if (!instruction) {
        showStatus4("statusEditInstructionEmpty");
        setState("isEditing", false);
        setState("processingState", PROCESSING_STATE.IDLE);
        return;
      }
      if (statusElem) {
        statusElem.classList.remove("otak-voice-status--processing");
      }
      showStatus4("statusEditInstructionReceived");
      console.log("Edit instruction:", instruction);
      processEditInstruction(instruction, targetElement);
    };
    recognition.onerror = function(event) {
      const errorCode = mapSpeechErrorToErrorCode(event.error);
      const error = createError(errorCode, null, null, { originalError: event.error });
      handleError(error, true, false, "speech");
      setState("isEditing", false);
      setState("isListening", false);
      updateMicButtonState(false);
      setState("processingState", PROCESSING_STATE.IDLE);
      if (statusElem) {
        statusElem.classList.remove("otak-voice-status--processing");
      }
    };
    recognition.onend = function() {
      setState("isListening", false);
      updateMicButtonState(false);
      if (statusElem) {
        statusElem.classList.remove("otak-voice-status--processing");
      }
    };
    try {
      recognition.start();
      showStatus4("statusEditListening");
    } catch (e) {
      console.error(chrome.i18n.getMessage("logSpeechStartError"), e);
      showStatus4("statusSpeechStartError");
      setState("isEditing", false);
      setState("processingState", PROCESSING_STATE.IDLE);
    }
  }
  async function processEditInstruction(instruction, targetElement) {
    const activeElement = targetElement || document.activeElement;
    if (!activeElement || !["INPUT", "TEXTAREA"].includes(activeElement.tagName) && !activeElement.isContentEditable) {
      const error = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND,
        null,
        null,
        { elementType: "input field" },
        ERROR_SEVERITY.ERROR
      );
      handleError(error, true, false, "speech");
      setState("isEditing", false);
      setState("isListening", false);
      updateMicButtonState(false);
      setState("processingState", PROCESSING_STATE.IDLE);
      return;
    }
    const currentText = activeElement.isContentEditable ? activeElement.textContent : activeElement.value;
    const apiKey = getState("apiKey");
    if (!apiKey) {
      showStatus4("statusApiKeyMissing");
      console.log(chrome.i18n.getMessage("logApiKeyMissingSkip"));
      setState("isEditing", false);
      setState("isListening", false);
      updateMicButtonState(false);
      setState("processingState", PROCESSING_STATE.IDLE);
      return;
    }
    showStatus4("statusEditing", void 0, true);
    await editWithGPT(currentText, instruction, activeElement);
    setState("isEditing", false);
    setState("isListening", false);
    updateMicButtonState(false);
    setState("processingState", PROCESSING_STATE.IDLE);
  }
  function basicCleanup(text) {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/([、。]){2,}/g, "$1");
    cleaned = cleaned.replace(/\s+([、。])/g, "$1");
    return cleaned;
  }
  function updateRecognitionLanguage(newLang) {
    console.log(`[Speech] Recognition language updated to: ${newLang}`);
    setState("recognitionLang", newLang);
    const isListening = getState("isListening");
    if (isListening) {
      console.log("[Speech] Restarting recognition to apply new language...");
      stopSpeechRecognition();
      setTimeout(() => {
        const currentIsListening = getState("isListening");
        if (!currentIsListening) {
          startSpeechRecognition();
        }
      }, 100);
    }
  }
  function showStatus4(messageKey, substitutions, persistent = false) {
    publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
  }
  function playBeepSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (type === "start") {
        playSiriStartSound(audioContext);
      } else {
        playSiriEndSound(audioContext);
      }
    } catch (e) {
      console.warn("Failed to play sound:", e);
    }
  }
  function playSiriStartSound(audioContext) {
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 2.5;
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(900, audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(1800, audioContext.currentTime + 0.1);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1200, audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(2400, audioContext.currentTime + 0.1);
    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gain1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    masterGain.gain.value = 0.7;
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.2);
    osc2.stop(audioContext.currentTime + 0.2);
  }
  function playSiriEndSound(audioContext) {
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1500;
    filter.Q.value = 2;
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(1800, audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(900, audioContext.currentTime + 0.15);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(2400, audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.15);
    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.02);
    gain1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
    gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
    masterGain.gain.value = 0.7;
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.25);
    osc2.stop(audioContext.currentTime + 0.25);
  }

  // src/content.js
  setState({
    lastRecognizedText: "",
    currentInputElement: null,
    lastClickedInput: null,
    appendMode: false,
    isListening: false,
    isEditing: false
  });
  setState("MENU_ICON", MENU_ICON);
  window.isInputElement = isInputElement;
  window.detectSiteType = detectSiteType;
  async function initVoiceInput() {
    console.log(chrome.i18n.getMessage("logInitializing", "3.1"));
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error(chrome.i18n.getMessage("logSpeechNotSupported"));
      alert(chrome.i18n.getMessage("alertSpeechNotSupported"));
      return;
    }
    await loadMenuState();
    if (!document.getElementById("otak-voice-menu-btn")) {
      console.log("Creating UI elements");
      createUI();
      setupEventListeners();
      updateMenuState();
    } else {
      console.log(chrome.i18n.getMessage("logUiAlreadyExists"));
      updateMenuState();
    }
    console.log(chrome.i18n.getMessage("logInitializationComplete", "3.1"));
  }
  function setupPeriodicSelfHealing() {
    setInterval(() => {
      const menuButton = document.getElementById("otak-voice-menu-btn");
      if (!menuButton) {
        console.warn(chrome.i18n.getMessage("logUiNotFoundHealing"));
        publish(EVENTS.UI_RECOVERY_NEEDED);
        initVoiceInput();
      }
    }, 1e4);
  }
  async function runInitialization() {
    try {
      initializeState();
      setupEventSubscriptions7();
      setupEventSubscriptions6();
      await loadSettings();
      await initInputHandler();
      await initVoiceInput();
      setupDOMObserver();
      setupPeriodicSelfHealing();
      console.log(chrome.i18n.getMessage("logExtensionLoaded"));
      publish(EVENTS.INITIALIZATION_COMPLETE);
    } catch (error) {
      console.error("Initialization error:", error);
      publish(EVENTS.INITIALIZATION_ERROR, error);
    }
  }
  function setupEventSubscriptions7() {
    subscribe(EVENTS.GPT_PROOFREADING_STARTED, () => {
      console.log("Proofreading started via event bus");
    });
    subscribe(EVENTS.SPEECH_RECOGNITION_STARTED, () => {
      console.log("Speech recognition started via event bus");
    });
    subscribe(EVENTS.SPEECH_RECOGNITION_STOPPED, () => {
      console.log("Speech recognition stopped via event bus");
    });
    subscribe(EVENTS.SETTINGS_LOADED, (settings) => {
      console.log("Settings loaded via event bus");
    });
  }
  runInitialization();
})();
