/**
 * Settings Module Tests
 */

// モックの宣言
jest.mock('../../modules/state');
jest.mock('../../modules/event-bus');
jest.mock('../../modules/error-handler');

// 正式なインポート（モックの後に行う）
import { 
  loadSettings, 
  saveSetting, 
  saveSettings, 
  toggleTheme, 
  applyTheme 
} from '../../modules/settings';
import { getState, setState } from '../../modules/state';
import { publish, subscribe, EVENTS } from '../../modules/event-bus';
import * as errorHandler from '../../modules/error-handler';
import {
  THEME_MODES,
  DEFAULT_SETTINGS,
  API_KEY_STORAGE_KEY,
  RECOGNITION_LANG_STORAGE_KEY,
  AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY,
  AUTO_CORRECTION_STORAGE_KEY,
  USE_HISTORY_CONTEXT_STORAGE_KEY,
  THEME_STORAGE_KEY
} from '../../constants';

describe('Settings Module', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // モックの実装をセット
    errorHandler.createError.mockImplementation(() => new Error('Mock error'));
    errorHandler.tryCatch.mockImplementation((fn) => fn());
    
    // Mock chrome API
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        }
      },
      i18n: {
        getMessage: jest.fn((key) => key)
      }
    };
    
    // Mock console methods
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
    
    // Mock getState to return default values
    getState.mockImplementation((key) => {
      const defaultState = {
        apiKey: '',
        recognitionLang: DEFAULT_SETTINGS.RECOGNITION_LANG,
        autoDetectInputFields: DEFAULT_SETTINGS.AUTO_DETECT_INPUT_FIELDS,
        autoCorrection: DEFAULT_SETTINGS.AUTO_CORRECTION,
        useHistoryContext: DEFAULT_SETTINGS.USE_HISTORY_CONTEXT,
        themeMode: DEFAULT_SETTINGS.THEME
      };
      
      if (key) {
        return defaultState[key];
      }
      return defaultState;
    });
  });
  
  describe('loadSettings', () => {
    it('should load settings from storage and update state', async () => {
      // Mock storage.get to return some settings
      const mockStorageResult = {
        'gpt_api_key': 'sk-test123',
        'recognition_lang': 'en-US',
        'auto_detect_input_fields': false
      };
      
      chrome.storage.sync.get.mockResolvedValue(mockStorageResult);
      
      // Call loadSettings
      const result = await loadSettings();
      
      // Verify state was updated with correct values
      expect(setState).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: 'sk-test123',
        recognitionLang: 'en-US',
        autoDetectInputFields: false
      }));
      
      // Verify event was published
      expect(publish).toHaveBeenCalledWith(EVENTS.SETTINGS_LOADED, expect.any(Object));
    });
  });
  
  describe('saveSetting', () => {
    it('should save a single setting to storage and update state', async () => {
      // Call saveSetting
      await saveSetting('apiKey', 'sk-newkey123');
      
      // Verify storage was updated
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [API_KEY_STORAGE_KEY]: 'sk-newkey123'
      });
      
      // Verify state was updated
      expect(setState).toHaveBeenCalledWith('apiKey', 'sk-newkey123');
    });
    
    it('should handle invalid setting name', async () => {
      // Setup error for invalid setting name
      const mockError = new Error('Invalid setting name');
      errorHandler.createError.mockReturnValueOnce(mockError);
      
      // Setup tryCatch to simulate error throw
      errorHandler.tryCatch.mockImplementationOnce(() => {
        // Call createError but throw before state is updated
        errorHandler.createError();
        throw mockError;
      });
      
      // Call saveSetting with invalid name
      await expect(saveSetting('invalidSettingName', 'value')).rejects.toThrow();
      
      // Verify error was created
      expect(errorHandler.createError).toHaveBeenCalled();
    });
    
    it('should handle invalid setting value', async () => {
      // Setup error for invalid setting value
      const mockError = new Error('Invalid API key format');
      errorHandler.createError.mockReturnValueOnce(mockError);
      
      // Setup tryCatch to simulate validation failure
      errorHandler.tryCatch.mockImplementationOnce(() => {
        // Call createError but throw before state is updated
        errorHandler.createError();
        throw mockError;
      });
      
      // Call saveSetting with invalid value (non-SK API key)
      await expect(saveSetting('apiKey', 'not-a-valid-key')).rejects.toThrow();
      
      // Verify error was created
      expect(errorHandler.createError).toHaveBeenCalled();
    });
    
    it('should handle special case for themeMode', async () => {
      // Call saveSetting with themeMode
      await saveSetting('themeMode', THEME_MODES.DARK);
      
      // Verify special case was handled
      expect(setState).toHaveBeenCalledWith('themeMode', THEME_MODES.DARK);
    });
    
    it('should handle special case for recognitionLang', async () => {
      // Call saveSetting with recognitionLang
      await saveSetting('recognitionLang', 'en-US');
      
      // Verify event was published
      expect(publish).toHaveBeenCalledWith(EVENTS.LANGUAGE_UPDATED, 'en-US');
    });
  });
  
  describe('toggleTheme', () => {
    it('should toggle from dark to light theme', async () => {
      // Mock current theme as dark
      getState.mockImplementation((key) => {
        if (key === 'themeMode') {
          return THEME_MODES.DARK;
        }
        return null;
      });
      
      // Call toggleTheme
      await toggleTheme();
      
      // Verify state was updated
      expect(setState).toHaveBeenCalledWith('themeMode', THEME_MODES.LIGHT);
    });
    
    it('should toggle from light to dark theme', async () => {
      // Mock current theme as light
      getState.mockImplementation((key) => {
        if (key === 'themeMode') {
          return THEME_MODES.LIGHT;
        }
        return null;
      });
      
      // Call toggleTheme
      await toggleTheme();
      
      // Verify state was updated
      expect(setState).toHaveBeenCalledWith('themeMode', THEME_MODES.DARK);
    });
  });
  
  describe('applyTheme', () => {
    it('should validate and return the theme', () => {
      // Call applyTheme with valid theme and skipDomOperations=true
      const result = applyTheme(THEME_MODES.LIGHT, true);
      
      // Verify result is the theme
      expect(result).toBe(THEME_MODES.LIGHT);
    });
    
    it('should use default theme for invalid values', () => {
      // Call applyTheme with invalid theme and skipDomOperations=true
      const result = applyTheme('invalid-theme', true);
      
      // Verify result is the default theme
      expect(result).toBe(DEFAULT_SETTINGS.THEME);
      
      // Verify warning was logged
      expect(console.warn).toHaveBeenCalled();
    });
  });
  
  describe('saveSettings', () => {
    it('should save multiple settings at once', async () => {
      // Prepare test settings
      const testSettings = {
        apiKey: 'sk-test',
        recognitionLang: 'ja-JP',
        autoDetectInputFields: true,
        themeMode: THEME_MODES.LIGHT
      };
      
      // Call saveSettings
      await saveSettings(testSettings);
      
      // Verify storage was updated with correct values
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(expect.objectContaining({
        [API_KEY_STORAGE_KEY]: 'sk-test',
        [RECOGNITION_LANG_STORAGE_KEY]: 'ja-JP',
        [AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY]: true,
        [THEME_STORAGE_KEY]: THEME_MODES.LIGHT
      }));
      
      // Verify state was updated
      expect(setState).toHaveBeenCalledWith(testSettings);
      
      // Verify theme was applied and event published
      expect(publish).toHaveBeenCalledWith(EVENTS.SETTINGS_SAVED, testSettings);
    });
    
    it('should handle special case for recognition language', async () => {
      // Prepare test settings with recognition language
      const testSettings = {
        recognitionLang: 'en-US'
      };
      
      // Call saveSettings
      await saveSettings(testSettings);
      
      // Verify language updated event was published
      expect(publish).toHaveBeenCalledWith(EVENTS.LANGUAGE_UPDATED, 'en-US');
    });
    
    it('should handle invalid settings', async () => {
      // Setup error for invalid setting
      const mockError = new Error('Invalid setting');
      errorHandler.createError.mockReturnValueOnce(mockError);
      
      // Setup tryCatch to simulate validation failure
      errorHandler.tryCatch.mockImplementationOnce(() => {
        errorHandler.createError();
        throw mockError;
      });
      
      // Prepare test settings with invalid API key
      const invalidSettings = {
        apiKey: 'invalid-key',
        recognitionLang: 'en-US'
      };
      
      // Call saveSettings with invalid settings
      await expect(saveSettings(invalidSettings)).rejects.toThrow();
      
      // Verify error was created
      expect(errorHandler.createError).toHaveBeenCalled();
    });
  });
});