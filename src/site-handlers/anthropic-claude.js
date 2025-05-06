/**
 * Anthropic Claude Site Handler
 * Provides processing for Anthropic's Claude interface
 */

import { showStatus } from '../modules/ui.js';
import { retryInputEvents } from '../modules/utils.js';

/**
 * Claude特有のセレクター
 */
const CLAUDE_SELECTORS = [
    // 英語と日本語に対応
    'button[aria-label="Send message"]',
    'button[aria-label="メッセージを送信"]',
    '.claude-submit-button',
    'button.bg-accent-main-000',
    // Claude.ai上向き矢印アイコン
    'button svg[viewBox="0 0 256 256"]',
];

/**
 * Claude特有の送信ボタン検出
 * @returns {Element|null} 検出されたボタンまたはnull
 */
export function findClaudeSubmitButton() {
    // セレクターによる検索
    for (const selector of CLAUDE_SELECTORS) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
            // Filter only visible buttons
            const visibleButtons = Array.from(buttons).filter(button => {
                const style = window.getComputedStyle(button);
                const rect = button.getBoundingClientRect();

                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       style.opacity !== '0' &&
                       rect.width > 0 &&
                       rect.height > 0;
            });

            if (visibleButtons.length > 0) {
                return visibleButtons[0]; // Return the first visible button
            }
        }
    }

    return null;
}

/**
 * ボタンが無効状態かどうかを確認する
 * @param {Element} button - チェックするボタン
 * @returns {boolean} 無効の場合はtrue
 */
function isButtonDisabled(button) {
    return button.disabled ||
           button.getAttribute('aria-disabled') === 'true' ||
           button.classList.contains('disabled') ||
           button.classList.contains('cursor-not-allowed') ||
           button.classList.contains('opacity-50') ||
           getComputedStyle(button).opacity < '0.9';
}

/**
 * 音声入力後の自動送信処理
 * @returns {boolean} 送信処理が開始された場合はtrue
 */
export function submitAfterVoiceInput() {
    // Claude送信ボタンを検索
    const submitButton = findClaudeSubmitButton();

    if (submitButton) {
        // ボタンが無効状態かチェック
        if (isButtonDisabled(submitButton)) {
            console.log(chrome.i18n.getMessage('logSubmitButtonDisabled'));

            // イベント再試行によるReact状態更新促進
            if (typeof retryInputEvents === 'function') {
                retryInputEvents();
            }
            return false;
        }

        // ボタンをハイライト
        const originalBackgroundColor = submitButton.style.backgroundColor;
        submitButton.style.backgroundColor = '#4CAF50';

        // 少し待機してから送信
        setTimeout(() => {
            submitButton.style.backgroundColor = originalBackgroundColor;
            submitButton.click();
            
            // ステータス表示
            if (typeof showStatus === 'function') {
                showStatus('statusSubmitClicked');
            }
        }, 300);
        return true;
    }
    
    return false;
}

/**
 * 入力フィールドに関連する送信ボタンを検出
 * @param {Element} inputElement - 入力要素
 * @returns {Element|null} 送信ボタン要素またはnull
 */
export function findSubmitButtonForInput(inputElement) {
    return findClaudeSubmitButton();
}

/**
 * Claudeの入力フィールドを検出
 * @returns {Element|null} 入力要素またはnull
 */
export function findBestInputField() {
    // Claude特有のテキストエリア
    const textarea = document.querySelector('textarea[placeholder="Message Claude..."], textarea[placeholder="Claudeにメッセージを送信..."]');
    if (textarea) {
        return textarea;
    }
    
    return null;
}

/**
 * 現在のページがAnthropicのClaudeか判定
 * @returns {boolean} Claudeの場合true
 */
export function isClaudeSite() {
    const hostname = window.location.hostname;
    return hostname.includes('claude.ai') || 
           hostname.includes('anthropic.com');
}