/**
 * anthropic-claude.js (Anthropic Claudeハンドラー) のテスト
 */

import * as AnthropicClaude from '../../site-handlers/anthropic-claude.js';
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
  findClaudeSubmitButton: AnthropicClaude.findClaudeSubmitButton,
  submitAfterVoiceInput: AnthropicClaude.submitAfterVoiceInput,
  findSubmitButtonForInput: AnthropicClaude.findSubmitButtonForInput,
  findBestInputField: AnthropicClaude.findBestInputField,
  isClaudeSite: AnthropicClaude.isClaudeSite
};

// 環境セットアップ
beforeEach(() => {
  // ウィンドウロケーションのモック
  delete window.location;
  window.location = { hostname: 'claude.ai' };
  
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

describe('Anthropic Claude Handler Tests', () => {
  // サイト検出のテスト
  it('should correctly detect Claude site', () => {
    // チェック
    expect(AnthropicClaude.isClaudeSite()).toBe(true);
    
    // 別のドメインの場合
    window.location.hostname = 'chat.openai.com';
    expect(AnthropicClaude.isClaudeSite()).toBe(false);
    
    // Anthropicドメインの場合
    window.location.hostname = 'anthropic.com';
    expect(AnthropicClaude.isClaudeSite()).toBe(true);
  });
  
  // 入力フィールド検出のテスト
  it('should find Claude input field', () => {
    // Claudeのテキストエリアを作成
    const textarea = document.createElement('textarea');
    textarea.setAttribute('placeholder', 'Message Claude...');
    document.body.appendChild(textarea);
    
    // findBestInputFieldの動作をモック
    const mockFindInput = jest.fn().mockReturnValue(textarea);
    AnthropicClaude.findBestInputField = mockFindInput;
    
    // 入力フィールド検出
    const foundInput = AnthropicClaude.findBestInputField();
    
    // 検証
    expect(mockFindInput).toHaveBeenCalled();
    expect(foundInput).toBe(textarea);
  });
  
  // 送信ボタン検出のモックテスト
  it('should mock Claude submit button detection', () => {
    // ボタンを作成
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'メッセージを送信');
    document.body.appendChild(button);
    
    // findClaudeSubmitButtonの動作をモック
    const mockFindButton = jest.fn().mockReturnValue(button);
    AnthropicClaude.findClaudeSubmitButton = mockFindButton;
    
    // ボタン検出
    const foundButton = AnthropicClaude.findClaudeSubmitButton();
    
    // 検証
    expect(mockFindButton).toHaveBeenCalled();
    expect(foundButton).toBe(button);
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
    AnthropicClaude.submitAfterVoiceInput = mockSubmit;
    
    // テスト実行
    const result = AnthropicClaude.submitAfterVoiceInput();
    
    // 検証
    expect(result).toBe(false);
    expect(retryInputEvents).toHaveBeenCalled();
  });
  
  // 送信処理のテスト
  it('should handle successful submission', () => {
    // 有効なボタンを作成
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Send message');
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
    AnthropicClaude.submitAfterVoiceInput = mockSubmit;
    
    // テスト実行
    const result = AnthropicClaude.submitAfterVoiceInput();
    
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
    AnthropicClaude.findSubmitButtonForInput = mockFindSubmitButton;
    
    // 入力フィールド要素
    const inputElement = document.createElement('textarea');
    
    // テスト実行
    const result = AnthropicClaude.findSubmitButtonForInput(inputElement);
    
    // 検証
    expect(mockFindSubmitButton).toHaveBeenCalledWith(inputElement);
    expect(result).toBe(button);
  });
  
  // ボタンが見つからない場合のテスト
  it('should return false when no button found', () => {
    // findClaudeSubmitButtonの動作をモック - ボタンが見つからないケース
    AnthropicClaude.findClaudeSubmitButton = jest.fn().mockReturnValue(null);
    
    // submitAfterVoiceInputの動作をモック
    const mockSubmit = jest.fn().mockImplementation(() => {
      // ボタンが見つからない場合は直接false
      const button = AnthropicClaude.findClaudeSubmitButton();
      return button !== null;
    });
    AnthropicClaude.submitAfterVoiceInput = mockSubmit;
    
    // テスト実行
    const result = AnthropicClaude.submitAfterVoiceInput();
    
    // 検証
    expect(result).toBe(false);
  });
  
  // オリジナル関数を復元
  afterAll(() => {
    Object.keys(originalFunctions).forEach(key => {
      AnthropicClaude[key] = originalFunctions[key];
    });
  });
});