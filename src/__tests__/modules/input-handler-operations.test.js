/**
 * Input Handler Operations Module テスト
 * Tests for: findBestInputField, autoSubmitAfterVoiceInput, writeToInputField,
 *            simulateTypingIntoElement, clearCurrentInput, proofreadCurrentInput,
 *            enhanceInputElementHandlers, initInputHandler, setupEventSubscriptions
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
    AUTO_SUBMIT_STATE_CHANGED: 'autoSubmit:changed',
    MENU_TOGGLED: 'menu:toggled',
    SETTINGS_MODAL_TOGGLED: 'settings:modal:toggled',
    AUTO_SUBMIT_TOGGLED: 'auto:submit:toggled',
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
import { PROCESSING_STATE, THEME_MODES } from '../../constants.js';
import * as siteDetector from '../../site-handlers/site-detector.js';
import * as stateModule from '../../modules/state.js';
import * as eventBus from '../../modules/event-bus.js';
import * as domUtils from '../../modules/dom-utils.js';
import { resetDOM } from '../../utils/dom-helpers.js';

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

describe('Input Handler Operations Module', () => {
  beforeEach(() => {
    resetDOM();
    jest.clearAllMocks();

    stateModule.getState.mockImplementation(key => {
      const stateValues = {
        menuExpanded: false,
        autoSubmit: false,
        apiKey: 'test-key',
        recognitionLang: 'ja-JP',
        autoDetectInputFields: true,
        autoCorrection: false,
        useHistoryContext: false,
        themeMode: THEME_MODES.DARK,
        processingState: PROCESSING_STATE.IDLE,
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

  describe('findBestInputField', () => {
    test('サイトハンドラーを使用', () => {
      const mockInput = document.createElement('input');
      const mockSiteHandler = { findBestInputField: jest.fn(() => mockInput) };
      siteDetector.getSiteHandler.mockReturnValueOnce(mockSiteHandler);

      const result = inputHandler.findBestInputField();
      expect(mockSiteHandler.findBestInputField).toHaveBeenCalled();
      expect(result).toBe(mockInput);
    });

    test('DOM utilsにフォールバック', () => {
      const mockInput = document.createElement('input');
      siteDetector.getSiteHandler.mockReturnValueOnce({});
      domUtils.findBestInputField.mockReturnValueOnce(mockInput);

      const result = inputHandler.findBestInputField();
      expect(domUtils.findBestInputField).toHaveBeenCalled();
      expect(result).toBe(mockInput);
    });
  });

  describe('autoSubmitAfterVoiceInput', () => {
    test('サイトハンドラーを使用', () => {
      const mockSiteHandler = { submitAfterVoiceInput: jest.fn(() => true) };
      siteDetector.getSiteHandler.mockReturnValueOnce(mockSiteHandler);

      const result = inputHandler.autoSubmitAfterVoiceInput();
      expect(mockSiteHandler.submitAfterVoiceInput).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('ハンドラーなし', () => {
      siteDetector.getSiteHandler.mockReturnValueOnce({});
      const result = inputHandler.autoSubmitAfterVoiceInput();
      expect(result).toBe(false);
    });
  });

  describe('writeToInputField', () => {
    test('正常系', () => {
      const element = document.createElement('input');
      inputHandler.writeToInputField(element, 'test text');
      expect(domUtils.writeToInputField).toHaveBeenCalledWith(element, 'test text');
    });

    test('要素がnullの場合', () => {
      inputHandler.writeToInputField(null, 'test text');
      expect(domUtils.writeToInputField).not.toHaveBeenCalled();
    });
  });

  describe('simulateTypingIntoElement', () => {
    test('正常系', () => {
      const element = document.createElement('input');
      domUtils.writeToInputField.mockReturnValueOnce(true);
      const result = inputHandler.simulateTypingIntoElement(element, 'test text');
      expect(result).toBe(true);
    });

    test('要素がnullの場合', () => {
      const result = inputHandler.simulateTypingIntoElement(null, 'test text');
      expect(result).toBe(false);
    });
  });

  describe('clearCurrentInput', () => {
    test('アクティブ要素がinput', () => {
      const input = document.createElement('input');
      input.value = 'test text';
      document.body.appendChild(input);

      domUtils.isInputElement.mockReturnValueOnce(true);
      domUtils.clearInputField.mockReturnValueOnce(true);

      inputHandler.clearCurrentInput();

      expect(domUtils.clearInputField).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        eventBus.EVENTS.STATUS_UPDATED,
        { messageKey: 'statusClearSuccess' }
      );
    });

    test('最後にクリックした入力要素を使用', () => {
      const input = document.createElement('input');
      input.value = 'test text';
      document.body.appendChild(input);

      domUtils.isInputElement.mockReturnValueOnce(false);
      stateModule.getState.mockImplementation(key => {
        if (key === 'lastClickedInput') return input;
        if (key === 'autoDetectInputFields') return true;
        return null;
      });
      domUtils.clearInputField.mockReturnValueOnce(true);

      inputHandler.clearCurrentInput();
      expect(domUtils.clearInputField).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    test('initInputHandler - 初期化', async () => {
      await inputHandler.initInputHandler();
      expect(stateModule.initializeState).toHaveBeenCalled();
      expect(stateModule.setState).toHaveBeenCalledWith('menuExpanded', expect.any(Boolean));
    });

    test('initInputHandler - イベントリスナー設定', async () => {
      const originalAddEventListener = document.addEventListener;
      document.addEventListener = jest.fn();

      await inputHandler.initInputHandler();

      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(eventBus.subscribe).toHaveBeenCalled();

      document.addEventListener = originalAddEventListener;
    });
  });

  describe('Proofreading', () => {
    test('proofreadCurrentInput - 処理中の場合', async () => {
      stateModule.getState.mockImplementation(key => {
        if (key === 'processingState') return PROCESSING_STATE.EDITING;
        return null;
      });

      await inputHandler.proofreadCurrentInput();

      expect(stateModule.setState).not.toHaveBeenCalledWith('processingState', PROCESSING_STATE.PROOFREADING);
      expect(eventBus.publish).toHaveBeenCalled();
    });

    test('proofreadCurrentInput - 空のコンテンツ', async () => {
      const input = document.createElement('textarea');
      input.value = '';
      document.body.appendChild(input);

      domUtils.isInputElement.mockReturnValueOnce(true);
      stateModule.getState.mockImplementation(key => {
        if (key === 'processingState') return PROCESSING_STATE.IDLE;
        if (key === 'currentInputElement') return input;
        return null;
      });

      await inputHandler.proofreadCurrentInput();

      expect(eventBus.publish).toHaveBeenCalled();
      expect(stateModule.setState).toHaveBeenCalledWith('processingState', PROCESSING_STATE.IDLE);
    });
  });
});
