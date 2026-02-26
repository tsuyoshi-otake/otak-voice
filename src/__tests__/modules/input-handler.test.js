/**
 * Input Handler Module テスト
 */

// すべての依存関係をモックする前にimportする
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

// 簡略化したエラーハンドラーモック
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
    DOM_ERROR: {
      INPUT_OPERATION_FAILED: 'DOM_INPUT_OPERATION_FAILED'
    },
    STORAGE: {
      LOAD_FAILED: 'STORAGE_LOAD_FAILED',
      SAVE_FAILED: 'STORAGE_SAVE_FAILED'
    },
    INPUT: {
      MISSING_API_KEY: 'INPUT_MISSING_API_KEY'
    },
    API: {
      SERVER_ERROR: 'API_SERVER_ERROR'
    }
  },
  ERROR_CATEGORY: {
    DOM: 'DOM_ERROR',
    STORAGE: 'STORAGE',
    INPUT: 'INPUT',
    API: 'API'
  },
  ERROR_SEVERITY: {
    WARNING: 'WARNING',
    ERROR: 'ERROR'
  }
}));

jest.mock('../../modules/dom-utils.js', () => ({
  isInputElement: jest.fn(() => true),
  writeToInputField: jest.fn(() => true),
  clearInputField: jest.fn(() => true),
  findBestInputField: jest.fn(() => null),
  dispatchEvent: jest.fn(() => true)
}));

// モック後にモジュールをインポート
import * as inputHandler from '../../modules/input-handler.js';
import { PROCESSING_STATE, THEME_MODES } from '../../constants.js';
import * as siteDetector from '../../site-handlers/site-detector.js';
import * as stateModule from '../../modules/state.js';
import * as eventBus from '../../modules/event-bus.js';
import * as errorHandler from '../../modules/error-handler.js';
import * as domUtils from '../../modules/dom-utils.js';
import * as ui from '../../modules/ui.js';
import * as gptService from '../../modules/gpt-service.js';
import { resetDOM } from '../../utils/dom-helpers.js';

// 定数の取得
const { 
  MENU_EXPANDED_STORAGE_KEY, 
  AUTO_SUBMIT_STORAGE_KEY 
} = inputHandler;

// Chrome APIのモック
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

describe('Input Handler Module - 100%カバレッジテスト', () => {
  beforeEach(() => {
    resetDOM();
    jest.clearAllMocks();
    
    // デフォルト状態の設定
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
    
    // コンソール出力の抑制
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });
  
  // 1. Menu State Management
  describe('Menu State Management', () => {
    test('loadMenuState - 正常系: ストレージから読み込み', async () => {
      chrome.storage.sync.get.mockResolvedValueOnce({
        [MENU_EXPANDED_STORAGE_KEY]: true
      });
      
      await inputHandler.loadMenuState();
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith([MENU_EXPANDED_STORAGE_KEY]);
    });
    
    test('loadMenuState - 異常系: エラー処理', async () => {
      chrome.storage.sync.get.mockRejectedValueOnce(new Error('Storage error'));
      
      await inputHandler.loadMenuState();
      
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });
    
    test('saveMenuState - 正常系: ストレージに保存', async () => {
      await inputHandler.saveMenuState(true);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [MENU_EXPANDED_STORAGE_KEY]: true
      });
    });
    
    test('toggleMenu - 要素がない場合', () => {
      inputHandler.toggleMenu();
      
      expect(stateModule.setState).not.toHaveBeenCalled();
    });
    
    test('toggleMenu - false -> true', () => {
      // DOM要素の作成
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);
      
      stateModule.getState.mockReturnValueOnce(false);
      
      inputHandler.toggleMenu();
      
      expect(stateModule.setState).toHaveBeenCalledWith('menuExpanded', true);
    });
    
    test('toggleMenu - true -> false', () => {
      // DOM要素の作成
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);
      
      stateModule.getState.mockReturnValueOnce(true);
      
      inputHandler.toggleMenu();
      
      expect(stateModule.setState).toHaveBeenCalledWith('menuExpanded', false);
    });
    
    test('updateMenuState - expanded', () => {
      // DOM要素の作成
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);
      
      stateModule.getState.mockReturnValueOnce(true);
      
      inputHandler.updateMenuState();
      
      expect(menuContainer.classList.contains('otak-voice-menu__container--expanded')).toBe(true);
    });
    
    test('updateMenuState - collapsed', () => {
      // DOM要素の作成
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      menuContainer.classList.add('otak-voice-menu__container--expanded');
      
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      menuButton.classList.add('otak-voice-menu__btn--expanded');
      
      const historyPanel = document.createElement('div');
      historyPanel.id = 'otak-voice-history-panel';
      historyPanel.style.display = 'block';
      
      const settingsModal = document.createElement('div');
      settingsModal.id = 'otak-voice-settings-modal';
      settingsModal.style.display = 'block';
      
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);
      document.body.appendChild(historyPanel);
      document.body.appendChild(settingsModal);
      
      stateModule.getState.mockReturnValueOnce(false);
      
      inputHandler.updateMenuState();
      
      expect(menuContainer.classList.contains('otak-voice-menu__container--expanded')).toBe(false);
      expect(historyPanel.style.display).toBe('none');
    });
    
    test('updateMenuState - 要素がない場合', () => {
      inputHandler.updateMenuState();
      
      expect(console.log).toHaveBeenCalledWith('Menu elements not found');
    });
  });
  
  // 2. Auto Submit Management
  describe('Auto Submit Management', () => {
    test('loadAutoSubmitState - 正常系', async () => {
      chrome.storage.sync.get.mockResolvedValueOnce({
        [AUTO_SUBMIT_STORAGE_KEY]: true
      });
      
      await inputHandler.loadAutoSubmitState();
      
      expect(chrome.storage.sync.get).toHaveBeenCalledWith([AUTO_SUBMIT_STORAGE_KEY]);
      expect(stateModule.setState).toHaveBeenCalledWith('autoSubmit', true);
    });
    
    test('loadAutoSubmitState - デフォルト値', async () => {
      chrome.storage.sync.get.mockResolvedValueOnce({});
      
      await inputHandler.loadAutoSubmitState();
      
      expect(stateModule.setState).toHaveBeenCalledWith('autoSubmit', false);
    });
    
    test('saveAutoSubmitState - 正常系', async () => {
      // チェックボックス要素の作成
      const autoSubmitCheckbox = document.createElement('input');
      autoSubmitCheckbox.id = 'auto-submit-checkbox';
      autoSubmitCheckbox.type = 'checkbox';
      document.body.appendChild(autoSubmitCheckbox);
      
      await inputHandler.saveAutoSubmitState(true);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        [AUTO_SUBMIT_STORAGE_KEY]: true
      });
      expect(eventBus.publish).toHaveBeenCalledWith(
        eventBus.EVENTS.AUTO_SUBMIT_STATE_CHANGED,
        true
      );
      expect(autoSubmitCheckbox.checked).toBe(true);
    });
    
    test('toggleAutoSubmit - menu button', () => {
      stateModule.getState.mockReturnValueOnce(false);
      
      inputHandler.toggleAutoSubmit(true);
      
      expect(stateModule.setState).toHaveBeenCalledWith('autoSubmit', true);
    });
    
    test('toggleAutoSubmit - settings modal', () => {
      // チェックボックス要素の作成
      const autoSubmitCheckbox = document.createElement('input');
      autoSubmitCheckbox.id = 'auto-submit-checkbox';
      autoSubmitCheckbox.type = 'checkbox';
      document.body.appendChild(autoSubmitCheckbox);
      
      inputHandler.toggleAutoSubmit(false);
      
      expect(console.log).toHaveBeenCalledWith('Auto submit checkbox changed, will be applied when Save is clicked');
    });
    
    test('updateAutoSubmitButtonState - enabled', () => {
      // 自動送信ボタンの作成
      const autoSubmitButton = document.createElement('button');
      autoSubmitButton.className = 'otak-voice-menu__append-btn otak-voice-menu__append-btn--active';
      
      const statusElem = document.createElement('div');
      statusElem.className = 'otak-voice-status';
      
      document.body.appendChild(autoSubmitButton);
      document.body.appendChild(statusElem);
      
      inputHandler.updateAutoSubmitButtonState(true);
      
      expect(autoSubmitButton.classList.contains('otak-voice-menu__append-btn--active')).toBe(false);
      expect(eventBus.publish).toHaveBeenCalledWith(
        eventBus.EVENTS.STATUS_UPDATED,
        expect.objectContaining({ messageKey: 'statusAutoSubmitOn' })
      );
    });
    
    test('updateAutoSubmitButtonState - disabled', () => {
      // 自動送信ボタンの作成
      const autoSubmitButton = document.createElement('button');
      autoSubmitButton.className = 'otak-voice-menu__append-btn';
      
      const statusElem = document.createElement('div');
      statusElem.className = 'otak-voice-status';
      
      document.body.appendChild(autoSubmitButton);
      document.body.appendChild(statusElem);
      
      inputHandler.updateAutoSubmitButtonState(false);
      
      expect(autoSubmitButton.classList.contains('otak-voice-menu__append-btn--active')).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        eventBus.EVENTS.STATUS_UPDATED,
        expect.objectContaining({ messageKey: 'statusAutoSubmitOff' })
      );
    });
    
    test('updateAutoSubmitButtonState - ボタンがない場合', () => {
      inputHandler.updateAutoSubmitButtonState(true);
      
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
  
  // 3. Input Operations
  describe('Input Operations', () => {
    test('findBestInputField - サイトハンドラーを使用', () => {
      // モック入力要素
      const mockInput = document.createElement('input');
      
      // サイトハンドラーのモック
      const mockSiteHandler = {
        findBestInputField: jest.fn(() => mockInput)
      };
      
      siteDetector.getSiteHandler.mockReturnValueOnce(mockSiteHandler);
      
      const result = inputHandler.findBestInputField();
      
      expect(mockSiteHandler.findBestInputField).toHaveBeenCalled();
      expect(result).toBe(mockInput);
    });
    
    test('findBestInputField - DOM utilsにフォールバック', () => {
      // モック入力要素
      const mockInput = document.createElement('input');
      
      // サイトハンドラーが適切なメソッドを持たない
      siteDetector.getSiteHandler.mockReturnValueOnce({});
      
      // DOM utilsが入力要素を見つける
      domUtils.findBestInputField.mockReturnValueOnce(mockInput);
      
      const result = inputHandler.findBestInputField();
      
      expect(domUtils.findBestInputField).toHaveBeenCalled();
      expect(result).toBe(mockInput);
    });
    
    test('autoSubmitAfterVoiceInput - サイトハンドラーを使用', () => {
      const mockSiteHandler = {
        submitAfterVoiceInput: jest.fn(() => true)
      };
      
      siteDetector.getSiteHandler.mockReturnValueOnce(mockSiteHandler);
      
      const result = inputHandler.autoSubmitAfterVoiceInput();
      
      expect(mockSiteHandler.submitAfterVoiceInput).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    test('autoSubmitAfterVoiceInput - ハンドラーなし', () => {
      siteDetector.getSiteHandler.mockReturnValueOnce({});
      
      const result = inputHandler.autoSubmitAfterVoiceInput();
      
      expect(result).toBe(false);
    });
    
    test('writeToInputField - 正常系', () => {
      const element = document.createElement('input');
      
      inputHandler.writeToInputField(element, 'test text');
      
      expect(domUtils.writeToInputField).toHaveBeenCalledWith(element, 'test text');
    });
    
    test('writeToInputField - 要素がnullの場合', () => {
      inputHandler.writeToInputField(null, 'test text');
      
      expect(domUtils.writeToInputField).not.toHaveBeenCalled();
    });
    
    test('simulateTypingIntoElement - 正常系', () => {
      const element = document.createElement('input');
      
      domUtils.writeToInputField.mockReturnValueOnce(true);
      
      const result = inputHandler.simulateTypingIntoElement(element, 'test text');
      
      expect(result).toBe(true);
    });
    
    test('simulateTypingIntoElement - 要素がnullの場合', () => {
      const result = inputHandler.simulateTypingIntoElement(null, 'test text');
      
      expect(result).toBe(false);
    });
    
    test('clearCurrentInput - アクティブ要素がinput', () => {
      // テスト入力要素の作成
      const input = document.createElement('input');
      input.value = 'test text';
      document.body.appendChild(input);
      
      // アクティブ要素がinput
      domUtils.isInputElement.mockReturnValueOnce(true);
      
      // clearInputFieldが成功
      domUtils.clearInputField.mockReturnValueOnce(true);
      
      inputHandler.clearCurrentInput();
      
      expect(domUtils.clearInputField).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        eventBus.EVENTS.STATUS_UPDATED,
        { messageKey: 'statusClearSuccess' }
      );
    });
    
    test('clearCurrentInput - 最後にクリックした入力要素を使用', () => {
      // テスト入力要素の作成
      const input = document.createElement('input');
      input.value = 'test text';
      document.body.appendChild(input);
      
      // アクティブ要素がinputではない
      domUtils.isInputElement.mockReturnValueOnce(false);
      
      // 最後にクリックした入力要素がある
      stateModule.getState.mockImplementation(key => {
        if (key === 'lastClickedInput') return input;
        if (key === 'autoDetectInputFields') return true;
        return null;
      });
      
      // clearInputFieldが成功
      domUtils.clearInputField.mockReturnValueOnce(true);
      
      inputHandler.clearCurrentInput();
      
      expect(domUtils.clearInputField).toHaveBeenCalled();
    });
  });
  
  // 4. Settings Modal
  describe('Settings Modal', () => {
    test('toggleSettingsModal - 表示切り替え', () => {
      // モーダルの作成
      const modal = document.createElement('div');
      modal.id = 'otak-voice-settings-modal';
      modal.style.display = 'none';
      document.body.appendChild(modal);
      
      // 初期状態は非表示
      expect(modal.style.display).toBe('none');
      
      inputHandler.toggleSettingsModal();
      
      // 表示に変更
      expect(modal.style.display).toBe('block');
      
      inputHandler.toggleSettingsModal();
      
      // 再び非表示に
      expect(modal.style.display).toBe('none');
    });
    
    test('toggleSettingsModal - モーダルがない場合', () => {
      // モーダルなし
      inputHandler.toggleSettingsModal();
      
      // エラーが発生しないこと
      expect(true).toBe(true);
    });
  });
  
  // 5. Initialization
  describe('Initialization', () => {
    test('initInputHandler - 初期化', async () => {
      await inputHandler.initInputHandler();
      
      expect(stateModule.initializeState).toHaveBeenCalled();
      expect(stateModule.setState).toHaveBeenCalledWith('menuExpanded', expect.any(Boolean));
    });
    
    test('initInputHandler - イベントリスナー設定', async () => {
      // document.addEventListenerをモック
      const originalAddEventListener = document.addEventListener;
      document.addEventListener = jest.fn();
      
      await inputHandler.initInputHandler();
      
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(eventBus.subscribe).toHaveBeenCalled();
      
      // 元に戻す
      document.addEventListener = originalAddEventListener;
    });
  });
  
  // 6. Proofreading
  describe('Proofreading', () => {
    test('proofreadCurrentInput - 処理中の場合', async () => {
      // 処理状態のモック
      stateModule.getState.mockImplementation(key => {
        if (key === 'processingState') return PROCESSING_STATE.EDITING;
        return null;
      });
      
      await inputHandler.proofreadCurrentInput();
      
      // PROOFREADING状態にセットしないこと
      expect(stateModule.setState).not.toHaveBeenCalledWith('processingState', PROCESSING_STATE.PROOFREADING);
      
      // ステータスメッセージを表示すること
      expect(eventBus.publish).toHaveBeenCalled();
    });
    
    test('proofreadCurrentInput - 空のコンテンツ', async () => {
      // テスト入力要素の作成
      const input = document.createElement('textarea');
      input.value = '';
      document.body.appendChild(input);
      
      // DOM状態のモック
      domUtils.isInputElement.mockReturnValueOnce(true);
      
      // 状態のモック
      stateModule.getState.mockImplementation(key => {
        if (key === 'processingState') return PROCESSING_STATE.IDLE;
        if (key === 'currentInputElement') return input;
        return null;
      });
      
      await inputHandler.proofreadCurrentInput();
      
      // 空のコンテンツメッセージを表示
      expect(eventBus.publish).toHaveBeenCalled();
      
      // 処理状態をリセット
      expect(stateModule.setState).toHaveBeenCalledWith('processingState', PROCESSING_STATE.IDLE);
    });
  });
});