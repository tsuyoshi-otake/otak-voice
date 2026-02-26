/**
 * Anthropic Claude Site Handler
 * Provides processing for Anthropic's Claude interface
 */

import { retryInputEvents } from '../modules/utils.js';
import { isButtonDisabled, filterVisibleElements, clickButtonWithFeedback } from '../modules/dom-utils.js';
import { UI_FEEDBACK } from '../constants.js';

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
    try {
        // セレクターによる検索
        for (const selector of CLAUDE_SELECTORS) {
            const buttons = document.querySelectorAll(selector);
            if (buttons.length > 0) {
                const visibleButtons = filterVisibleElements(buttons);

                if (visibleButtons.length > 0) {
                    return visibleButtons[0]; // Return the first visible button
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding submit button:', error);
        return null;
    }
}

/**
 * 音声入力後の自動送信処理
 * @returns {boolean} 送信処理が開始された場合はtrue
 */
export function submitAfterVoiceInput() {
    try {
        const submitButton = findClaudeSubmitButton();
        if (submitButton) {
            if (isButtonDisabled(submitButton)) {
                console.log(chrome.i18n.getMessage('logSubmitButtonDisabled'));
                retryInputEvents();
                return false;
            }
            return clickButtonWithFeedback(submitButton, UI_FEEDBACK.SUBMIT_DELAY_MS);
        }
        return false;
    } catch (error) {
        console.error('Error submitting after voice input:', error);
        return false;
    }
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

    // Fallback: ProseMirror contenteditable div used by Claude
    const proseMirror = document.querySelector('div.ProseMirror[contenteditable="true"], div[contenteditable="true"][data-placeholder]');
    if (proseMirror) {
        return proseMirror;
    }

    return null;
}

/**
 * 現在のページがAnthropicのClaudeか判定
 * @returns {boolean} Claudeの場合true
 */
export function isClaudeSite() {
    const hostname = window.location.hostname;
    return hostname.includes('claude.ai');
}