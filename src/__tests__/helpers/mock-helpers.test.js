/**
 * mock-helpers.js のテスト
 */

import {
  setupChromeAPIMock,
  setupSpeechRecognitionMock,
  setupUIMock,
  setupPlatformHandlerMock,
  resetAllMocks
} from '../../utils/mock-helpers.js';

describe('Mock Helpers Tests', () => {
  // 各テスト後にモックをリセット
  afterEach(() => {
    resetAllMocks();
    jest.clearAllMocks();
  });

  describe('setupChromeAPIMock', () => {
    it('should create a mock chrome object with default values', () => {
      const chrome = setupChromeAPIMock();
      
      // chrome.i18n.getMessage が存在することを確認
      expect(chrome.i18n.getMessage).toBeDefined();
      expect(typeof chrome.i18n.getMessage).toBe('function');
      
      // デフォルトのメッセージが返されることを確認
      expect(chrome.i18n.getMessage('statusListening')).toBe('音声入力待機中...');
      expect(chrome.i18n.getMessage('unknownKey')).toBe('unknownKey');
      
      // chrome.storage.sync が存在することを確認
      expect(chrome.storage.sync.get).toBeDefined();
      expect(chrome.storage.sync.set).toBeDefined();
      
      // chrome.storage.local が存在することを確認
      expect(chrome.storage.local.get).toBeDefined();
      expect(chrome.storage.local.set).toBeDefined();
      
      // chrome.runtime が存在することを確認
      expect(chrome.runtime.sendMessage).toBeDefined();
      expect(chrome.runtime.onMessage.addListener).toBeDefined();
      expect(chrome.runtime.onMessage.removeListener).toBeDefined();
    });

    it('should allow custom i18n messages', () => {
      const customMessages = {
        statusListening: 'カスタムメッセージ',
        customKey: 'カスタム値'
      };
      
      const chrome = setupChromeAPIMock({ i18nMessages: customMessages });
      
      expect(chrome.i18n.getMessage('statusListening')).toBe('カスタムメッセージ');
      expect(chrome.i18n.getMessage('customKey')).toBe('カスタム値');
      // 定義されていないキーはそのまま返される
      expect(chrome.i18n.getMessage('unknownKey')).toBe('unknownKey');
    });

    it('should handle storage.sync.get with callback', (done) => {
      const storageData = { key: 'value' };
      const chrome = setupChromeAPIMock({ storageData });
      
      chrome.storage.sync.get(['key'], (result) => {
        expect(result).toEqual(storageData);
        done();
      });
      
      // タイマーを進める
      jest.runAllTimers();
    });

    it('should handle storage.sync.get with Promise', async () => {
      const storageData = { key: 'value' };
      const chrome = setupChromeAPIMock({ storageData });
      
      const result = await chrome.storage.sync.get(['key']);
      expect(result).toEqual(storageData);
    });

    it('should handle storage.sync.set with callback', (done) => {
      const chrome = setupChromeAPIMock();
      
      chrome.storage.sync.set({ key: 'value' }, () => {
        // コールバックが呼ばれることを確認
        done();
      });
      
      // タイマーを進める
      jest.runAllTimers();
    });

    it('should handle storage.sync.set with Promise', async () => {
      const chrome = setupChromeAPIMock();
      
      // Promiseが解決されることを確認
      await expect(chrome.storage.sync.set({ key: 'value' })).resolves.toBeUndefined();
    });
  });

  describe('setupSpeechRecognitionMock', () => {
    it('should create a mock SpeechRecognition constructor', () => {
      const SpeechRecognitionMock = setupSpeechRecognitionMock();
      
      // グローバルオブジェクトにコンストラクタが追加されていることを確認
      expect(global.SpeechRecognition).toBe(SpeechRecognitionMock);
      expect(global.webkitSpeechRecognition).toBe(SpeechRecognitionMock);
      
      // インスタンス化できることを確認
      const recognition = new SpeechRecognitionMock();
      expect(recognition.continuous).toBe(false);
      expect(recognition.interimResults).toBe(false);
      expect(recognition.lang).toBe('ja-JP');
      expect(recognition.maxAlternatives).toBe(1);
    });

    it('should handle start method and trigger events', (done) => {
      setupSpeechRecognitionMock();
      const recognition = new global.SpeechRecognition();
      
      // イベントハンドラを設定
      recognition.onstart = jest.fn();
      recognition.onend = jest.fn(() => {
        expect(recognition.onstart).toHaveBeenCalled();
        done();
      });
      
      // 開始
      recognition.start();
      
      // タイマーを進める
      jest.runAllTimers();
    });

    it('should simulate recognition results', (done) => {
      const resultText = 'テスト認識結果';
      setupSpeechRecognitionMock({
        simulateResult: true,
        resultText,
        resultDelay: 100
      });
      
      const recognition = new global.SpeechRecognition();
      
      recognition.onresult = jest.fn(event => {
        expect(event.results[0][0].transcript).toBe(resultText);
        expect(event.results[0][0].confidence).toBeGreaterThan(0);
        done();
      });
      
      recognition.start();
      
      // 結果が返されるまで待機
      jest.advanceTimersByTime(100);
    });

    it('should simulate recognition errors', (done) => {
      const errorType = 'network';
      const errorMessage = 'Network error occurred';
      setupSpeechRecognitionMock({
        simulateError: true,
        errorType,
        errorMessage,
        errorDelay: 50
      });
      
      const recognition = new global.SpeechRecognition();
      
      recognition.onerror = jest.fn(event => {
        expect(event.error).toBe(errorType);
        expect(event.message).toBe(errorMessage);
        done();
      });
      
      recognition.start();
      
      // エラーが発生するまで待機
      jest.advanceTimersByTime(50);
    });

    it('should handle stop method', () => {
      setupSpeechRecognitionMock();
      const recognition = new global.SpeechRecognition();
      
      recognition.onend = jest.fn();
      
      recognition.stop();
      
      expect(recognition.onend).toHaveBeenCalled();
    });

    it('should handle abort method', () => {
      setupSpeechRecognitionMock();
      const recognition = new global.SpeechRecognition();
      
      recognition.onend = jest.fn();
      
      recognition.abort();
      
      expect(recognition.onend).toHaveBeenCalled();
    });
  });

  describe('setupUIMock', () => {
    it('should create mock UI functions', () => {
      const uiMocks = setupUIMock();
      
      // 各モック関数が存在することを確認
      expect(uiMocks.showStatus).toBeDefined();
      expect(uiMocks.updateProcessingState).toBeDefined();
      expect(uiMocks.createUI).toBeDefined();
      expect(uiMocks.toggleMenu).toBeDefined();
      expect(uiMocks.showRecognitionResult).toBeDefined();
      
      // 関数を呼び出せることを確認
      uiMocks.showStatus('テストステータス');
      expect(uiMocks.showStatus).toHaveBeenCalledWith('テストステータス');
    });
  });

  describe('setupPlatformHandlerMock', () => {
    it('should create mock handler for ChatGPT platform', () => {
      const handler = setupPlatformHandlerMock('chatgpt');
      
      // 共通メソッドが存在することを確認
      expect(handler.submitAfterVoiceInput).toBeDefined();
      expect(handler.findSubmitButtonForInput).toBeDefined();
      expect(handler.findBestInputField).toBeDefined();
      
      // ChatGPT固有のメソッドが存在することを確認
      expect(handler.isChatGPTSite).toBeDefined();
      expect(handler.findChatGPTSubmitButton).toBeDefined();
      
      // 正しい値を返すことを確認
      expect(handler.isChatGPTSite()).toBe(true);
      expect(handler.submitAfterVoiceInput()).toBe(true);
    });

    it('should create mock handler for Claude platform', () => {
      const handler = setupPlatformHandlerMock('claude');
      
      // Claude固有のメソッドが存在することを確認
      expect(handler.isClaudeSite).toBeDefined();
      expect(handler.findClaudeSubmitButton).toBeDefined();
      
      // 正しい値を返すことを確認
      expect(handler.isClaudeSite()).toBe(true);
      expect(handler.submitAfterVoiceInput()).toBe(true);
    });

    it('should create mock handler for Gemini platform', () => {
      const handler = setupPlatformHandlerMock('gemini');
      
      // Gemini固有のメソッドが存在することを確認
      expect(handler.isGeminiSite).toBeDefined();
      expect(handler.findGeminiSubmitButton).toBeDefined();
      
      // 正しい値を返すことを確認
      expect(handler.isGeminiSite()).toBe(true);
      expect(handler.submitAfterVoiceInput()).toBe(true);
    });

    it('should allow custom implementations', () => {
      const customImplementation = () => 'カスタム結果';
      const handler = setupPlatformHandlerMock('chatgpt', {
        submitAfterVoiceInput: customImplementation
      });
      
      expect(handler.submitAfterVoiceInput()).toBe('カスタム結果');
    });
  });

  describe('resetAllMocks', () => {
    it('should reset all global mocks', () => {
      // モックを設定
      setupChromeAPIMock();
      setupSpeechRecognitionMock();
      
      // グローバルオブジェクトにモックが追加されていることを確認
      expect(global.chrome).toBeDefined();
      expect(global.SpeechRecognition).toBeDefined();
      expect(global.webkitSpeechRecognition).toBeDefined();
      
      // リセット
      resetAllMocks();
      
      // グローバルオブジェクトからモックが削除されていることを確認
      expect(global.chrome).toBeUndefined();
      expect(global.SpeechRecognition).toBeUndefined();
      expect(global.webkitSpeechRecognition).toBeUndefined();
    });
  });
});