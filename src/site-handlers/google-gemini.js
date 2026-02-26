/**
 * Google Gemini Site Handler
 * Provides processing for Google's Gemini/Bard interface
 */

import { showStatus } from '../modules/ui.js';
import { retryInputEvents } from '../modules/utils.js';
import { isButtonDisabled, filterVisibleElements } from '../modules/dom-utils.js';

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
    // UI変更に備えて追加のセレクター
    'button[aria-label^="Send"]', // "Send"で始まるaria-label
    'button[data-testid="send-button"]',
    'button.gemini-send-button',
    'button[title="Send"]',
    'button[title="送信"]',
];

/**
 * Gemini特有の送信ボタン検出
 * @returns {Element|null} 検出されたボタンまたはnull
 */
export function findGeminiSubmitButton() {
    try {
        // セレクターによる検索（複数の検出戦略を試行）
        const buttonStrategies = [
            findButtonBySelector,
            findButtonByPosition,
            findButtonByAttribute,
            findButtonByIcon
        ];

        // 各戦略を順番に試行
        for (const strategy of buttonStrategies) {
            const button = strategy();
            if (button) {
                return button;
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding submit button:', error);
        return null;
    }
}

/**
 * 戦略1: セレクターによるボタン検索
 * @returns {Element|null} 検出されたボタンまたはnull
 */
function findButtonBySelector() {
    for (const selector of GEMINI_SELECTORS) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
            const visibleButtons = filterVisibleElements(buttons);

            if (visibleButtons.length > 0) {
                return visibleButtons[0]; // Return the first visible button
            }
        }
    }
    return null;
}

/**
 * 戦略2: 位置によるボタン検索（フッター付近）
 * @returns {Element|null} 検出されたボタンまたはnull
 */
function findButtonByPosition() {
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
        const rect = button.getBoundingClientRect();
        // 下部にあるボタン（フッターあたり）を優先的に検出
        if (rect.top > window.innerHeight * 0.7 && rect.width > 20 && rect.height > 20) {
            // ボタンのスタイルをチェック（無効でない場合）
            if (!isButtonDisabled(button)) {
                return button;
            }
        }
    }
    return null;
}

/**
 * 戦略3: 属性によるボタン検索
 * @returns {Element|null} 検出されたボタンまたはnull
 */
function findButtonByAttribute() {
    const allButtons = document.querySelectorAll('button');
    
    // 送信関連の属性を持つボタンを探す
    for (const button of allButtons) {
        // テキスト内容で判断
        const buttonText = button.innerText ? button.innerText.toLowerCase() : '';
        if (buttonText.includes('send') || buttonText.includes('送信')) {
            return button;
        }
        
        // class名で判断
        const classList = button.className ? button.className.toLowerCase() : '';
        if (classList.includes('send') || classList.includes('submit')) {
            return button;
        }
    }
    return null;
}

/**
 * 戦略4: アイコンによるボタン検索
 * @returns {Element|null} 検出されたボタンまたはnull
 */
function findButtonByIcon() {
    // ペーパープレーンアイコンを持つボタンも検索
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
        // SVGを持つボタンをチェック
        const svg = button.querySelector('svg');
        if (svg) {
            // 送信ボタンらしきSVGを検出
            const hasPath = svg.querySelector('path');
            const hasPolygon = svg.querySelector('polygon');
            const hasLine = svg.querySelector('line');
            
            // 紙飛行機アイコンに特徴的な要素
            if ((hasPolygon || hasPath) && hasLine) {
                const rect = button.getBoundingClientRect();
                if (rect.width > 20 && rect.height > 20) {
                    return button;
                }
            }
        }
    }
    return null;
}

/**
 * 音声入力後の自動送信処理
 * @returns {boolean} 送信処理が開始された場合はtrue
 */
export function submitAfterVoiceInput() {
    try {
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