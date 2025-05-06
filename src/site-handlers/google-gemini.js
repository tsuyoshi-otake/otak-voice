/**
 * Google Gemini Site Handler
 * Provides processing for Google's Gemini/Bard interface
 */

import { showStatus } from '../modules/ui.js';
import { retryInputEvents } from '../modules/utils.js';

/**
 * Gemini特有のセレクター
 */
const GEMINI_SELECTORS = [
    // 英語と日本語に対応
    'button[aria-label="Send"]',
    'button[aria-label="送信"]',
    'button.send-button',
    'button.mdc-button',
    'button.paper-plane-button',
];

/**
 * Gemini特有の送信ボタン検出
 * @returns {Element|null} 検出されたボタンまたはnull
 */
export function findGeminiSubmitButton() {
    // セレクターによる検索
    for (const selector of GEMINI_SELECTORS) {
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

    // ペーパープレーンアイコンを持つボタンも検索
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
        // Check if it has SVG with specific attributes or styles
        const svg = button.querySelector('svg');
        if (svg) {
            // Check for Material Design paper plane icon styles
            const rect = button.getBoundingClientRect();
            // 下部にあるボタン（フッターあたり）を優先的に検出
            if (rect.top > window.innerHeight * 0.7 && rect.width > 20 && rect.height > 20) {
                return button;
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
           button.getAttribute('disabled') === 'true' ||
           button.classList.contains('cursor-not-allowed') ||
           button.classList.contains('opacity-50') ||
           getComputedStyle(button).opacity < '0.9';
}

/**
 * 音声入力後の自動送信処理
 * @returns {boolean} 送信処理が開始された場合はtrue
 */
export function submitAfterVoiceInput() {
    // Gemini送信ボタンを検索
    const submitButton = findGeminiSubmitButton();

    if (submitButton) {
        // ボタンが無効状態かチェック
        if (isButtonDisabled(submitButton)) {
            console.log(chrome.i18n.getMessage('logSubmitButtonDisabled'));

            // イベント再試行によるフレームワーク状態更新促進
            if (typeof retryInputEvents === 'function') {
                retryInputEvents();
            }
            
            // Gemini/Bardは長めの待機時間が必要な場合がある
            setTimeout(() => {
                // 再度ボタンを取得して再試行
                const refreshedButton = findGeminiSubmitButton();
                if (refreshedButton && !isButtonDisabled(refreshedButton)) {
                    refreshedButton.click();
                }
            }, 800);
            
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
    return findGeminiSubmitButton();
}

/**
 * Geminiの入力フィールドを検出
 * @returns {Element|null} 入力要素またはnull
 */
export function findBestInputField() {
    // Gemini特有のテキスト入力
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
        // Text area with specific placeholders or attributes
        if (textarea.placeholder?.includes('Message Gemini') || 
            textarea.placeholder?.includes('Geminiにメッセージ') ||
            textarea.getAttribute('aria-label')?.includes('Prompt')) {
            return textarea;
        }
    }
    
    // フッター近くに配置されたテキストエリアを検索
    for (const textarea of textareas) {
        const rect = textarea.getBoundingClientRect();
        if (rect.top > window.innerHeight * 0.7) {
            return textarea;
        }
    }
    
    return null;
}

/**
 * 現在のページがGoogle Geminiか判定
 * @returns {boolean} Geminiの場合true
 */
export function isGeminiSite() {
    const hostname = window.location.hostname;
    return hostname.includes('gemini.google.com') || 
           hostname.includes('bard.google.com');
}