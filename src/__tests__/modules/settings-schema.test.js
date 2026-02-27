/**
 * @jest-environment jsdom
 */

import { SETTINGS_SCHEMA, getAllStorageKeys, validateSetting } from '../../modules/settings-schema.js';
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
} from '../../constants.js';

describe('settings-schema module', () => {

  // -------------------------------------------------------------------------
  // SETTINGS_SCHEMA structure
  // -------------------------------------------------------------------------
  describe('SETTINGS_SCHEMA', () => {
    test('is defined and is an object', () => {
      expect(SETTINGS_SCHEMA).toBeDefined();
      expect(typeof SETTINGS_SCHEMA).toBe('object');
    });

    const expectedKeys = [
      'apiKey',
      'recognitionLang',
      'autoDetectInputFields',
      'autoCorrection',
      'useHistoryContext',
      'themeMode',
      'showModalWindow',
      'silenceTimeout',
      'autoCorrectionPrompt',
      'proofreadingPrompt'
    ];

    test.each(expectedKeys)('contains setting "%s"', (key) => {
      expect(SETTINGS_SCHEMA).toHaveProperty(key);
    });

    test('each entry has key, type, default, validate, and errorMessage fields', () => {
      for (const [name, def] of Object.entries(SETTINGS_SCHEMA)) {
        expect(def).toHaveProperty('key', expect.any(String));
        expect(def).toHaveProperty('type');
        expect(def).toHaveProperty('default');
        expect(def).toHaveProperty('validate');
        expect(def).toHaveProperty('errorMessage');
        expect(typeof def.validate).toBe('function');
      }
    });

    test('each setting maps to the correct storage key constant', () => {
      expect(SETTINGS_SCHEMA.apiKey.key).toBe(API_KEY_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.recognitionLang.key).toBe(RECOGNITION_LANG_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.autoDetectInputFields.key).toBe(AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.autoCorrection.key).toBe(AUTO_CORRECTION_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.useHistoryContext.key).toBe(USE_HISTORY_CONTEXT_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.themeMode.key).toBe(THEME_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.showModalWindow.key).toBe(SHOW_MODAL_WINDOW_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.silenceTimeout.key).toBe(SILENCE_TIMEOUT_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.autoCorrectionPrompt.key).toBe(AUTO_CORRECTION_PROMPT_STORAGE_KEY);
      expect(SETTINGS_SCHEMA.proofreadingPrompt.key).toBe(PROOFREADING_PROMPT_STORAGE_KEY);
    });

    test('default values match DEFAULT_SETTINGS constants', () => {
      expect(SETTINGS_SCHEMA.apiKey.default).toBe('');
      expect(SETTINGS_SCHEMA.recognitionLang.default).toBe(DEFAULT_SETTINGS.RECOGNITION_LANG);
      expect(SETTINGS_SCHEMA.autoDetectInputFields.default).toBe(DEFAULT_SETTINGS.AUTO_DETECT_INPUT_FIELDS);
      expect(SETTINGS_SCHEMA.autoCorrection.default).toBe(DEFAULT_SETTINGS.AUTO_CORRECTION);
      expect(SETTINGS_SCHEMA.useHistoryContext.default).toBe(DEFAULT_SETTINGS.USE_HISTORY_CONTEXT);
      expect(SETTINGS_SCHEMA.themeMode.default).toBe(DEFAULT_SETTINGS.THEME);
      expect(SETTINGS_SCHEMA.showModalWindow.default).toBe(DEFAULT_SETTINGS.SHOW_MODAL_WINDOW);
      expect(SETTINGS_SCHEMA.silenceTimeout.default).toBe(DEFAULT_SETTINGS.SILENCE_TIMEOUT);
    });
  });

  // -------------------------------------------------------------------------
  // getAllStorageKeys
  // -------------------------------------------------------------------------
  describe('getAllStorageKeys', () => {
    test('returns an array with one entry per schema setting', () => {
      const keys = getAllStorageKeys();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys).toHaveLength(Object.keys(SETTINGS_SCHEMA).length);
    });

    test('contains all storage key constants', () => {
      const keys = getAllStorageKeys();
      expect(keys).toContain(API_KEY_STORAGE_KEY);
      expect(keys).toContain(RECOGNITION_LANG_STORAGE_KEY);
      expect(keys).toContain(THEME_STORAGE_KEY);
      expect(keys).toContain(SILENCE_TIMEOUT_STORAGE_KEY);
    });

    test('returns only string values (storage keys, not camelCase names)', () => {
      const keys = getAllStorageKeys();
      keys.forEach(k => expect(typeof k).toBe('string'));
      expect(keys).not.toContain('apiKey');
      expect(keys).not.toContain('recognitionLang');
    });
  });

  // -------------------------------------------------------------------------
  // validateSetting - apiKey
  // -------------------------------------------------------------------------
  describe('validateSetting - apiKey', () => {
    test('accepts an empty string (not yet set)', () => {
      expect(validateSetting('apiKey', '')).toBe(true);
    });

    test('accepts a valid sk- prefixed key with sufficient length', () => {
      expect(validateSetting('apiKey', 'sk-abc')).toBe(true);
      expect(validateSetting('apiKey', 'sk-test-key-12345')).toBe(true);
    });

    test('rejects a key that does not start with sk-', () => {
      expect(validateSetting('apiKey', 'invalid-key')).toBe(false);
    });

    test('rejects a key that is too short (less than 6 chars starting with sk-)', () => {
      // 'sk-ab' is 5 chars, which is < 6
      expect(validateSetting('apiKey', 'sk-ab')).toBe(false);
    });

    test('rejects a non-string value', () => {
      expect(validateSetting('apiKey', 12345)).toBe(false);
      expect(validateSetting('apiKey', null)).toBe(false);
      expect(validateSetting('apiKey', true)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // validateSetting - recognitionLang
  // -------------------------------------------------------------------------
  describe('validateSetting - recognitionLang', () => {
    test('accepts a valid language code', () => {
      expect(validateSetting('recognitionLang', 'ja-JP')).toBe(true);
      expect(validateSetting('recognitionLang', 'en-US')).toBe(true);
      expect(validateSetting('recognitionLang', 'vi-VN')).toBe(true);
    });

    test('rejects an empty string', () => {
      expect(validateSetting('recognitionLang', '')).toBe(false);
    });

    test('rejects a non-string value', () => {
      expect(validateSetting('recognitionLang', null)).toBe(false);
      expect(validateSetting('recognitionLang', 123)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // validateSetting - boolean settings
  // -------------------------------------------------------------------------
  const booleanSettings = [
    'autoDetectInputFields',
    'autoCorrection',
    'useHistoryContext',
    'showModalWindow'
  ];

  describe.each(booleanSettings)('validateSetting - %s (boolean)', (settingName) => {
    test('accepts true', () => {
      expect(validateSetting(settingName, true)).toBe(true);
    });

    test('accepts false', () => {
      expect(validateSetting(settingName, false)).toBe(true);
    });

    test('rejects a string', () => {
      expect(validateSetting(settingName, 'true')).toBe(false);
    });

    test('rejects a number', () => {
      expect(validateSetting(settingName, 1)).toBe(false);
    });

    test('rejects null', () => {
      expect(validateSetting(settingName, null)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // validateSetting - themeMode
  // -------------------------------------------------------------------------
  describe('validateSetting - themeMode', () => {
    test('accepts THEME_MODES.DARK', () => {
      expect(validateSetting('themeMode', THEME_MODES.DARK)).toBe(true);
    });

    test('accepts THEME_MODES.LIGHT', () => {
      expect(validateSetting('themeMode', THEME_MODES.LIGHT)).toBe(true);
    });

    test('rejects an arbitrary string', () => {
      expect(validateSetting('themeMode', 'blue')).toBe(false);
      expect(validateSetting('themeMode', 'auto')).toBe(false);
    });

    test('rejects null', () => {
      expect(validateSetting('themeMode', null)).toBe(false);
    });

    test('rejects a boolean', () => {
      expect(validateSetting('themeMode', true)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // validateSetting - silenceTimeout
  // -------------------------------------------------------------------------
  describe('validateSetting - silenceTimeout', () => {
    test('accepts a value within the valid range (500-10000)', () => {
      expect(validateSetting('silenceTimeout', 3000)).toBe(true);
      expect(validateSetting('silenceTimeout', 500)).toBe(true);
      expect(validateSetting('silenceTimeout', 10000)).toBe(true);
    });

    test('rejects a value below the minimum (< 500)', () => {
      expect(validateSetting('silenceTimeout', 499)).toBe(false);
      expect(validateSetting('silenceTimeout', 0)).toBe(false);
    });

    test('rejects a value above the maximum (> 10000)', () => {
      expect(validateSetting('silenceTimeout', 10001)).toBe(false);
      expect(validateSetting('silenceTimeout', 99999)).toBe(false);
    });

    test('rejects a string', () => {
      expect(validateSetting('silenceTimeout', '3000')).toBe(false);
    });

    test('rejects null', () => {
      expect(validateSetting('silenceTimeout', null)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // validateSetting - string prompt settings
  // -------------------------------------------------------------------------
  const promptSettings = ['autoCorrectionPrompt', 'proofreadingPrompt'];

  describe.each(promptSettings)('validateSetting - %s (string, empty allowed)', (settingName) => {
    test('accepts a non-empty string', () => {
      expect(validateSetting(settingName, 'Please correct the text.')).toBe(true);
    });

    test('accepts an empty string (user clearing the prompt)', () => {
      expect(validateSetting(settingName, '')).toBe(true);
    });

    test('rejects null', () => {
      expect(validateSetting(settingName, null)).toBe(false);
    });

    test('rejects a number', () => {
      expect(validateSetting(settingName, 42)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // validateSetting - unknown setting name
  // -------------------------------------------------------------------------
  describe('validateSetting - unknown setting name', () => {
    test('returns false for an unknown setting name', () => {
      expect(validateSetting('nonExistentSetting', 'any value')).toBe(false);
    });

    test('returns false for an empty setting name', () => {
      expect(validateSetting('', 'value')).toBe(false);
    });

    test('returns false for null setting name', () => {
      expect(validateSetting(null, 'value')).toBe(false);
    });
  });
});
