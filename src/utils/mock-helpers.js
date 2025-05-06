/**
 * テスト用モックヘルパー関数
 * テスト間でよく使用されるモックの設定と復元をサポートします
 */

/**
 * jestが利用できない場合のフォールバックモック関数を作成
 * @returns {Function} モック関数
 */
export function createMockFn() {
  if (typeof jest !== 'undefined' && jest.fn) {
    return jest.fn();
  }
  // フォールバック実装
  const mockFn = function() { return mockFn.returnValue; };
  mockFn.mockImplementation = (impl) => {
    mockFn.implementation = impl;
    return mockFn;
  };
  mockFn.mockReturnValue = (val) => {
    mockFn.returnValue = val;
    return mockFn;
  };
  return mockFn;
}

/**
 * Chromeブラウザ拡張APIをモック
 * @param {Object} options - モックオプション
 * @returns {Object} - モックされたchromeオブジェクト
 */
export function setupChromeAPIMock(options = {}) {
  const defaultI18nMessages = {
    // デフォルトの国際化メッセージ
    statusListening: '音声入力待機中...',
    statusProcessing: '処理中...',
    statusSubmitClicked: '送信しました',
    logSubmitButtonDisabled: '送信ボタンが無効状態です',
    // 他のメッセージも必要に応じて追加
  };

  const i18nMessages = { ...defaultI18nMessages, ...(options.i18nMessages || {}) };

  // グローバルなchromeオブジェクトをモック
  global.chrome = {
    i18n: {
      getMessage: createMockFn().mockImplementation(key => i18nMessages[key] || key)
    },
    storage: {
      sync: {
        get: createMockFn().mockImplementation((keys, callback) => {
          if (callback) {
            // 非同期API模倣
            setTimeout(() => {
              callback(options.storageData || {});
            }, 0);
          }
          return Promise.resolve(options.storageData || {});
        }),
        set: createMockFn().mockImplementation((data, callback) => {
          if (callback) {
            setTimeout(() => {
              callback();
            }, 0);
          }
          return Promise.resolve();
        })
      },
      local: {
        get: createMockFn().mockImplementation((keys, callback) => {
          if (callback) {
            setTimeout(() => {
              callback(options.storageData || {});
            }, 0);
          }
          return Promise.resolve(options.storageData || {});
        }),
        set: createMockFn().mockImplementation((data, callback) => {
          if (callback) {
            setTimeout(() => {
              callback();
            }, 0);
          }
          return Promise.resolve();
        })
      }
    },
    runtime: {
      sendMessage: createMockFn(),
      onMessage: {
        addListener: createMockFn(),
        removeListener: createMockFn()
      }
    }
  };

  return global.chrome;
}

/**
 * SpeechRecognition APIをモック
 * @param {Object} options - モックオプション
 * @returns {Object} - モックされたSpeechRecognitionコンストラクタ
 */
export function setupSpeechRecognitionMock(options = {}) {
  class MockSpeechRecognition {
    constructor() {
      this.continuous = false;
      this.interimResults = false;
      this.lang = 'ja-JP';
      this.maxAlternatives = 1;
      this.onstart = null;
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
    }

    start() {
      if (this.onstart) {
        this.onstart(new Event('start'));
      }

      // 成功結果をシミュレート（指定されていれば）
      if (options.simulateResult && this.onresult) {
        setTimeout(() => {
          const resultEvent = {
            results: [
              [{
                transcript: options.resultText || 'テストテキスト',
                confidence: 0.9
              }]
            ],
            resultIndex: 0
          };
          this.onresult(resultEvent);
        }, options.resultDelay || 500);
      }

      // エラーをシミュレート（指定されていれば）
      if (options.simulateError && this.onerror) {
        setTimeout(() => {
          const errorEvent = {
            error: options.errorType || 'network',
            message: options.errorMessage || 'Network error'
          };
          this.onerror(errorEvent);
        }, options.errorDelay || 300);
      }

      // 終了をシミュレート
      if (this.onend) {
        setTimeout(() => {
          this.onend(new Event('end'));
        }, options.endDelay || 1000);
      }
    }

    stop() {
      if (this.onend) {
        this.onend(new Event('end'));
      }
    }

    abort() {
      if (this.onend) {
        this.onend(new Event('end'));
      }
    }
  }

  // グローバルオブジェクトにモックを追加
  global.SpeechRecognition = MockSpeechRecognition;
  global.webkitSpeechRecognition = MockSpeechRecognition;

  return MockSpeechRecognition;
}

/**
 * UIモジュールの主要関数をモック
 * @returns {Object} - モックされたUI関数
 */
export function setupUIMock() {
  const mocks = {
    showStatus: createMockFn(),
    updateProcessingState: createMockFn(),
    createUI: createMockFn(),
    toggleMenu: createMockFn(),
    showRecognitionResult: createMockFn()
  };
  
  return mocks;
}

/**
 * 特定のAIチャットプラットフォームハンドラーをモック
 * @param {string} platformType - プラットフォームタイプ ('chatgpt', 'claude', 'gemini')
 * @param {Object} options - モックオプション
 * @returns {Object} - モックされたハンドラー
 */
export function setupPlatformHandlerMock(platformType, options = {}) {
  const defaultHandlerMethods = {
    submitAfterVoiceInput: createMockFn().mockReturnValue(true),
    findSubmitButtonForInput: createMockFn().mockReturnValue(document.createElement('button')),
    findBestInputField: createMockFn().mockReturnValue(document.createElement('textarea'))
  };

  // プラットフォーム固有のメソッドを追加
  const platformSpecificMethods = {
    chatgpt: {
      isChatGPTSite: createMockFn().mockReturnValue(platformType === 'chatgpt'),
      findChatGPTSubmitButton: createMockFn().mockReturnValue(document.createElement('button'))
    },
    claude: {
      isClaudeSite: createMockFn().mockReturnValue(platformType === 'claude'),
      findClaudeSubmitButton: createMockFn().mockReturnValue(document.createElement('button'))
    },
    gemini: {
      isGeminiSite: createMockFn().mockReturnValue(platformType === 'gemini'),
      findGeminiSubmitButton: createMockFn().mockReturnValue(document.createElement('button'))
    }
  };

  // プラットフォーム固有のメソッドをデフォルトにマージ
  const handlerMethods = {
    ...defaultHandlerMethods,
    ...(platformSpecificMethods[platformType] || {})
  };

  // オプションでオーバーライド
  Object.keys(options).forEach(key => {
    if (handlerMethods[key]) {
      handlerMethods[key] = createMockFn().mockImplementation(options[key]);
    }
  });

  return handlerMethods;
}

/**
 * 全てのモックをリセット/復元するヘルパー
 */
export function resetAllMocks() {
  // Jestのモックをクリア
  jest.clearAllMocks();
  
  // グローバルオブジェクトのモックをリセット
  delete global.chrome;
  delete global.SpeechRecognition;
  delete global.webkitSpeechRecognition;
  
  // 他にリセットが必要なグローバルモックがあれば追加
}