/**
 * Settings Module Tests
 */

import { 
  loadSettings, 
  saveSetting, 
  saveSettings, 
  toggleTheme, 
  applyTheme 
} from '../../modules/settings';
import { getState, setState } from '../../modules/state';
import { publish, EVENTS } from '../../modules/event-bus';
import { THEME_MODES, DEFAULT_SETTINGS } from '../../constants';
import { tryCatch } from '../../modules/error-handler';

// Mock dependencies
jest.mock('../../modules/state');
jest.mock('../../modules/event-bus');
jest.mock('../../modules/error-handler', () => ({
  createError: jest.fn(),
  handleError: jest.fn(),
  tryCatch: jest.fn((fn) => fn()),
  ERROR_CATEGORY: { STORAGE: 'storage', INPUT: 'input' },
  ERROR_CODE: { 
    storage: { LOAD_FAILED: 'storage_load_failed', SAVE_FAILED: 'storage_save_failed' },
    input: { INVALID_API_KEY_FORMAT: 'input_invalid_api_key_format' }
  },
  ERROR_SEVERITY: { ERROR: 'error' }
}));

describe('Settings Module', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
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
      expect(chrome.storage.sync.set).toHaveBeenCalled();
      
      // Verify state was updated
      expect(setState).toHaveBeenCalledWith('apiKey', 'sk-newkey123');
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
      // Call applyTheme with valid theme
      const result = applyTheme(THEME_MODES.LIGHT);
      
      // Verify result is the theme
      expect(result).toBe(THEME_MODES.LIGHT);
    });
    
    it('should use default theme for invalid values', () => {
      // Call applyTheme with invalid theme
      const result = applyTheme('invalid-theme');
      
      // Verify result is the default theme
      expect(result).toBe(DEFAULT_SETTINGS.THEME);
      
      // Verify warning was logged
      expect(console.warn).toHaveBeenCalled();
    });
  });
});