/**
 * ai-chat.js (AIチャットディスパッチャー) のテスト
 */

import * as AIChatHandler from '../../site-handlers/ai-chat.js';
import * as OpenAIChatGPT from '../../site-handlers/openai-chatgpt.js';
import * as AnthropicClaude from '../../site-handlers/anthropic-claude.js';
import * as GoogleGemini from '../../site-handlers/google-gemini.js';

// モック関数を設定
beforeEach(() => {
  // ウィンドウロケーションのモック
  delete window.location;
  window.location = { hostname: '' };
  
  // 各ハンドラーのサイト検出メソッドをモック
  jest.spyOn(OpenAIChatGPT, 'isChatGPTSite').mockImplementation(() => false);
  jest.spyOn(AnthropicClaude, 'isClaudeSite').mockImplementation(() => false);
  jest.spyOn(GoogleGemini, 'isGeminiSite').mockImplementation(() => false);
  
  // 各ハンドラーのメソッドをモック
  jest.spyOn(OpenAIChatGPT, 'submitAfterVoiceInput').mockImplementation(() => true);
  jest.spyOn(AnthropicClaude, 'submitAfterVoiceInput').mockImplementation(() => true);
  jest.spyOn(GoogleGemini, 'submitAfterVoiceInput').mockImplementation(() => true);
  
  jest.spyOn(OpenAIChatGPT, 'findSubmitButtonForInput').mockImplementation(() => document.createElement('button'));
  jest.spyOn(AnthropicClaude, 'findSubmitButtonForInput').mockImplementation(() => document.createElement('button'));
  jest.spyOn(GoogleGemini, 'findSubmitButtonForInput').mockImplementation(() => document.createElement('button'));
  
  // コンソールログをモック
  global.console.log = jest.fn();
});

// テスト後にモックをリセット
afterEach(() => {
  jest.restoreAllMocks();
});

describe('AI Chat Dispatcher Tests', () => {
  // OpenAI ChatGPTサイト検出のテスト
  it('should detect OpenAI ChatGPT site and use its handler', () => {
    // OpenAI ChatGPTのドメインを設定
    window.location.hostname = 'chat.openai.com';
    
    // メソッドを呼び出す
    AIChatHandler.submitAfterVoiceInput();
    
    // 正しいハンドラーが呼び出されたことを確認
    expect(OpenAIChatGPT.submitAfterVoiceInput).toHaveBeenCalled();
    expect(AnthropicClaude.submitAfterVoiceInput).not.toHaveBeenCalled();
    expect(GoogleGemini.submitAfterVoiceInput).not.toHaveBeenCalled();
  });
  
  // Anthropic Claudeサイト検出のテスト
  it('should detect Anthropic Claude site and use its handler', () => {
    // Anthropic Claudeのドメインを設定
    window.location.hostname = 'claude.ai';
    
    // メソッドを呼び出す
    AIChatHandler.submitAfterVoiceInput();
    
    // 正しいハンドラーが呼び出されたことを確認
    expect(AnthropicClaude.submitAfterVoiceInput).toHaveBeenCalled();
    expect(OpenAIChatGPT.submitAfterVoiceInput).not.toHaveBeenCalled();
    expect(GoogleGemini.submitAfterVoiceInput).not.toHaveBeenCalled();
  });
  
  // Google Geminiサイト検出のテスト
  it('should detect Google Gemini site and use its handler', () => {
    // Google Geminiのドメインを設定
    window.location.hostname = 'gemini.google.com';
    
    // メソッドを呼び出す
    AIChatHandler.submitAfterVoiceInput();
    
    // 正しいハンドラーが呼び出されたことを確認
    expect(GoogleGemini.submitAfterVoiceInput).toHaveBeenCalled();
    expect(OpenAIChatGPT.submitAfterVoiceInput).not.toHaveBeenCalled();
    expect(AnthropicClaude.submitAfterVoiceInput).not.toHaveBeenCalled();
  });
  
  // 特定のサイト検出関数のオーバーライドテスト
  it('should use handler when its detection function returns true', () => {
    // どのドメインにも一致しないホスト名を設定
    window.location.hostname = 'unknown-ai-chat.com';
    
    // 特定の検出関数がtrueを返すようにする
    AnthropicClaude.isClaudeSite.mockImplementation(() => true);
    
    // メソッドを呼び出す
    AIChatHandler.submitAfterVoiceInput();
    
    // 対応するハンドラーが選択されることを確認
    expect(AnthropicClaude.submitAfterVoiceInput).toHaveBeenCalled();
    expect(OpenAIChatGPT.submitAfterVoiceInput).not.toHaveBeenCalled();
    expect(GoogleGemini.submitAfterVoiceInput).not.toHaveBeenCalled();
  });
  
  // 不明なサイト時のフォールバックテスト
  it('should fall back to OpenAI handler for unknown sites', () => {
    // どのドメインにも一致しないホスト名を設定
    window.location.hostname = 'unknown-ai-site.com';
    
    // メソッドを呼び出す
    AIChatHandler.submitAfterVoiceInput();
    
    // デフォルトでOpenAIハンドラーが使用されることを確認
    expect(OpenAIChatGPT.submitAfterVoiceInput).toHaveBeenCalled();
    expect(AnthropicClaude.submitAfterVoiceInput).not.toHaveBeenCalled();
    expect(GoogleGemini.submitAfterVoiceInput).not.toHaveBeenCalled();
  });
  
  // findSubmitButtonForInputのテスト
  it('should use correct handler for findSubmitButtonForInput', () => {
    // Geminiのドメインを設定
    window.location.hostname = 'gemini.google.com';
    
    // メソッドを呼び出す
    const button = AIChatHandler.findSubmitButtonForInput();
    
    // 正しいハンドラーのメソッドが呼び出されたことを確認
    expect(GoogleGemini.findSubmitButtonForInput).toHaveBeenCalled();
    expect(button).toBeDefined();
  });
});