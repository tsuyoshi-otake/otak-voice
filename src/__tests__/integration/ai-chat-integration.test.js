/**
 * AIチャットプラットフォーム連携のインテグレーションテスト
 * 
 * このテストファイルでは、複数のAIプラットフォームハンドラー間の連携と
 * ディスパッチャー機能の正確性をテストします。
 */

import * as AIChatHandler from '../../site-handlers/ai-chat.js';
import * as OpenAIChatGPT from '../../site-handlers/openai-chatgpt.js';
import * as AnthropicClaude from '../../site-handlers/anthropic-claude.js';
import * as GoogleGemini from '../../site-handlers/google-gemini.js';
import { setupLocationMock, createSubmitButton, createInputField } from '../../utils/dom-helpers.js';
import { setupChromeAPIMock, setupPlatformHandlerMock } from '../../utils/mock-helpers.js';

// テスト用のモックプラットフォーム設定
const PLATFORMS = [
  { name: 'OpenAI ChatGPT', hostname: 'chat.openai.com', handler: OpenAIChatGPT, methodName: 'isChatGPTSite' },
  { name: 'Anthropic Claude', hostname: 'claude.ai', handler: AnthropicClaude, methodName: 'isClaudeSite' },
  { name: 'Google Gemini', hostname: 'gemini.google.com', handler: GoogleGemini, methodName: 'isGeminiSite' }
];

describe('AI Chat Integration Tests', () => {
  beforeEach(() => {
    // 共通セットアップ
    document.body.innerHTML = '';
    jest.clearAllMocks();
    
    // chromeのモック
    setupChromeAPIMock();
    
    // 各プラットフォームのサイト検出メソッドをリセット
    jest.spyOn(OpenAIChatGPT, 'isChatGPTSite').mockImplementation(() => false);
    jest.spyOn(AnthropicClaude, 'isClaudeSite').mockImplementation(() => false);
    jest.spyOn(GoogleGemini, 'isGeminiSite').mockImplementation(() => false);
    
    // 各プラットフォームの送信メソッドをモック
    jest.spyOn(OpenAIChatGPT, 'submitAfterVoiceInput').mockImplementation(() => true);
    jest.spyOn(AnthropicClaude, 'submitAfterVoiceInput').mockImplementation(() => true);
    jest.spyOn(GoogleGemini, 'submitAfterVoiceInput').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * サイト検出とディスパッチのテスト
   * 各AIプラットフォームが正しく検出され、適切なハンドラーにディスパッチされることを確認
   */
  it('should correctly dispatch to the right handler based on hostname', () => {
    // 各プラットフォームを検証
    PLATFORMS.forEach(platform => {
      // セットアップ
      setupLocationMock(platform.hostname);
      
      // プラットフォーム固有の検出関数を有効化
      platform.handler[platform.methodName].mockReturnValue(true);
      
      // テスト実行
      AIChatHandler.submitAfterVoiceInput();
      
      // 検証
      expect(platform.handler.submitAfterVoiceInput).toHaveBeenCalled();
      
      // 他のプラットフォームは呼ばれていないことを確認
      PLATFORMS.filter(p => p.name !== platform.name).forEach(otherPlatform => {
        expect(otherPlatform.handler.submitAfterVoiceInput).not.toHaveBeenCalled();
      });
      
      // モックをリセット
      jest.clearAllMocks();
      platform.handler[platform.methodName].mockReturnValue(false);
    });
  });

  /**
   * 検出関数が優先されることを確認するテスト
   * ホスト名が別のものでも、検出関数がtrueを返せば対応するハンドラーが使われる
   */
  it('should prioritize detection function over hostname', () => {
    // 非対応ホスト名を設定
    setupLocationMock('unknown-ai-site.com');
    
    // Claudeの検出関数だけをtrueに
    AnthropicClaude.isClaudeSite.mockReturnValue(true);
    
    // テスト実行
    AIChatHandler.submitAfterVoiceInput();
    
    // Claudeハンドラーが呼ばれることを確認
    expect(AnthropicClaude.submitAfterVoiceInput).toHaveBeenCalled();
    expect(OpenAIChatGPT.submitAfterVoiceInput).not.toHaveBeenCalled();
    expect(GoogleGemini.submitAfterVoiceInput).not.toHaveBeenCalled();
  });

  /**
   * 未知のサイトでのデフォルトハンドラー使用テスト
   */
  it('should use OpenAI handler as fallback for unknown sites', () => {
    // 未知のホスト名を設定
    setupLocationMock('unknown-ai-site.com');
    
    // すべての検出関数をfalseに
    PLATFORMS.forEach(platform => {
      platform.handler[platform.methodName].mockReturnValue(false);
    });
    
    // テスト実行
    AIChatHandler.submitAfterVoiceInput();
    
    // デフォルトでOpenAIハンドラーが使われることを確認
    expect(OpenAIChatGPT.submitAfterVoiceInput).toHaveBeenCalled();
  });

  /**
   * 入力フィールド検出のプラットフォーム統合テスト
   */
  it('should find input field using the right platform handler', () => {
    // Geminiサイトを設定
    setupLocationMock('gemini.google.com');
    GoogleGemini.isGeminiSite.mockReturnValue(true);
    
    // 入力フィールドをモック
    const mockInput = createInputField({ placeholder: 'Message Gemini' });
    jest.spyOn(GoogleGemini, 'findBestInputField').mockReturnValue(mockInput);
    
    // テスト実行
    const result = AIChatHandler.findBestInputField();
    
    // 正しいハンドラーが呼ばれ、結果が返されることを確認
    expect(GoogleGemini.findBestInputField).toHaveBeenCalled();
    expect(result).toBe(mockInput);
  });

  /**
   * 送信ボタン検出のプラットフォーム統合テスト
   */
  it('should find submit button for input using the right platform handler', () => {
    // ChatGPTサイトを設定
    setupLocationMock('chat.openai.com');
    OpenAIChatGPT.isChatGPTSite.mockReturnValue(true);
    
    // 入力フィールドとボタンをセットアップ
    const mockInput = createInputField();
    const mockButton = createSubmitButton({ testId: 'send-button' });
    
    // OpenAI handler のfindSubmitButtonForInputをモック
    jest.spyOn(OpenAIChatGPT, 'findSubmitButtonForInput').mockReturnValue(mockButton);
    
    // テスト実行
    const result = AIChatHandler.findSubmitButtonForInput(mockInput);
    
    // 正しいハンドラーが呼ばれ、結果が返されることを確認
    expect(OpenAIChatGPT.findSubmitButtonForInput).toHaveBeenCalledWith(mockInput);
    expect(result).toBe(mockButton);
  });

  /**
   * 複数のプラットフォームが連携する複雑なシナリオのテスト
   * プラットフォーム間の切り替えをシミュレート
   */
  it('should handle switching between platforms', () => {
    // まずChatGPTとして検出
    setupLocationMock('chat.openai.com');
    OpenAIChatGPT.isChatGPTSite.mockReturnValue(true);
    
    // 1回目の実行 (ChatGPT)
    AIChatHandler.submitAfterVoiceInput();
    expect(OpenAIChatGPT.submitAfterVoiceInput).toHaveBeenCalled();
    
    // リセット
    jest.clearAllMocks();
    
    // Claudeに切り替え
    setupLocationMock('claude.ai');
    OpenAIChatGPT.isChatGPTSite.mockReturnValue(false);
    AnthropicClaude.isClaudeSite.mockReturnValue(true);
    
    // 2回目の実行 (Claude)
    AIChatHandler.submitAfterVoiceInput();
    expect(AnthropicClaude.submitAfterVoiceInput).toHaveBeenCalled();
    expect(OpenAIChatGPT.submitAfterVoiceInput).not.toHaveBeenCalled();
    
    // リセット
    jest.clearAllMocks();
    
    // Geminiに切り替え
    setupLocationMock('gemini.google.com');
    AnthropicClaude.isClaudeSite.mockReturnValue(false);
    GoogleGemini.isGeminiSite.mockReturnValue(true);
    
    // 3回目の実行 (Gemini)
    AIChatHandler.submitAfterVoiceInput();
    expect(GoogleGemini.submitAfterVoiceInput).toHaveBeenCalled();
    expect(AnthropicClaude.submitAfterVoiceInput).not.toHaveBeenCalled();
    expect(OpenAIChatGPT.submitAfterVoiceInput).not.toHaveBeenCalled();
  });

  /**
   * ペーパープレーンアイコン検出のテスト
   * 汎用的なアイコン検出がfallbackとして機能するか
   */
  it('should detect paper plane icon for unknown sites', () => {
    // 未知のサイトを設定
    setupLocationMock('unknown-ai-chat.com');
    
    // findGenericPaperPlaneButtonの挙動をモック
    const originalMethod = AIChatHandler.findGenericPaperPlaneButton;
    AIChatHandler.findGenericPaperPlaneButton = jest.fn().mockReturnValue(true);
    
    // テスト実行
    AIChatHandler.submitAfterVoiceInput();
    
    // OpenAIハンドラーが使われることを確認 (ペーパープレーンアイコン検出時のデフォルト)
    expect(OpenAIChatGPT.submitAfterVoiceInput).toHaveBeenCalled();
    
    // 関数を元に戻す
    AIChatHandler.findGenericPaperPlaneButton = originalMethod;
  });

  /**
   * エラー処理のテスト
   * ハンドラーが例外をスローした場合の処理
   */
  it('should handle errors from handlers gracefully', () => {
    // ChatGPTサイトを設定
    setupLocationMock('chat.openai.com');
    OpenAIChatGPT.isChatGPTSite.mockReturnValue(true);
    
    // エラーをスローするようモック
    OpenAIChatGPT.submitAfterVoiceInput.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    // コンソールエラーをモック
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // テスト実行 - 直接関数を呼び出す（expect().not.toThrow()を使わない）
    let threwError = false;
    try {
      AIChatHandler.submitAfterVoiceInput();
    } catch (error) {
      threwError = true;
    }
    
    // ai-chat.js にエラーハンドリングを追加したので、
    // 例外は発生せず、エラーはログに記録されるはず
    expect(threwError).toBe(false);
    expect(console.error).toHaveBeenCalled();
    
    // 元に戻す
    console.error = originalConsoleError;
  });
});