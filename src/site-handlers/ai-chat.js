/**
 * AI Chat Site Handler
 * ドメイン別のファイルにリダイレクトする中央ディスパッチャー
 *
 * この構成では、各AIチャットプラットフォームごとに専用のハンドラーファイルを用意します
 * ファイル名はドメイン名に対応（例: openai-chatgpt.js, anthropic-claude.js, google-gemini.js）
 */

import * as OpenAIChatGPT from './openai-chatgpt.js';
import * as AnthropicClaude from './anthropic-claude.js';
import * as GoogleGemini from './google-gemini.js';
import { showStatus } from '../modules/ui.js';
import { publish, EVENTS } from '../modules/event-bus.js';

/**
 * どのAIチャットプラットフォームかを検出
 * @returns {Object} 適切なドメインハンドラー
 */
function detectAIChatPlatform() {
    const hostname = window.location.hostname;
    
    // 各プラットフォームの検出関数をチェック
    if (typeof OpenAIChatGPT.isChatGPTSite === 'function' && OpenAIChatGPT.isChatGPTSite()) {
        console.log('Detected OpenAI ChatGPT site');
        return OpenAIChatGPT;
    }
    
    if (typeof AnthropicClaude.isClaudeSite === 'function' && AnthropicClaude.isClaudeSite()) {
        console.log('Detected Anthropic Claude site');
        return AnthropicClaude;
    }
    
    if (typeof GoogleGemini.isGeminiSite === 'function' && GoogleGemini.isGeminiSite()) {
        console.log('Detected Google Gemini site');
        return GoogleGemini;
    }
    
    // ドメイン名による直接検出
    if (hostname.includes('chat.openai.com')) {
        console.log('Detected OpenAI ChatGPT site by hostname');
        return OpenAIChatGPT;
    }
    
    if (hostname.includes('claude.ai') || hostname.includes('anthropic.com')) {
        console.log('Detected Anthropic Claude site by hostname');
        return AnthropicClaude;
    }
    
    if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
        console.log('Detected Google Gemini/Bard site by hostname');
        return GoogleGemini;
    }
    
    // 汎用ペーパープレーンボタン検出
    if (findGenericPaperPlaneButton()) {
        console.log('Detected generic AI chat site with paper plane button');
        // 最もよく使われているOpenAIハンドラーを使用
        return OpenAIChatGPT;
    }
    
    // デフォルトはOpenAIハンドラー
    console.log('Using default OpenAI handler for unknown AI chat site');
    return OpenAIChatGPT;
}

/**
 * 共通のペーパープレーンアイコンパターンを持つボタンを検出
 * @returns {boolean} 検出された場合true
 */
function findGenericPaperPlaneButton() {
    const allButtons = document.querySelectorAll('button');

    for (const button of allButtons) {
        // ペーパープレーンアイコンのSVGパターンをチェック
        const svg = button.querySelector('svg');
        if (svg) {
            const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
            const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');

            if (hasLine && hasPolygon) {
                return true;
            }
        }
    }

    return false;
}

/**
 * 音声入力後の自動送信処理
 * @returns {boolean} 送信処理が開始された場合はtrue
 */
export function submitAfterVoiceInput() {
    // 適切なドメインハンドラーを取得
    const handler = detectAIChatPlatform();
    
    // そのハンドラーの送信メソッドを呼び出し
    if (handler && typeof handler.submitAfterVoiceInput === 'function') {
        return handler.submitAfterVoiceInput();
    }
    
    // フォールバック: OpenAIハンドラー
    return OpenAIChatGPT.submitAfterVoiceInput();
}

/**
 * 入力フィールドに関連する送信ボタンを検出
 * @param {Element} inputElement - 入力要素
 * @returns {Element|null} 送信ボタン要素またはnull
 */
export function findSubmitButtonForInput(inputElement) {
    // 適切なドメインハンドラーを取得
    const handler = detectAIChatPlatform();
    
    // そのハンドラーの送信ボタン検出メソッドを呼び出し
    if (handler && typeof handler.findSubmitButtonForInput === 'function') {
        return handler.findSubmitButtonForInput(inputElement);
    }
    
    // フォールバック: OpenAIハンドラー
    return OpenAIChatGPT.findSubmitButtonForInput(inputElement);
}

/**
 * 最適な入力フィールドを検出
 * @returns {Element|null} 入力要素またはnull
 */
export function findBestInputField() {
    // 適切なドメインハンドラーを取得
    const handler = detectAIChatPlatform();
    
    // そのハンドラーの入力フィールド検出メソッドを呼び出し
    if (handler && typeof handler.findBestInputField === 'function') {
        return handler.findBestInputField();
    }
    
    // 一般的なAIチャット入力フィールド検出
    const chatTextareas = document.querySelectorAll('textarea[placeholder*="message"], textarea[placeholder*="メッセージ"]');
    if (chatTextareas.length > 0) {
        return chatTextareas[0];
    }
    
    return null;
}