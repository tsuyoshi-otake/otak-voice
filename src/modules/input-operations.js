/**
 * Input Operations Module
 * Provides input field operations and related functionality
 */
import { getSiteHandler } from '../site-handlers/site-detector.js';
import { proofreadWithGPT } from './gpt-service.js';
import { PROCESSING_STATE } from '../constants.js';
import { getState, setState } from './state.js';
import { publishStatus as showStatus } from './event-bus.js';
import { toggleSettingsModal } from './ui-settings-modal.js';
import { createError, handleError, ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY } from './error-handler.js';
import {
    isInputElement,
    writeToInputField as domWriteToInputField,
    clearInputField as domClearInputField,
    findBestInputField as domFindBestInputField
} from './dom-utils.js';

/**
 * 最適な入力フィールドを探します
 * @returns {Element|null} 入力要素またはnull
 */
export function findBestInputField() {
    const siteHandler = getSiteHandler();
    if (siteHandler && typeof siteHandler.findBestInputField === 'function') {
        const inputField = siteHandler.findBestInputField();
        if (inputField) return inputField;
    }
    return domFindBestInputField();
}

/** 音声入力後に送信します */
export function submitAfterVoiceInput() {
    const siteHandler = getSiteHandler();
    if (siteHandler && typeof siteHandler.submitAfterVoiceInput === 'function') {
        return siteHandler.submitAfterVoiceInput();
    }
    return false;
}

/**
 * 入力フィールドにテキストを書き込みます
 * @param {Element} el - 入力要素
 * @param {string} txt - 書き込むテキスト
 */
export function writeToInputField(el, txt) {
    if (!el) return;
    const result = domWriteToInputField(el, txt);
    if (!result) {
        console.error(chrome.i18n.getMessage('logWriteToInputFieldFailed'));
        const appError = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
            'Failed to write to input field',
            null, { element: el, text: txt }, ERROR_SEVERITY.WARNING
        );
        handleError(appError, false, false, 'input-handler');
    }
}

/**
 * React対応のタイピングシミュレーション
 * @param {Element} element - 入力要素
 * @param {string} text - 入力するテキスト
 * @returns {boolean} 成功したらtrue
 */
export function simulateTypingIntoElement(element, text) {
    if (!element || text === undefined || text === null) return false;
    const result = domWriteToInputField(element, text);
    if (result) return true;
    console.error(chrome.i18n.getMessage('logTypingSimulateError'));
    const appError = createError(
        ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
        'Failed to simulate typing into element',
        null, { element, text }, ERROR_SEVERITY.WARNING
    );
    handleError(appError, false, false, 'input-handler');
    return false;
}

/** 現在の入力内容をクリアします */
export function clearCurrentInput() {
    // クリアボタンクリック前のアクティブ要素を保存
    const previousActiveElement = document.activeElement;
    const wasPreviousElementInput = isInputElement(previousActiveElement);
    // 元の要素が入力要素だった場合は、それを使用
    if (wasPreviousElementInput) {
        let targetElement = previousActiveElement;
        if (domClearInputField(targetElement)) {
            // 追記モード時の元テキストもクリア
            const currentInputElement = getState('currentInputElement');
            if (targetElement === currentInputElement) setState('originalText', '');
            showStatus('statusClearSuccess');
            return;
        }
    }
    // 現在フォーカスされている要素またはクリックされた入力要素を取得
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        const lastClickedInput = getState('lastClickedInput');
        if (lastClickedInput && isInputElement(lastClickedInput)) {
            targetElement = lastClickedInput;
        } else if (getState('autoDetectInputFields')) {
            targetElement = findBestInputField();
        } else {
            targetElement = null;
        }
        if (targetElement) {
            targetElement.focus();
            showStatus('statusInputFound');
        } else {
            if (!getState('autoDetectInputFields')) {
                showStatus('statusAutoDetectOff');
            } else {
                showStatus('statusClearNotFound');
            }
            return;
        }
    }
    // DOM抽象化レイヤーを使用して入力フィールドをクリア
    if (domClearInputField(targetElement)) {
        const currentInputElement = getState('currentInputElement');
        if (targetElement === currentInputElement) setState('originalText', '');
        showStatus('statusClearSuccess');
    } else {
        const appError = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
            'Failed to clear input field',
            null, { element: targetElement }, ERROR_SEVERITY.WARNING
        );
        handleError(appError, false, false, 'input-handler');
    }
}

/** フォーム内容を校閲します */
export async function proofreadCurrentInput() {
    // 処理中の場合は実行しない
    const processingState = getState('processingState');
    if (processingState && processingState !== PROCESSING_STATE.IDLE) {
        showStatus('statusProcessingInProgress');
        return;
    }
    setState('processingState', PROCESSING_STATE.PROOFREADING);
    // 現在フォーカスされている要素またはクリックされた入力要素を取得
    let currentInputElement = document.activeElement;
    if (!isInputElement(currentInputElement)) {
        const lastClickedInput = getState('lastClickedInput');
        if (lastClickedInput && isInputElement(lastClickedInput)) {
            currentInputElement = lastClickedInput;
        } else if (getState('autoDetectInputFields')) {
            currentInputElement = findBestInputField();
        } else {
            currentInputElement = null;
        }
        if (currentInputElement) {
            currentInputElement.focus();
            setState('currentInputElement', currentInputElement);
            showStatus('statusInputFound');
        } else {
            if (!getState('autoDetectInputFields')) {
                showStatus('statusAutoDetectOff');
            } else {
                showStatus('statusProofreadNotFound');
            }
            setState('processingState', PROCESSING_STATE.IDLE);
            return;
        }
    } else {
        setState('currentInputElement', currentInputElement);
    }
    // 入力内容を取得
    let content;
    if (currentInputElement.isContentEditable) {
        content = currentInputElement.textContent || '';
    } else {
        content = currentInputElement.value || '';
    }
    // 入力内容が空の場合
    if (!content.trim()) {
        showStatus('statusProofreadEmpty');
        setState('processingState', PROCESSING_STATE.IDLE);
        return;
    }
    // APIキーがない場合は設定モーダルを開く
    const apiKey = getState('apiKey');
    if (!apiKey || apiKey.trim() === '') {
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY,
            null, null, null, ERROR_SEVERITY.WARNING
        );
        handleError(error, true, false, 'input-handler');
        setState('processingState', PROCESSING_STATE.IDLE);
        toggleSettingsModal();
        return;
    }
    // 校閲中のステータス表示（永続表示）
    showStatus('statusProofreading', undefined, true);
    try {
        const corrected = await proofreadWithGPT(content);
        if (corrected) {
            // React対応：タイピングシミュレーションを試す
            if (simulateTypingIntoElement(currentInputElement, corrected)) {
                // showStatus('React対応：タイピングシミュレーションで入力しました'); // Internal log
            } else {
                // フォールバック
                if (currentInputElement.isContentEditable) {
                    currentInputElement.textContent = corrected;
                } else {
                    currentInputElement.value = corrected;
                }
                currentInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                currentInputElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
            showStatus('statusProofreadSuccess');
            setState('processingState', PROCESSING_STATE.IDLE);
        } else {
            // corrected が null や undefined の場合のエラー処理は proofreadWithGPT 内で行われる想定
            showStatus('statusProofreadError');
            setState('processingState', PROCESSING_STATE.IDLE);
        }
    } catch (error) {
        if (error.name === 'AppError') {
            handleError(error, true, false, 'input-handler');
        } else {
            const appError = createError(
                ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR,
                null, error, null, ERROR_SEVERITY.ERROR
            );
            handleError(appError, true, false, 'input-handler');
        }
        setState('processingState', PROCESSING_STATE.IDLE);
    }
}

/**
 * Enterキー押下時の処理ハンドラ
 * @param {KeyboardEvent} e - イベントオブジェクト
 */
function handleEnterKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        // textareaの場合は複数行入力を許可するため、Ctrl+Enterのみで送信
        if (this.tagName.toLowerCase() === 'textarea' && !e.ctrlKey) return;
        setState('currentInputElement', this);
        // 送信ボタンを探して自動クリック（モーダルウィンドウを使用していない場合のみ）
        if (!getState('useRecognitionModal')) submitAfterVoiceInput();
    }
}

/** 入力要素のハンドラを強化します (Enterキーでの送信など) */
export function enhanceInputElementHandlers() {
    const inputElements = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
    inputElements.forEach(el => {
        el.removeEventListener('keydown', handleEnterKey);
        el.addEventListener('keydown', handleEnterKey);
    });
}
