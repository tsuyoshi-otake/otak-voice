/**
 * Settings Management Module
 * Provides a unified Promise-based API for managing extension settings
 * with consistent error handling and type validation
 */

import {
  API_KEY_STORAGE_KEY,
  RECOGNITION_LANG_STORAGE_KEY,
  AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY,
  AUTO_CORRECTION_STORAGE_KEY,
  USE_HISTORY_CONTEXT_STORAGE_KEY,
  THEME_STORAGE_KEY,
  AUTO_CORRECTION_PROMPT_STORAGE_KEY,
  PROOFREADING_PROMPT_STORAGE_KEY,
  SHOW_MODAL_WINDOW_STORAGE_KEY,
  AUTO_SUBMIT_STORAGE_KEY,
  SILENCE_TIMEOUT_STORAGE_KEY,
  DEFAULT_SETTINGS,
  THEME_MODES
} from '../constants.js';
import { getState, setState } from './state.js';
import { publish, subscribe, EVENTS } from './event-bus.js';
import {
  createError,
  handleError,
  tryCatch,
  ERROR_CATEGORY,
  ERROR_CODE,
  ERROR_SEVERITY
} from './error-handler.js';

/**
 * Set up event subscriptions for settings module
 */
function setupEventSubscriptions() {
  // Subscribe to settings saved event
  subscribe(EVENTS.SETTINGS_SAVED, () => {
    // 設定保存ボタンがクリックされたときの処理
    console.log('Settings save button clicked');
    
    // 設定を保存
    const apiKeyInput = document.getElementById('api-key-input');
    const langSelect = document.getElementById('recognition-lang-select');
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    const themeSelect = document.getElementById('theme-select');
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
    const silenceTimeoutInput = document.getElementById('silence-timeout-input');
    // const clearExistingTextCheckbox = document.getElementById('clear-existing-text-checkbox');
    const autoCorrectionPromptTextarea = document.getElementById('auto-correction-prompt-textarea');
    const proofreadingPromptTextarea = document.getElementById('proofreading-prompt-textarea');
    
    if (!apiKeyInput || !langSelect) {
      showStatus('statusSettingsSaveError');
      return;
    }
    
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      recognitionLang: langSelect.value,
      autoDetectInputFields: autoDetectCheckbox ? autoDetectCheckbox.checked : getState('autoDetectInputFields'),
      autoCorrection: autoCorrectionCheckbox ? autoCorrectionCheckbox.checked : getState('autoCorrection'),
      useHistoryContext: useHistoryContextCheckbox ? useHistoryContextCheckbox.checked : getState('useHistoryContext'),
      showModalWindow: showModalWindowCheckbox ? showModalWindowCheckbox.checked : getState('showModalWindow'),
      // 自動送信の状態をチェックボックスと一致させる（チェックがONの場合は自動送信をON、チェックがOFFの場合は自動送信をOFF）
      autoSubmit: autoSubmitCheckbox ? autoSubmitCheckbox.checked : getState('autoSubmit'),
      // clearExistingText: clearExistingTextCheckbox ? clearExistingTextCheckbox.checked : getState('clearExistingText'),
      themeMode: themeSelect ? themeSelect.value : getState('themeMode'),
      silenceTimeout: silenceTimeoutInput ? parseInt(silenceTimeoutInput.value, 10) || DEFAULT_SETTINGS.SILENCE_TIMEOUT : getState('silenceTimeout') || DEFAULT_SETTINGS.SILENCE_TIMEOUT,
      autoCorrectionPrompt: autoCorrectionPromptTextarea ? autoCorrectionPromptTextarea.value : getState('autoCorrectionPrompt'),
      proofreadingPrompt: proofreadingPromptTextarea ? proofreadingPromptTextarea.value : getState('proofreadingPrompt')
    };
    
    // 設定を保存
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
      // 保存成功
      showStatus('statusSettingsSaveSuccess');
      
      // 設定モーダルを閉じる
      const modal = document.querySelector('.otak-voice-settings');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // 状態を更新
      setState(settings);
      
      // テーマを適用
      if (settings.themeMode) {
        applyTheme(settings.themeMode);
      }
      
      // モーダルウィンドウ表示ボタンの状態を更新
      const modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
      if (modalToggleButton) {
        if (settings.showModalWindow) {
          modalToggleButton.classList.remove('otak-voice-menu__modal-toggle-btn--active');
        } else {
          modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
        }
      }
      
      // 自動送信ボタンの状態を更新
      const autoSubmitButton = document.querySelector('.otak-voice-menu__append-btn');
      if (autoSubmitButton) {
        // input-handler.jsのupdateAutoSubmitButtonState関数を直接呼び出すことはできないため、
        // 状態を更新してイベントを発行する
        setState('autoSubmit', settings.autoSubmit);
        publish(EVENTS.AUTO_SUBMIT_STATE_CHANGED, settings.autoSubmit);
      }
    });
  });
  
  // Subscribe to settings modal toggled event
  subscribe(EVENTS.SETTINGS_MODAL_TOGGLED, () => {
    // 設定モーダルが表示/非表示になったときの処理
    console.log('Settings modal toggled');
  });
}

// Set up event subscriptions - call after function definition

/**
 * Settings schema definition with types and validation rules
 * @typedef {Object} SettingsSchema
 * @property {Object} apiKey - API key setting definition
 * @property {Object} recognitionLang - Recognition language setting definition
 * @property {Object} autoDetectInputFields - Auto-detect input fields setting definition
 * @property {Object} autoCorrection - Auto-correction setting definition
 * @property {Object} useHistoryContext - Use history context setting definition
 * @property {Object} themeMode - Theme mode setting definition
 */
const SETTINGS_SCHEMA = {
  apiKey: {
    key: API_KEY_STORAGE_KEY,
    type: 'string',
    default: '',
    validate: (value) => value === '' || value.startsWith('sk-'),
    errorMessage: 'alertApiKeyInvalid'
  },
  recognitionLang: {
    key: RECOGNITION_LANG_STORAGE_KEY,
    type: 'string',
    default: DEFAULT_SETTINGS.RECOGNITION_LANG,
    validate: (value) => typeof value === 'string' && value.length > 0,
    errorMessage: 'errorInvalidLanguage'
  },
  autoDetectInputFields: {
    key: AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY,
    type: 'boolean',
    default: DEFAULT_SETTINGS.AUTO_DETECT_INPUT_FIELDS,
    validate: (value) => typeof value === 'boolean',
    errorMessage: 'errorInvalidBooleanSetting'
  },
  autoCorrection: {
    key: AUTO_CORRECTION_STORAGE_KEY,
    type: 'boolean',
    default: DEFAULT_SETTINGS.AUTO_CORRECTION,
    validate: (value) => typeof value === 'boolean',
    errorMessage: 'errorInvalidBooleanSetting'
  },
  useHistoryContext: {
    key: USE_HISTORY_CONTEXT_STORAGE_KEY,
    type: 'boolean',
    default: DEFAULT_SETTINGS.USE_HISTORY_CONTEXT,
    validate: (value) => typeof value === 'boolean',
    errorMessage: 'errorInvalidBooleanSetting'
  },
  themeMode: {
    key: THEME_STORAGE_KEY,
    type: 'string',
    default: DEFAULT_SETTINGS.THEME,
    validate: (value) => value === THEME_MODES.DARK || value === THEME_MODES.LIGHT,
    errorMessage: 'errorInvalidTheme'
  },
  showModalWindow: {
    key: SHOW_MODAL_WINDOW_STORAGE_KEY,
    type: 'boolean',
    default: DEFAULT_SETTINGS.SHOW_MODAL_WINDOW,
    validate: (value) => typeof value === 'boolean',
    errorMessage: 'errorInvalidBooleanSetting'
  },
  autoSubmit: {
    key: AUTO_SUBMIT_STORAGE_KEY,
    type: 'boolean',
    default: DEFAULT_SETTINGS.AUTO_SUBMIT,
    validate: (value) => typeof value === 'boolean',
    errorMessage: 'errorInvalidBooleanSetting'
  },
  silenceTimeout: {
    key: SILENCE_TIMEOUT_STORAGE_KEY,
    type: 'number',
    default: DEFAULT_SETTINGS.SILENCE_TIMEOUT,
    validate: (value) => typeof value === 'number' && value >= 500 && value <= 10000,
    errorMessage: 'errorInvalidSilenceTimeout'
  },
  autoCorrectionPrompt: {
    key: AUTO_CORRECTION_PROMPT_STORAGE_KEY,
    type: 'string',
    default: DEFAULT_SETTINGS.AUTO_CORRECTION_PROMPT,
    validate: (value) => typeof value === 'string' && value.length > 0,
    errorMessage: 'errorInvalidPrompt'
  },
  proofreadingPrompt: {
    key: PROOFREADING_PROMPT_STORAGE_KEY,
    type: 'string',
    default: DEFAULT_SETTINGS.PROOFREADING_PROMPT,
    validate: (value) => typeof value === 'string' && value.length > 0,
    errorMessage: 'errorInvalidPrompt'
  }
};

/**
 * Get all storage keys defined in the settings schema
 * @returns {string[]} Array of storage keys
 */
function getAllStorageKeys() {
  return Object.values(SETTINGS_SCHEMA).map(setting => setting.key);
}

/**
 * Validate a single setting value against its schema
 * @param {string} settingName - Name of the setting to validate
 * @param {any} value - Value to validate
 * @returns {boolean} Whether the value is valid
 */
function validateSetting(settingName, value) {
  const schema = SETTINGS_SCHEMA[settingName];
  if (!schema) {
    return false;
  }
  return schema.validate(value);
}

/**
 * Load settings from storage
 * @returns {Promise<Object>} Settings object
 */
export async function loadSettings() {
  return tryCatch(
    async () => {
      // Get all settings from storage
      const storageKeys = getAllStorageKeys();
      const result = await chrome.storage.sync.get(storageKeys);
      
      // Map storage values to settings object with defaults
      const settings = {};
      Object.entries(SETTINGS_SCHEMA).forEach(([settingName, schema]) => {
        const storageValue = result[schema.key];
        // Use nullish coalescing to handle boolean false values correctly
        settings[settingName] = storageValue !== undefined ? storageValue : schema.default;
      });
      
      // Ensure silenceTimeout has a value (for backward compatibility)
      if (settings.silenceTimeout === undefined) {
        settings.silenceTimeout = DEFAULT_SETTINGS.SILENCE_TIMEOUT;
      }
      
      // Update state with settings
      setState(settings);
      
      // Log settings loaded
      console.log(chrome.i18n.getMessage('logSettingsLoaded'), {
        apiKey: settings.apiKey ? chrome.i18n.getMessage('logApiKeySet') : chrome.i18n.getMessage('logApiKeyNotSet'),
        language: settings.recognitionLang,
        autoDetect: settings.autoDetectInputFields ? 'On' : 'Off',
        autoCorrection: settings.autoCorrection ? 'On' : 'Off',
        useHistoryContext: settings.useHistoryContext ? 'On' : 'Off',
        showModalWindow: settings.showModalWindow ? 'On' : 'Off',
        theme: settings.themeMode
      });
      
      // Apply theme if in browser context
      if (typeof window !== 'undefined') {
        applyTheme(settings.themeMode);
        publish(EVENTS.SPEECH_RECOGNITION_STOPPED);
      }
      
      // Publish settings loaded event
      publish(EVENTS.SETTINGS_LOADED, settings);
      
      return settings;
    },
    {
      errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
      showNotification: true,
      source: 'settings'
    }
  );
}

/**
 * Save a single setting
 * @param {string} settingName - Name of the setting to save
 * @param {any} value - Value to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveSetting(settingName, value) {
  return tryCatch(
    async () => {
      // Validate setting
      if (!SETTINGS_SCHEMA[settingName]) {
        throw createError(
          ERROR_CODE[ERROR_CATEGORY.INPUT].INVALID_API_KEY_FORMAT,
          `Invalid setting name: ${settingName}`,
          null,
          { settingName },
          ERROR_SEVERITY.ERROR
        );
      }
      
      // Validate value
      if (!validateSetting(settingName, value)) {
        throw createError(
          ERROR_CODE[ERROR_CATEGORY.INPUT].INVALID_API_KEY_FORMAT,
          chrome.i18n.getMessage(SETTINGS_SCHEMA[settingName].errorMessage),
          null,
          { settingName, value },
          ERROR_SEVERITY.ERROR
        );
      }
      
      // Save to storage
      const storageKey = SETTINGS_SCHEMA[settingName].key;
      await chrome.storage.sync.set({ [storageKey]: value });
      
      // Update state
      setState(settingName, value);
      
      // Handle special cases
      if (settingName === 'themeMode') {
        applyTheme(value);
      } else if (settingName === 'recognitionLang') {
        publish(EVENTS.LANGUAGE_UPDATED, value);
      }
      
      // Log success
      console.log(chrome.i18n.getMessage('logSettingSaved'), { [settingName]: value });
      
      return true;
    },
    {
      errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
      showNotification: true,
      source: 'settings'
    }
  );
}

/**
 * Save multiple settings at once
 * @param {Object} settings - Object containing settings to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveSettings(settings = null) {
  return tryCatch(
    async () => {
      // If settings object is provided, use it
      // Otherwise, get settings from UI elements
      const settingsToSave = settings || getSettingsFromUI();
      if (!settingsToSave) {
        return false;
      }
      
      // Validate all settings
      const invalidSettings = Object.entries(settingsToSave)
        .filter(([name, value]) => !validateSetting(name, value));
      
      if (invalidSettings.length > 0) {
        const [name, value] = invalidSettings[0];
        throw createError(
          ERROR_CODE[ERROR_CATEGORY.INPUT].INVALID_API_KEY_FORMAT,
          chrome.i18n.getMessage(SETTINGS_SCHEMA[name].errorMessage),
          null,
          { settingName: name, value },
          ERROR_SEVERITY.ERROR
        );
      }
      
      // Prepare storage object
      const storageObject = {};
      Object.entries(settingsToSave).forEach(([name, value]) => {
        storageObject[SETTINGS_SCHEMA[name].key] = value;
      });
      
      // Save to storage
      await chrome.storage.sync.set(storageObject);
      
      // Update state
      setState(settingsToSave);
      
      // Handle special cases
      if (settingsToSave.themeMode) {
        applyTheme(settingsToSave.themeMode);
      }
      if (settingsToSave.recognitionLang) {
        publish(EVENTS.LANGUAGE_UPDATED, settingsToSave.recognitionLang);
      }
      
      // Log success
      console.log(chrome.i18n.getMessage('logSettingsSaved'), {
        apiKey: settingsToSave.apiKey ? 'Set' : 'Not Set',
        language: settingsToSave.recognitionLang,
        autoDetect: settingsToSave.autoDetectInputFields ? 'On' : 'Off',
        autoCorrection: settingsToSave.autoCorrection ? 'On' : 'Off',
        useHistoryContext: settingsToSave.useHistoryContext ? 'On' : 'Off',
        showModalWindow: settingsToSave.showModalWindow ? 'On' : 'Off',
        theme: settingsToSave.themeMode
      });
      
      // Show success message
      showStatus('statusSettingsSaveSuccess');
      
      // Close modal
      const modal = document.querySelector('.otak-voice-settings');
      if (modal) {
        modal.style.display = 'none';
      }
      
      // Publish settings saved event
      publish(EVENTS.SETTINGS_SAVED, settingsToSave);
      
      return true;
    },
    {
      errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
      showNotification: true,
      source: 'settings'
    }
  );
}

/**
 * Get settings from UI elements
 * @returns {Object|null} Settings object or null if required elements are missing
 */
function getSettingsFromUI() {
  const apiKeyInput = document.getElementById('api-key-input');
  const langSelect = document.getElementById('recognition-lang-select');
  
  // Check required elements
  if (!apiKeyInput || !langSelect) {
    handleError(
      createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND,
        'Required settings UI elements not found',
        null,
        null,
        ERROR_SEVERITY.ERROR
      ),
      true,
      false,
      'settings'
    );
    return null;
  }
  
  // Get optional elements
  const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
  const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
  const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
  const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
  const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
  const silenceTimeoutInput = document.getElementById('silence-timeout-input');
  // const clearExistingTextCheckbox = document.getElementById('clear-existing-text-checkbox');
  const themeSelect = document.getElementById('theme-select');
  const autoCorrectionPromptTextarea = document.getElementById('auto-correction-prompt-textarea');
  const proofreadingPromptTextarea = document.getElementById('proofreading-prompt-textarea');
  
  // Get current state values for fallbacks
  const currentState = getState();
  
  // Build settings object
  return {
    apiKey: apiKeyInput.value.trim(),
    recognitionLang: langSelect.value,
    autoDetectInputFields: autoDetectCheckbox ? autoDetectCheckbox.checked : currentState.autoDetectInputFields,
    autoCorrection: autoCorrectionCheckbox ? autoCorrectionCheckbox.checked : currentState.autoCorrection,
    useHistoryContext: useHistoryContextCheckbox ? useHistoryContextCheckbox.checked : currentState.useHistoryContext,
    showModalWindow: showModalWindowCheckbox ? showModalWindowCheckbox.checked : currentState.showModalWindow, // チェックボックスの状態を反映
    autoSubmit: autoSubmitCheckbox ? autoSubmitCheckbox.checked : currentState.autoSubmit, // 自動送信の設定を追加
    // clearExistingText: clearExistingTextCheckbox ? clearExistingTextCheckbox.checked : currentState.clearExistingText, // 入力済み文字列の削除設定を追加
    themeMode: themeSelect ? themeSelect.value : currentState.themeMode,
    silenceTimeout: silenceTimeoutInput ? parseInt(silenceTimeoutInput.value, 10) || DEFAULT_SETTINGS.SILENCE_TIMEOUT : currentState.silenceTimeout || DEFAULT_SETTINGS.SILENCE_TIMEOUT,
    autoCorrectionPrompt: autoCorrectionPromptTextarea ? autoCorrectionPromptTextarea.value : currentState.autoCorrectionPrompt,
    proofreadingPrompt: proofreadingPromptTextarea ? proofreadingPromptTextarea.value : currentState.proofreadingPrompt
  };
}

/**
 * Toggle theme between light and dark
 * @returns {Promise<boolean>} Success status
 */
export async function toggleTheme() {
  return tryCatch(
    async () => {
      // Get current theme and determine new theme
      const currentTheme = getState('themeMode');
      const newTheme = currentTheme === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;
      
      // Save new theme
      await saveSetting('themeMode', newTheme);
      
      // Show status message
      showStatus(newTheme === THEME_MODES.DARK ? 'statusThemeDark' : 'statusThemeLight');
      
      return true;
    },
    {
      errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
      showNotification: true,
      source: 'settings'
    }
  );
}

/**
 * Apply theme to UI elements
 * @param {string} theme - Theme to apply (THEME_MODES.DARK or THEME_MODES.LIGHT)
 * @param {boolean} skipDomOperations - Skip DOM operations (useful for testing)
 * @returns {string} The applied theme
 */
export function applyTheme(theme, skipDomOperations = false) {
  // Validate theme
  if (theme !== THEME_MODES.DARK && theme !== THEME_MODES.LIGHT) {
    console.warn(`Invalid theme: ${theme}, using default`);
    theme = DEFAULT_SETTINGS.THEME;
  }
  
  // Skip DOM operations if requested (for testing)
  // or if we're not in a browser environment
  if (skipDomOperations || typeof document === 'undefined') {
    return theme;
  }
  
  try {
    // Apply theme to document root
    if (document.documentElement) {
      document.documentElement.setAttribute('data-otak-theme', theme);
    }
    
    // Update theme select in settings modal
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = theme;
    }
    
    // Update theme toggle button
    const themeToggleBtn = document.querySelector('.otak-voice-menu__theme-toggle-btn');
    if (themeToggleBtn) {
      if (theme === THEME_MODES.LIGHT) {
        themeToggleBtn.classList.add('otak-voice-menu__theme-toggle-btn--active');
        themeToggleBtn.title = chrome.i18n.getMessage('themeToggleToDark');
      } else {
        themeToggleBtn.classList.remove('otak-voice-menu__theme-toggle-btn--active');
        themeToggleBtn.title = chrome.i18n.getMessage('themeToggleToLight');
      }
    }
    
    // Apply theme to recognition modal
    const recognitionModal = document.querySelector('.otak-voice-recognition');
    if (recognitionModal) {
      recognitionModal.setAttribute('data-theme', theme);
    }
  } catch (error) {
    console.error('Error applying theme:', error);
    // Don't throw the error, just log it to avoid breaking the app
  }
  
  return theme;
}

/**
 * Status display function - proxy to avoid circular dependencies
 * @param {string} messageKey - i18n key for the message to display
 * @param {string|undefined} substitutions - Replacement string in the message
 * @param {boolean} persistent - Whether to display persistently
 */
function showStatus(messageKey, substitutions, persistent = false) {
  publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
}

// Set up event subscriptions - call after all functions are defined
setupEventSubscriptions();
