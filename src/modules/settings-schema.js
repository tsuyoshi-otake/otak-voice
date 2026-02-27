/**
 * Settings Schema Module
 * Defines the settings schema and provides validation utilities
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
  SILENCE_TIMEOUT_STORAGE_KEY,
  DEFAULT_SETTINGS,
  THEME_MODES
} from '../constants.js';

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
    validate: (value) => value === '' || (typeof value === 'string' && value.startsWith('sk-') && value.length >= 6),
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
    validate: (value) => typeof value === 'string',
    errorMessage: 'errorInvalidPrompt'
  },
  proofreadingPrompt: {
    key: PROOFREADING_PROMPT_STORAGE_KEY,
    type: 'string',
    default: DEFAULT_SETTINGS.PROOFREADING_PROMPT,
    validate: (value) => typeof value === 'string',
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

export { SETTINGS_SCHEMA, getAllStorageKeys, validateSetting };
