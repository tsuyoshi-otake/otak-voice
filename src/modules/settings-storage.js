/** Settings Storage Module - load/save functionality and event subscriptions */

import {
  API_KEY_STORAGE_KEY, RECOGNITION_LANG_STORAGE_KEY,
  AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY, AUTO_CORRECTION_STORAGE_KEY,
  USE_HISTORY_CONTEXT_STORAGE_KEY, THEME_STORAGE_KEY,
  AUTO_CORRECTION_PROMPT_STORAGE_KEY, PROOFREADING_PROMPT_STORAGE_KEY,
  SHOW_MODAL_WINDOW_STORAGE_KEY,
  SILENCE_TIMEOUT_STORAGE_KEY, DEFAULT_SETTINGS
} from '../constants.js';
import { SETTINGS_SCHEMA, getAllStorageKeys, validateSetting } from './settings-schema.js';
import { getState, setState } from './state.js';
import { publish, publishStatus as showStatus, subscribe, EVENTS } from './event-bus.js';
import {
  createError, handleError, tryCatch,
  ERROR_CATEGORY, ERROR_CODE, ERROR_SEVERITY
} from './error-handler.js';
import { applyTheme } from './settings-theme.js';

/** Set up event subscriptions for settings module */
function setupEventSubscriptions() {
  // Subscribe to settings saved event
  subscribe(EVENTS.SETTINGS_SAVED, () => {
    console.log('Settings save button clicked');
    const apiKeyInput = document.getElementById('api-key-input');
    const langSelect = document.getElementById('recognition-lang-select');
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    const themeSelect = document.getElementById('theme-select');
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    const silenceTimeoutInput = document.getElementById('silence-timeout-input');
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
      themeMode: themeSelect ? themeSelect.value : getState('themeMode'),
      silenceTimeout: silenceTimeoutInput ? parseInt(silenceTimeoutInput.value, 10) || DEFAULT_SETTINGS.SILENCE_TIMEOUT : getState('silenceTimeout') || DEFAULT_SETTINGS.SILENCE_TIMEOUT,
      autoCorrectionPrompt: autoCorrectionPromptTextarea ? autoCorrectionPromptTextarea.value : getState('autoCorrectionPrompt'),
      proofreadingPrompt: proofreadingPromptTextarea ? proofreadingPromptTextarea.value : getState('proofreadingPrompt')
    };
    chrome.storage.sync.set({
      [API_KEY_STORAGE_KEY]: settings.apiKey,
      [RECOGNITION_LANG_STORAGE_KEY]: settings.recognitionLang,
      [AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY]: settings.autoDetectInputFields,
      [AUTO_CORRECTION_STORAGE_KEY]: settings.autoCorrection,
      [USE_HISTORY_CONTEXT_STORAGE_KEY]: settings.useHistoryContext,
      [SHOW_MODAL_WINDOW_STORAGE_KEY]: settings.showModalWindow,
      [THEME_STORAGE_KEY]: settings.themeMode,
      [SILENCE_TIMEOUT_STORAGE_KEY]: settings.silenceTimeout,
      [AUTO_CORRECTION_PROMPT_STORAGE_KEY]: settings.autoCorrectionPrompt,
      [PROOFREADING_PROMPT_STORAGE_KEY]: settings.proofreadingPrompt
    }, () => {
      showStatus('statusSettingsSaveSuccess');
      const modal = document.querySelector('.otak-voice-settings');
      if (modal) {
        modal.style.display = 'none';
      }
      setState(settings);
      if (settings.themeMode) {
        applyTheme(settings.themeMode);
      }
      const modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
      if (modalToggleButton) {
        if (settings.showModalWindow) {
          modalToggleButton.classList.remove('otak-voice-menu__modal-toggle-btn--active');
        } else {
          modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
        }
      }
    });
  });
  // Subscribe to settings modal toggled event
  subscribe(EVENTS.SETTINGS_MODAL_TOGGLED, () => {
    console.log('Settings modal toggled');
  });
}

/** Load settings from storage - @returns {Promise<Object>} Settings object */
async function loadSettings() {
  return tryCatch(
    async () => {
      const storageKeys = getAllStorageKeys();
      const result = await chrome.storage.sync.get(storageKeys);
      const settings = {};
      Object.entries(SETTINGS_SCHEMA).forEach(([settingName, schema]) => {
        const storageValue = result[schema.key];
        settings[settingName] = storageValue !== undefined ? storageValue : schema.default;
      });
      if (settings.silenceTimeout === undefined) {
        settings.silenceTimeout = DEFAULT_SETTINGS.SILENCE_TIMEOUT;
      }
      setState(settings);
      console.log(chrome.i18n.getMessage('logSettingsLoaded'), {
        apiKey: settings.apiKey ? chrome.i18n.getMessage('logApiKeySet') : chrome.i18n.getMessage('logApiKeyNotSet'),
        language: settings.recognitionLang,
        autoDetect: settings.autoDetectInputFields ? 'On' : 'Off',
        autoCorrection: settings.autoCorrection ? 'On' : 'Off',
        useHistoryContext: settings.useHistoryContext ? 'On' : 'Off',
        showModalWindow: settings.showModalWindow ? 'On' : 'Off',
        theme: settings.themeMode
      });
      if (typeof window !== 'undefined') {
        applyTheme(settings.themeMode);
        if (getState('isListening')) {
          publish(EVENTS.SPEECH_RECOGNITION_STOPPED);
        }
      }
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

/** Save a single setting - @returns {Promise<boolean>} Success status */
async function saveSetting(settingName, value) {
  return tryCatch(
    async () => {
      if (!SETTINGS_SCHEMA[settingName]) {
        throw createError(
          ERROR_CODE[ERROR_CATEGORY.INPUT].VALIDATION_FAILED,
          `Invalid setting name: ${settingName}`,
          null, { settingName }, ERROR_SEVERITY.ERROR
        );
      }
      if (!validateSetting(settingName, value)) {
        throw createError(
          ERROR_CODE[ERROR_CATEGORY.INPUT].VALIDATION_FAILED,
          chrome.i18n.getMessage(SETTINGS_SCHEMA[settingName].errorMessage),
          null, { settingName, value }, ERROR_SEVERITY.ERROR
        );
      }
      const storageKey = SETTINGS_SCHEMA[settingName].key;
      await chrome.storage.sync.set({ [storageKey]: value });
      setState(settingName, value);
      if (settingName === 'themeMode') {
        applyTheme(value);
      } else if (settingName === 'recognitionLang') {
        publish(EVENTS.LANGUAGE_UPDATED, value);
      }
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

/** Save multiple settings at once - @returns {Promise<boolean>} Success status */
async function saveSettings(settings = null) {
  return tryCatch(
    async () => {
      const settingsToSave = settings || getSettingsFromUI();
      if (!settingsToSave) {
        return false;
      }
      const invalidSettings = Object.entries(settingsToSave)
        .filter(([name, value]) => !validateSetting(name, value));
      if (invalidSettings.length > 0) {
        const [name, value] = invalidSettings[0];
        throw createError(
          ERROR_CODE[ERROR_CATEGORY.INPUT].VALIDATION_FAILED,
          chrome.i18n.getMessage(SETTINGS_SCHEMA[name].errorMessage),
          null, { settingName: name, value }, ERROR_SEVERITY.ERROR
        );
      }
      const storageObject = {};
      Object.entries(settingsToSave).forEach(([name, value]) => {
        storageObject[SETTINGS_SCHEMA[name].key] = value;
      });
      await chrome.storage.sync.set(storageObject);
      setState(settingsToSave);
      if (settingsToSave.themeMode) {
        applyTheme(settingsToSave.themeMode);
      }
      if (settingsToSave.recognitionLang) {
        publish(EVENTS.LANGUAGE_UPDATED, settingsToSave.recognitionLang);
      }
      console.log(chrome.i18n.getMessage('logSettingsSaved'), {
        apiKey: settingsToSave.apiKey ? 'Set' : 'Not Set',
        language: settingsToSave.recognitionLang,
        autoDetect: settingsToSave.autoDetectInputFields ? 'On' : 'Off',
        autoCorrection: settingsToSave.autoCorrection ? 'On' : 'Off',
        useHistoryContext: settingsToSave.useHistoryContext ? 'On' : 'Off',
        showModalWindow: settingsToSave.showModalWindow ? 'On' : 'Off',
        theme: settingsToSave.themeMode
      });
      showStatus('statusSettingsSaveSuccess');
      const modal = document.querySelector('.otak-voice-settings');
      if (modal) {
        modal.style.display = 'none';
      }
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

/** Get settings from UI elements - @returns {Object|null} Settings or null */
function getSettingsFromUI() {
  const apiKeyInput = document.getElementById('api-key-input');
  const langSelect = document.getElementById('recognition-lang-select');
  if (!apiKeyInput || !langSelect) {
    handleError(
      createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND,
        'Required settings UI elements not found',
        null, null, ERROR_SEVERITY.ERROR
      ),
      true, false, 'settings'
    );
    return null;
  }
  const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
  const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
  const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
  const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
  const silenceTimeoutInput = document.getElementById('silence-timeout-input');
  const themeSelect = document.getElementById('theme-select');
  const autoCorrectionPromptTextarea = document.getElementById('auto-correction-prompt-textarea');
  const proofreadingPromptTextarea = document.getElementById('proofreading-prompt-textarea');
  const currentState = getState();
  return {
    apiKey: apiKeyInput.value.trim(),
    recognitionLang: langSelect.value,
    autoDetectInputFields: autoDetectCheckbox ? autoDetectCheckbox.checked : currentState.autoDetectInputFields,
    autoCorrection: autoCorrectionCheckbox ? autoCorrectionCheckbox.checked : currentState.autoCorrection,
    useHistoryContext: useHistoryContextCheckbox ? useHistoryContextCheckbox.checked : currentState.useHistoryContext,
    showModalWindow: showModalWindowCheckbox ? showModalWindowCheckbox.checked : currentState.showModalWindow,
    themeMode: themeSelect ? themeSelect.value : currentState.themeMode,
    silenceTimeout: silenceTimeoutInput ? parseInt(silenceTimeoutInput.value, 10) || DEFAULT_SETTINGS.SILENCE_TIMEOUT : currentState.silenceTimeout || DEFAULT_SETTINGS.SILENCE_TIMEOUT,
    autoCorrectionPrompt: autoCorrectionPromptTextarea ? autoCorrectionPromptTextarea.value : currentState.autoCorrectionPrompt,
    proofreadingPrompt: proofreadingPromptTextarea ? proofreadingPromptTextarea.value : currentState.proofreadingPrompt
  };
}

// Set up event subscriptions - call after all functions are defined
setupEventSubscriptions();

export { loadSettings, saveSetting, saveSettings, getSettingsFromUI, setupEventSubscriptions, showStatus };
