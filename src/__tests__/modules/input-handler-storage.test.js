/**
 * Input Handler Storage Module テスト
 * Tests for: loadMenuState, saveMenuState, MENU_EXPANDED_STORAGE_KEY
 */

jest.mock('../../site-handlers/site-detector.js', () => ({
  getSiteHandler: jest.fn(() => ({
    findBestInputField: jest.fn(() => null),
    submitAfterVoiceInput: jest.fn(() => true)
  }))
}));

jest.mock('../../modules/gpt-service.js', () => ({
  proofreadWithGPT: jest.fn(() => Promise.resolve('corrected text'))
}));

jest.mock('../../modules/state.js', () => ({
  getState: jest.fn(key => null),
  setState: jest.fn(() => true),
  subscribe: jest.fn(() => jest.fn()),
  initializeState: jest.fn()
}));

jest.mock('../../modules/event-bus.js', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
  EVENTS: {
    STATUS_UPDATED: 'status:updated',
    MENU_TOGGLED: 'menu:toggled',
    SETTINGS_MODAL_TOGGLED: 'settings:modal:toggled',
    INPUT_CLEARED: 'input:cleared',
    GPT_PROOFREADING_STARTED: 'gpt:proofreading:started',
    INPUT_FIELD_FOUND: 'input:field:found',
    SPEECH_RECOGNITION_RESULT: 'speech:recognition:result',
    MENU_STATE_UPDATE_NEEDED: 'menu:state:update:needed',
    INPUT_HANDLERS_UPDATE_NEEDED: 'input:handlers:update:needed',
    ERROR_OCCURRED: 'error:occurred'
  }
}));

jest.mock('../../modules/ui.js', () => ({
  updateSettingsModalValues: jest.fn()
}));

jest.mock('../../modules/error-handler.js', () => ({
  createError: jest.fn(),
  handleError: jest.fn(),
  tryCatch: jest.fn((fn) => {
    try {
      return fn();
    } catch (e) {
      return null;
    }
  }),
  ERROR_CODE: {
    DOM_ERROR: { INPUT_OPERATION_FAILED: 'DOM_INPUT_OPERATION_FAILED' },
    STORAGE: { LOAD_FAILED: 'STORAGE_LOAD_FAILED', SAVE_FAILED: 'STORAGE_SAVE_FAILED' },
    INPUT: { MISSING_API_KEY: 'INPUT_MISSING_API_KEY' },
    API: { SERVER_ERROR: 'API_SERVER_ERROR' }
  },
  ERROR_CATEGORY: { DOM: 'DOM_ERROR', STORAGE: 'STORAGE', INPUT: 'INPUT', API: 'API' },
  ERROR_SEVERITY: { WARNING: 'WARNING', ERROR: 'ERROR' }
}));

jest.mock('../../modules/dom-utils.js', () => ({
  isInputElement: jest.fn(() => true),
  writeToInputField: jest.fn(() => true),
  clearInputField: jest.fn(() => true),
  findBestInputField: jest.fn(() => null),
  dispatchEvent: jest.fn(() => true)
}));

import * as inputHandler from '../../modules/input-handler.js';
import { THEME_MODES } from '../../constants.js';
import * as stateModule from '../../modules/state.js';
import * as eventBus from '../../modules/event-bus.js';
import { resetDOM } from '../../utils/dom-helpers.js';

const {
  MENU_EXPANDED_STORAGE_KEY
} = inputHandler;

global.chrome = {
  storage: {
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve())
    }
  },
  i18n: {
    getMessage: jest.fn(key => key)
  }
};

describe('Input Handler Storage Module', () => {
  beforeEach(() => {
    resetDOM();
    jest.clearAllMocks();

    stateModule.getState.mockImplementation(key => {
      const stateValues = {
        menuExpanded: false,
        apiKey: 'test-key',
        recognitionLang: 'ja-JP',
        autoDetectInputFields: true,
        autoCorrection: false,
        useHistoryContext: false,
        themeMode: THEME_MODES.DARK,
        processingState: 'idle',
        isListening: false,
        lastClickedInput: null,
        currentInputElement: null,
        originalText: '',
        useRecognitionModal: false
      };
      return key ? stateValues[key] : { ...stateValues };
    });

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('Storage Key Constants', () => {
    test('MENU_EXPANDED_STORAGE_KEY is defined', () => {
      expect(MENU_EXPANDED_STORAGE_KEY).toBeDefined();
    });
  });

  describe('loadMenuState', () => {
    test('正常系: ストレージから読み込み', async () => {
      chrome.storage.sync.get.mockResolvedValueOnce({
        [MENU_EXPANDED_STORAGE_KEY]: true
      });

      await inputHandler.loadMenuState();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith([MENU_EXPANDED_STORAGE_KEY]);
    });

    test('異常系: エラー処理', async () => {
      chrome.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));

      await inputHandler.loadMenuState();

      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });
  });

  describe('saveMenuState', () => {
    test('正常系: ストレージに保存', async () => {
      await inputHandler.saveMenuState(true);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [MENU_EXPANDED_STORAGE_KEY]: true
      });
    });
  });

});
