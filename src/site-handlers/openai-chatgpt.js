/**
 * OpenAI ChatGPT Site Handler
 * Provides processing for OpenAI's ChatGPT interface
 */

import { showStatus } from '../modules/ui.js';
import { retryInputEvents } from '../modules/utils.js';
import { isButtonDisabled, filterVisibleElements } from '../modules/dom-utils.js';

/**
 * OpenAI特有のセレクター
 */
const CHATGPT_SELECTORS = [
    'form.stretch button.absolute',
    'button[data-testid="send-button"]',
    'button.send-button-container',
];

/**
 * OpenAI ChatGPT特有の送信ボタン検出
 * @returns {Element|null} 検出されたボタンまたはnull
 */
export function findChatGPTSubmitButton() {
    try {
        // セレクターによる検索
        for (const selector of CHATGPT_SELECTORS) {
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
        // ChatGPT送信ボタンを検索
        const submitButton = findChatGPTSubmitButton();

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
    return findChatGPTSubmitButton();
}

/**
 * ChatGPTの入力フィールドを検出
 * @returns {Element|null} 入力要素またはnull
 */
export function findBestInputField() {
    // ChatGPT uses a contenteditable div or textarea for input
    const selectors = [
        'textarea[data-id="root"]',
        '#prompt-textarea',
        'div[contenteditable="true"][data-placeholder]',
        'div.ProseMirror[contenteditable="true"]',
        'textarea'
    ];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) return el;
    }
    return null;
}

/**
 * 現在のページがOpenAI ChatGPTか判定
 * @returns {boolean} OpenAI ChatGPTの場合true
 */
export function isChatGPTSite() {
    const hostname = window.location.hostname;
    return hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com');
}