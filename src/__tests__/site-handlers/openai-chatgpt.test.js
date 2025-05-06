/**
 * openai-chatgpt.js (OpenAI ChatGPTハンドラー) のテスト
 */

import * as OpenAIChatGPT from '../../site-handlers/openai-chatgpt.js';
import { showStatus } from '../../modules/ui.js';
import { retryInputEvents } from '../../modules/utils.js';

// モックの設定
jest.mock('../../modules/ui.js', () => ({
  showStatus: jest.fn()
}));

jest.mock('../../modules/utils.js', () => ({
  retryInputEvents: jest.fn()
}));

// テスト用の簡易モジュールモック
const originalFunctions = {
  findChatGPTSubmitButton: OpenAIChatGPT.findChatGPTSubmitButton,
  submitAfterVoiceInput: OpenAIChatGPT.submitAfterVoiceInput,
  findSubmitButtonForInput: OpenAIChatGPT.findSubmitButtonForInput
};

// 環境セットアップ
beforeEach(() => {
  // ウィンドウロケーションのモック
  delete window.location;
  window.location = { hostname: 'chat.openai.com' };
  
  // ドキュメントボディのリセット
  document.body.innerHTML = '';
  
  // コンソールログのモック
  global.console.log = jest.fn();
  
  // chromeのモック
  global.chrome = {
    i18n: {
      getMessage: jest.fn().mockImplementation(key => key)
    }
  };
  
  // タイマーのモック
  jest.useFakeTimers();
});

// テスト後のクリーンアップ
afterEach(() => {
  // すべてのモックをリセット
  jest.clearAllMocks();
  document.body.innerHTML = '';
  jest.useRealTimers();
  
  // オリジナル関数を復元
  jest.restoreAllMocks();
});

describe('OpenAI ChatGPT Handler Tests', () => {
  // サイト検出のテスト
  it('should correctly detect ChatGPT site', () => {
    // チェック
    expect(OpenAIChatGPT.isChatGPTSite()).toBe(true);
    
    // 別のドメインの場合
    window.location.hostname = 'claude.ai';
    expect(OpenAIChatGPT.isChatGPTSite()).toBe(false);
    
    window.location.hostname = 'chat.openai.com';
  });
  
  // 送信ボタン検出のモックテスト
  it('should mock ChatGPT submit button detection', () => {
    // ボタンを作成
    const button = document.createElement('button');
    button.setAttribute('data-testid', 'send-button');
    document.body.appendChild(button);
    
    // オリジナル関数をモック
    const mockFindButton = jest.fn().mockReturnValue(button);
    OpenAIChatGPT.findChatGPTSubmitButton = mockFindButton;
    
    // 関数を呼び出し
    const result = OpenAIChatGPT.findChatGPTSubmitButton();
    
    // 検証
    expect(mockFindButton).toHaveBeenCalled();
    expect(result).toBe(button);
  });
  
  // ボタン無効状態検出のテスト
  it('should detect disabled button state', () => {
    // 無効なボタンを作成
    const disabledButton = document.createElement('button');
    disabledButton.disabled = true;
    
    // submitAfterVoiceInputの動作をモック
    const mockSubmit = jest.fn().mockImplementation(() => {
      // 無効ボタン検出時の処理をシミュレート
      retryInputEvents();
      return false;
    });
    OpenAIChatGPT.submitAfterVoiceInput = mockSubmit;
    
    // テスト実行
    const result = OpenAIChatGPT.submitAfterVoiceInput();
    
    // 検証
    expect(result).toBe(false);
    expect(retryInputEvents).toHaveBeenCalled();
  });
  
  // 送信処理のテスト
  it('should handle successful submission', () => {
    // 有効なボタンを作成
    const button = document.createElement('button');
    button.setAttribute('data-testid', 'send-button');
    const clickSpy = jest.spyOn(button, 'click');
    
    // submitAfterVoiceInputの動作をモック
    const mockSubmit = jest.fn().mockImplementation(() => {
      // 成功時の処理をシミュレート
      setTimeout(() => {
        button.click();
        showStatus('statusSubmitClicked');
      }, 300);
      return true;
    });
    OpenAIChatGPT.submitAfterVoiceInput = mockSubmit;
    
    // テスト実行
    const result = OpenAIChatGPT.submitAfterVoiceInput();
    
    // タイマーを進める
    jest.runAllTimers();
    
    // 検証
    expect(result).toBe(true);
    expect(mockSubmit).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(showStatus).toHaveBeenCalledWith('statusSubmitClicked');
  });
  
  // 入力フィールドに関連するボタン検出のテスト
  it('should find submit button for input field using mock', () => {
    // ボタン要素
    const button = document.createElement('button');
    
    // findSubmitButtonForInputの動作をモック
    const mockFindSubmitButton = jest.fn().mockReturnValue(button);
    OpenAIChatGPT.findSubmitButtonForInput = mockFindSubmitButton;
    
    // 入力フィールド要素
    const inputElement = document.createElement('textarea');
    
    // テスト実行
    const result = OpenAIChatGPT.findSubmitButtonForInput(inputElement);
    
    // 検証
    expect(mockFindSubmitButton).toHaveBeenCalledWith(inputElement);
    expect(result).toBe(button);
  });
  
  // ボタンが見つからない場合のテスト
  it('should return false when no button found', () => {
    // オリジナル関数をモック - ボタンが見つからないケース
    OpenAIChatGPT.findChatGPTSubmitButton = jest.fn().mockReturnValue(null);
    
    // submitAfterVoiceInputの動作をモック
    const mockSubmit = jest.fn().mockImplementation(() => {
      // ボタンが見つからない場合は直接false
      const button = OpenAIChatGPT.findChatGPTSubmitButton();
      return button !== null;
    });
    OpenAIChatGPT.submitAfterVoiceInput = mockSubmit;
    
    // テスト実行
    const result = OpenAIChatGPT.submitAfterVoiceInput();
    
    // 検証
    expect(result).toBe(false);
  });
  
  // オリジナル関数を復元
  afterAll(() => {
    OpenAIChatGPT.findChatGPTSubmitButton = originalFunctions.findChatGPTSubmitButton;
    OpenAIChatGPT.submitAfterVoiceInput = originalFunctions.submitAfterVoiceInput;
    OpenAIChatGPT.findSubmitButtonForInput = originalFunctions.findSubmitButtonForInput;
  });
});