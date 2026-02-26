/**
 * Input Field Operation Module
 * Provides input field operations and related functionality
 */

import { getSiteHandler } from '../site-handlers/site-detector.js';
import { proofreadWithGPT } from './gpt-service.js';
import { DEFAULT_SETTINGS, PROCESSING_STATE, THEME_MODES } from '../constants.js'; // Import from constants
import { MENU_ICON } from '../icons.js'; // Import MENU_ICON directly
import { getState, setState, subscribe, initializeState } from './state.js'; // Import state management
import { publish, subscribe as eventSubscribe, EVENTS } from './event-bus.js'; // Import event bus
import { updateSettingsModalValues } from './ui.js'; // Import updateSettingsModalValues from ui.js
import {
    createError,
    handleError,
    tryCatch,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './error-handler.js';
import {
    isInputElement,
    writeToInputField as domWriteToInputField,
    clearInputField as domClearInputField,
    findBestInputField as domFindBestInputField,
    dispatchEvent
} from './dom-utils.js';

// Storage keys
export const MENU_EXPANDED_STORAGE_KEY = 'menu_expanded_state';
export const AUTO_SUBMIT_STORAGE_KEY = 'otak_voice_auto_submit_state';

// Variables for append mode
// Local variable removed because we use window.originalText
let interimText = ""; // Interim recognition result
let menuExpanded = false; // Menu expanded state
const keydownHandlers = new Map(); // Map of elements and keydown handlers

/**
 * Toggle menu display
 */
/**
 * Load menu state
 * @returns {Promise<void>} Promise resolved when loading is complete
 */
export async function loadMenuState() {
    // Use tryCatch to handle errors
    const result = await tryCatch(
        async () => {
            try {
                return await chrome.storage.sync.get([MENU_EXPANDED_STORAGE_KEY]);
            } catch (storageError) {
                // Create and handle storage error
                const error = createError(
                    ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
                    null,
                    storageError,
                    { key: MENU_EXPANDED_STORAGE_KEY },
                    ERROR_SEVERITY.WARNING
                );
                handleError(error, false, false, 'input-handler');
                
                // Return empty object as fallback
                return {};
            }
        },
        {
            errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
            showNotification: false,
            source: 'input-handler'
        }
    );
    
    // Set menu state with fallback to default
    if (result && result[MENU_EXPANDED_STORAGE_KEY] !== undefined) {
        menuExpanded = result[MENU_EXPANDED_STORAGE_KEY];
    } else {
        menuExpanded = false; // Default value
    }
}

/**
 * Load auto submit state
 * @returns {Promise<void>} Promise resolved when loading is complete
 */
export async function loadAutoSubmitState() {
    console.log('Loading auto submit state from storage...');
    // Use tryCatch to handle errors
    const result = await tryCatch(
        async () => {
            try {
                console.log('Requesting auto submit state with key:', AUTO_SUBMIT_STORAGE_KEY);
                return await chrome.storage.sync.get([AUTO_SUBMIT_STORAGE_KEY]);
            } catch (storageError) {
                // Create and handle storage error
                const error = createError(
                    ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
                    null,
                    storageError,
                    { key: AUTO_SUBMIT_STORAGE_KEY },
                    ERROR_SEVERITY.WARNING
                );
                handleError(error, false, false, 'input-handler');
                
                // Return empty object as fallback
                return {};
            }
        },
        {
            errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED,
            showNotification: false,
            source: 'input-handler'
        }
    );
    
    // Set auto submit state with fallback to default
    if (result && result[AUTO_SUBMIT_STORAGE_KEY] !== undefined) {
        console.log('Auto submit state found in storage:', result[AUTO_SUBMIT_STORAGE_KEY]);
        setState('autoSubmit', result[AUTO_SUBMIT_STORAGE_KEY]);
        
        // Update UI to reflect the loaded state
        updateAutoSubmitButtonState(result[AUTO_SUBMIT_STORAGE_KEY]);
    } else {
        console.log('Auto submit state not found in storage, using default value: false');
        setState('autoSubmit', false); // Default value
        
        // Update UI to reflect the default state
        updateAutoSubmitButtonState(false);
    }
}

/**
 * Save auto submit state
 * @param {boolean} state - State to save
 * @returns {Promise<void>} Promise resolved when saving is complete
 */
export async function saveAutoSubmitState(state) {
    // Use tryCatch to handle errors
    await tryCatch(
        async () => {
            try {
                console.log('Saving auto submit state:', state);
                await chrome.storage.sync.set({ [AUTO_SUBMIT_STORAGE_KEY]: state });
                console.log('Auto submit state saved successfully');
                
                // 状態変更イベントを発行
                publish(EVENTS.AUTO_SUBMIT_STATE_CHANGED, state);
                
                // 設定モーダル内のチェックボックスも更新
                const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
                if (autoSubmitCheckbox) {
                    // チェックボックスの状態を自動送信の状態と一致させる（ONの場合はチェックをON、OFFの場合はチェックをOFF）
                    autoSubmitCheckbox.checked = state;
                }
            } catch (storageError) {
                // Create and handle storage error
                const error = createError(
                    ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
                    null,
                    storageError,
                    { key: AUTO_SUBMIT_STORAGE_KEY, value: state },
                    ERROR_SEVERITY.WARNING
                );
                handleError(error, false, false, 'input-handler');
                throw error; // Re-throw to be caught by outer tryCatch
            }
        },
        {
            errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
            showNotification: false,
            source: 'input-handler'
        }
    );
}

/**
 * Save menu state
 * @param {boolean} state - State to save
 * @returns {Promise<void>} Promise resolved when saving is complete
 */
export async function saveMenuState(state) {
    // Use tryCatch to handle errors
    await tryCatch(
        async () => {
            try {
                await chrome.storage.sync.set({ [MENU_EXPANDED_STORAGE_KEY]: state });
            } catch (storageError) {
                // Create and handle storage error
                const error = createError(
                    ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
                    null,
                    storageError,
                    { key: MENU_EXPANDED_STORAGE_KEY, value: state },
                    ERROR_SEVERITY.WARNING
                );
                handleError(error, false, false, 'input-handler');
                throw error; // Re-throw to be caught by outer tryCatch
            }
        },
        {
            errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
            showNotification: false,
            source: 'input-handler'
        }
    );
}

/**
 * Toggle menu display
 */
export function toggleMenu() {
    const menuContainer = document.getElementById('otak-voice-menu-container');
    const menuButton = document.getElementById('otak-voice-menu-btn');

    if (!menuContainer || !menuButton) return;

    // Get current menu state from state management
    const currentMenuExpanded = getState('menuExpanded');
    
    // Toggle menu state
    const newMenuExpanded = !currentMenuExpanded;
    
    // Update state in state management
    setState('menuExpanded', newMenuExpanded);
    
    // Also update local variable for backward compatibility
    menuExpanded = newMenuExpanded;
    
    // Update menu state
    updateMenuState();
    
    // Save menu state
    // await might not be necessary, but consider wrapping in try...catch for error handling
    saveMenuState(newMenuExpanded);
}

/**
 * Update menu state
 */
export function updateMenuState() {
    const menuContainer = document.getElementById('otak-voice-menu-container');
    const menuButton = document.getElementById('otak-voice-menu-btn');
    
    if (!menuContainer || !menuButton) {
        console.log('Menu elements not found');
        return;
    }

    // Update menu container state
    const menuExpanded = getState('menuExpanded');
    if (menuExpanded) {
        menuContainer.classList.add('otak-voice-menu__container--expanded');
        menuButton.classList.add('otak-voice-menu__btn--expanded');

        // Update menu button icon - directly set the innerHTML since it doesn't have an icon container
        menuButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="15" y1="5" x2="5" y2="15"></line>
          <line x1="5" y1="5" x2="15" y2="15"></line>
        </svg>`;
    } else {
        menuContainer.classList.remove('otak-voice-menu__container--expanded');
        menuButton.classList.remove('otak-voice-menu__btn--expanded');

        // Update menu button icon - directly set the innerHTML
        // Use MENU_ICON directly from import
        menuButton.innerHTML = MENU_ICON;
        // Close history panel when menu is closed
        const historyPanel = document.getElementById('otak-voice-history-panel');
        if (historyPanel) historyPanel.style.display = 'none';
        // Close settings modal as well
        const settingsModal = document.getElementById('otak-voice-settings-modal');
        if (settingsModal) settingsModal.style.display = 'none';
    }
}

/**
 * Toggle settings modal display
 */
export function toggleSettingsModal() {
    const modal = document.getElementById('otak-voice-settings-modal');
    if (!modal) return;

    const currentDisplay = modal.style.display || 'none';
    modal.style.display = currentDisplay === 'none' ? 'block' : 'none';

    // Update API key input field and language selection values when displaying
    if (currentDisplay === 'none') {
        const apiKeyInput = document.getElementById('api-key-input');
        const langSelect = document.getElementById('recognition-lang-select');
        const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
        const themeSelect = document.getElementById('theme-select');

        // Get values from state management
        const apiKey = getState('apiKey');
        const recognitionLang = getState('recognitionLang');
        const autoDetectInputFields = getState('autoDetectInputFields');
        const autoCorrection = getState('autoCorrection');
        const useHistoryContext = getState('useHistoryContext');
        const themeMode = getState('themeMode');

        // Set values to form elements
        if (apiKeyInput) apiKeyInput.value = apiKey || '';
        if (langSelect) langSelect.value = recognitionLang || 'ja-JP';
        
        if (autoDetectCheckbox) {
            autoDetectCheckbox.checked = autoDetectInputFields === true;
            // Update tooltip if function exists
            if (typeof updateAutoDetectTooltip === 'function') {
                updateAutoDetectTooltip();
            }
        }
        
        // Set values for new settings items
        const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
        if (autoCorrectionCheckbox) {
            autoCorrectionCheckbox.checked = autoCorrection === true;
            // Update tooltip if function exists
            if (typeof updateAutoCorrectionTooltip === 'function') {
                updateAutoCorrectionTooltip();
            }
        }
        
        const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
        if (useHistoryContextCheckbox) {
            useHistoryContextCheckbox.checked = useHistoryContext === true;
            // Update tooltip if function exists
            if (typeof updateUseHistoryContextTooltip === 'function') {
                updateUseHistoryContextTooltip();
            }
        }
        
        // Set theme select value
        if (themeSelect) {
            themeSelect.value = themeMode || THEME_MODES.DARK;
        }
    }
}

/**
 * Updates the auto submit button state
 * @param {boolean} autoSubmit - Auto submit state
 */
export function updateAutoSubmitButtonState(autoSubmit) {
    const autoSubmitButton = document.querySelector('.otak-voice-menu__append-btn');
    if (!autoSubmitButton) return;

    // モーダル表示トグルボタンと一致させるため、
    // 自動送信がONの場合はアクティブクラスを削除し、
    // 自動送信がOFFの場合はアクティブクラスを追加します。
    
    if (autoSubmit) {
        // 自動送信がONの場合、アクティブ状態のクラスを削除
        autoSubmitButton.classList.remove('otak-voice-menu__append-btn--active');
        
        // インラインスタイルを削除（CSSクラスに依存）
        autoSubmitButton.style.backgroundColor = '';
        autoSubmitButton.style.color = '';
        autoSubmitButton.style.borderColor = '';
        autoSubmitButton.style.boxShadow = '';
        
        // 直接イベントバスを使用して通知を表示（persistent: falseで一定時間後に自動的に消える）
        publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusAutoSubmitOn', persistent: false });
        
        // 通知を強制的に表示
        const statusElem = document.querySelector('.otak-voice-status');
        if (statusElem) {
            statusElem.textContent = chrome.i18n.getMessage('statusAutoSubmitOn');
            statusElem.style.display = 'block';
        }
    } else {
        // 自動送信がOFFの場合、アクティブ状態のクラスを追加
        autoSubmitButton.classList.add('otak-voice-menu__append-btn--active');
        
        // インラインスタイルを削除（CSSクラスに依存）
        autoSubmitButton.style.backgroundColor = '';
        autoSubmitButton.style.color = '';
        autoSubmitButton.style.borderColor = '';
        autoSubmitButton.style.boxShadow = '';
        
        // 直接イベントバスを使用して通知を表示（persistent: falseで一定時間後に自動的に消える）
        publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusAutoSubmitOff', persistent: false });
        
        // 通知を強制的に表示
        const statusElem = document.querySelector('.otak-voice-status');
        if (statusElem) {
            statusElem.textContent = chrome.i18n.getMessage('statusAutoSubmitOff');
            statusElem.style.display = 'block';
        }
    }
}

/**
 * 自動送信機能を切り替えます
 */
export function toggleAutoSubmit(fromMenuButton = false) {
    // Check if the toggle is coming from the settings modal or menu button
    const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
    
    // メニューボタンからの呼び出しの場合、または設定画面のチェックボックスが存在しない場合は即時に反映
    if (fromMenuButton || !autoSubmitCheckbox) {
        // 現在の状態を取得して反転
        const currentAutoSubmit = getState('autoSubmit');
        const newAutoSubmit = !currentAutoSubmit;
        
        // Update state
        setState('autoSubmit', newAutoSubmit);
        
        // Save state to sync storage
        console.log('Toggling auto submit state to:', newAutoSubmit);
        saveAutoSubmitState(newAutoSubmit);
        
        // Update UI to reflect the new state
        updateAutoSubmitButtonState(newAutoSubmit);
        
        // 設定モーダルが表示されている場合は、設定モーダル内のすべての値を更新
        const settingsModal = document.getElementById('otak-voice-settings-modal');
        if (settingsModal && settingsModal.style.display === 'block' && typeof updateSettingsModalValues === 'function') {
            // ui.jsのupdateSettingsModalValues関数を呼び出す
            updateSettingsModalValues();
        } else {
            // 設定モーダルが表示されていない場合は、チェックボックスのみ更新
            const modalAutoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
            if (modalAutoSubmitCheckbox) {
                // チェックボックスの状態を自動送信の状態と一致させる（ONの場合はチェックをON、OFFの場合はチェックをOFF）
                modalAutoSubmitCheckbox.checked = newAutoSubmit;
            }
        }
    } else {
        // 設定画面からの呼び出しの場合は、保存ボタンを押したときに反映されるように、即時保存しない
        // 変更は一時的な状態として保持される
        console.log('Auto submit checkbox changed, will be applied when Save is clicked');
    }
}

/**
 * 現在の入力内容をクリアします
 */
export function clearCurrentInput() {
    // クリアボタンクリック前のアクティブ要素を保存
    const previousActiveElement = document.activeElement;
    const wasPreviousElementInput = isInputElement(previousActiveElement);
    
    // 元の要素が入力要素だった場合は、それを使用
    if (wasPreviousElementInput) {
        let targetElement = previousActiveElement;
        
        // DOM抽象化レイヤーを使用して入力フィールドをクリア
        if (domClearInputField(targetElement)) {
            // 追記モード時の元テキストもクリア
            const currentInputElement = getState('currentInputElement');
            if (targetElement === currentInputElement) {
                setState('originalText', '');
            }
            
            publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusClearSuccess' });
            return;
        }
    }
    
    // 現在フォーカスされている要素またはクリックされた入力要素を取得
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        // 最後にクリックした入力要素があればそれを使用
        const lastClickedInput = getState('lastClickedInput');
        if (lastClickedInput && isInputElement(lastClickedInput)) {
            targetElement = lastClickedInput;
        }
        // 自動認識がオンの場合のみ、入力フィールドを自動検出
        else if (getState('autoDetectInputFields')) {
            targetElement = findBestInputField();
        }
        // それ以外の場合はnull（入力フィールドが見つからない）
        else {
            targetElement = null;
        }

        if (targetElement) {
            targetElement.focus();
            publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusInputFound' });
        } else {
            // 自動認識がオフの場合は専用のメッセージを表示
            if (!getState('autoDetectInputFields')) {
                publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusAutoDetectOff' });
            } else {
                publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusClearNotFound' });
            }
            return;
        }
    }

    // DOM抽象化レイヤーを使用して入力フィールドをクリア
    if (domClearInputField(targetElement)) {
        // 追記モード時の元テキストもクリア
        const currentInputElement = getState('currentInputElement');
        if (targetElement === currentInputElement) {
            setState('originalText', '');
        }
        
        publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusClearSuccess' });
    } else {
        // エラー処理
        const appError = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
            'Failed to clear input field',
            null,
            { element: targetElement },
            ERROR_SEVERITY.WARNING
        );
        handleError(appError, false, false, 'input-handler');
    }
}

/**
 * 最適な入力フィールドを探します
 * @returns {Element|null} 入力要素またはnull
 */
export function findBestInputField() {
    // サイトハンドラから適切な関数を取得して実行
    const siteHandler = getSiteHandler();
    if (siteHandler && typeof siteHandler.findBestInputField === 'function') {
        const inputField = siteHandler.findBestInputField();
        if (inputField) {
            return inputField;
        }
    }
    
    // フォールバック: DOM抽象化レイヤーの関数を使用
    return domFindBestInputField();
}

/**
 * 音声入力後に自動送信します
 */
export function autoSubmitAfterVoiceInput() {
    // サイトハンドラから適切な関数を取得して実行
    const siteHandler = getSiteHandler();
    if (siteHandler && typeof siteHandler.submitAfterVoiceInput === 'function') {
        return siteHandler.submitAfterVoiceInput();
    }
    
    // フォールバック: 何もしない
    return false;
}

/**
 * 入力フィールドにテキストを書き込みます
 * @param {Element} el - 入力要素
 * @param {string} txt - 書き込むテキスト
 */
export function writeToInputField(el, txt) {
    if (!el) return;
    
    // DOM抽象化レイヤーの関数を使用
    const result = domWriteToInputField(el, txt);
    
    if (!result) {
        console.error(chrome.i18n.getMessage('logWriteToInputFieldFailed'));
        
        // Create and handle error
        const appError = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
            'Failed to write to input field',
            null,
            { element: el, text: txt },
            ERROR_SEVERITY.WARNING
        );
        handleError(appError, false, false, 'input-handler');
    }
}

// 追記モード用の特殊なテキスト処理関数は削除

/**
 * React対応のタイピングシミュレーション
 * @param {Element} element - 入力要素
 * @param {string} text - 入力するテキスト
 * @returns {boolean} 成功したらtrue
 */
export function simulateTypingIntoElement(element, text) {
    if (!element || text === undefined || text === null) {
        return false;
    }
    
    // DOM抽象化レイヤーの関数を使用
    const result = domWriteToInputField(element, text);
    
    if (result) {
        return true;
    } else {
        console.error(chrome.i18n.getMessage('logTypingSimulateError'));
        
        // Create and handle error
        const appError = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
            'Failed to simulate typing into element',
            null,
            { element, text },
            ERROR_SEVERITY.WARNING
        );
        handleError(appError, false, false, 'input-handler');
        
        return false;
    }
}

/**
 * Enterキー押下時の処理ハンドラ
 * @param {KeyboardEvent} e - イベントオブジェクト
 */
function handleEnterKey(e) {
    // Enterキーが押された時 (Shift+Enterは除外)
    if (e.key === 'Enter' && !e.shiftKey) {
        // textareaの場合は複数行入力を許可するため、Ctrl+Enterのみで送信
        if (this.tagName.toLowerCase() === 'textarea' && !e.ctrlKey) {
            return;
        }

        // フォーカスされている入力要素を保存
        window.currentInputElement = this;

        // 送信ボタンを探して自動クリック（モーダルウィンドウを使用していない場合のみ）
        if (!window.useRecognitionModal) {
            autoSubmitAfterVoiceInput();
        }
    }
}

/**
 * 入力要素のハンドラを強化します (Enterキーでの送信など)
 */
export function enhanceInputElementHandlers() {
    // 入力要素を取得
    const inputElements = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
    
    // 各入力要素にEnterキーハンドラを追加
    inputElements.forEach(el => {
        // 既存のハンドラを削除（重複防止）
        el.removeEventListener('keydown', handleEnterKey);
        // 新しいハンドラを追加
        el.addEventListener('keydown', handleEnterKey);
    });
}

/**
 * フォーム内容を校閲します
 */
export async function proofreadCurrentInput() {
    // 処理中の場合は実行しない
    const processingState = getState('processingState');
    if (processingState && processingState !== PROCESSING_STATE.IDLE) {
        showStatus('statusProcessingInProgress');
        return;
    }
    
    // 処理状態を更新
    setState('processingState', PROCESSING_STATE.PROOFREADING);

    // 現在フォーカスされている要素またはクリックされた入力要素を取得
    // 編集ボタンと同じロジックを使用
    let currentInputElement = document.activeElement;
    if (!isInputElement(currentInputElement)) {
        // 最後にクリックした入力要素があればそれを使用
        const lastClickedInput = getState('lastClickedInput');
        if (lastClickedInput && isInputElement(lastClickedInput)) {
            currentInputElement = lastClickedInput;
        }
        // 自動認識がオンの場合のみ、入力フィールドを自動検出
        else if (getState('autoDetectInputFields')) {
            currentInputElement = findBestInputField();
        }
        // それ以外の場合はnull（入力フィールドが見つからない）
        else {
            currentInputElement = null;
        }

        if (currentInputElement) {
            currentInputElement.focus();
            setState('currentInputElement', currentInputElement);
            showStatus('statusInputFound');
        } else {
            // 自動認識がオフの場合は専用のメッセージを表示
            if (!getState('autoDetectInputFields')) {
                showStatus('statusAutoDetectOff');
            } else {
                showStatus('statusProofreadNotFound');
            }
            
            // 処理状態をリセット
            setState('processingState', PROCESSING_STATE.IDLE);
            return;
        }
    } else {
        // 現在のアクティブ要素を状態に保存
        setState('currentInputElement', currentInputElement);
    }

    // 入力内容を取得
    let content = '';
    if (currentInputElement.isContentEditable) {
        content = currentInputElement.textContent || '';
    } else {
        content = currentInputElement.value || '';
    }

    // 入力内容が空の場合
    if (!content.trim()) {
        showStatus('statusProofreadEmpty');
        // 処理状態をリセット
        setState('processingState', PROCESSING_STATE.IDLE);
        return;
    }

    // APIキーがない場合は設定モーダルを開く
    const apiKey = getState('apiKey');
    if (!apiKey || apiKey.trim() === '') {
        // Create and handle the error
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY,
            null,
            null,
            null,
            ERROR_SEVERITY.WARNING
        );
        handleError(error, true, false, 'input-handler');
        
        // 処理状態をリセット
        setState('processingState', PROCESSING_STATE.IDLE);
        
        // 設定モーダルを開く（編集ボタンと同様の動作）
        toggleSettingsModal();
        return;
    }

    // 校閲中のステータス表示（永続表示）
    showStatus('statusProofreading', undefined, true);

    try {
        // GPT-4.1で校閲
        const corrected = await proofreadWithGPT(content);

        // 校閲結果を反映
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
                 // イベント発火
                 currentInputElement.dispatchEvent(new Event('input', { bubbles: true }));
                 currentInputElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
            showStatus('statusProofreadSuccess');
            
            // 処理状態をリセット
            setState('processingState', PROCESSING_STATE.IDLE);
        } else {
            // corrected が null や undefined の場合のエラー処理は proofreadWithGPT 内で行われる想定
            // ここでは特に何もしないか、別のメッセージを表示
             showStatus('statusProofreadError'); // 例: 校閲結果が不正
             
             // 処理状態をリセット
             setState('processingState', PROCESSING_STATE.IDLE);
        }
    } catch (error) {
        // If it's already an AppError, use it directly
        if (error.name === 'AppError') {
            handleError(error, true, false, 'input-handler');
        } else {
            // Otherwise, create a new AppError
            const appError = createError(
                ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR,
                null,
                error,
                null,
                ERROR_SEVERITY.ERROR
            );
            handleError(appError, true, false, 'input-handler');
        }
        
        // 処理状態をリセット
        setState('processingState', PROCESSING_STATE.IDLE);
    }
}

/**
 * input-handler モジュールの初期化
 */
export async function initInputHandler() {
    // 状態管理モジュールの初期化
    initializeState();
    
    // メニュー状態と自動送信状態の読み込み
    console.log('Initializing input handler - loading states...');
    await loadMenuState();
    await loadAutoSubmitState();
    console.log('States loaded successfully');
    
    // メニュー状態を状態管理モジュールに反映
    setState('menuExpanded', menuExpanded);
    
    // イベントリスナーを設定
    document.addEventListener('click', e => {
        if (isInputElement(e.target)) {
            setState('lastClickedInput', e.target);
            publish(EVENTS.INPUT_FIELD_CLICKED, e.target);
        }
    }, true);
    
    // イベントバスのサブスクライブ
    setupEventSubscriptions();
}

/**
 * イベントバスのサブスクリプションを設定
 */
function setupEventSubscriptions() {
    // メニュートグルイベント
    eventSubscribe(EVENTS.MENU_TOGGLED, () => {
        toggleMenu();
    });
    
    // 設定モーダルトグルイベント
    eventSubscribe(EVENTS.SETTINGS_MODAL_TOGGLED, () => {
        toggleSettingsModal();
    });
    
    // 自動送信トグルイベント
    eventSubscribe(EVENTS.AUTO_SUBMIT_TOGGLED, (data) => {
        const fromMenuButton = data && data.fromMenuButton === true;
        toggleAutoSubmit(fromMenuButton);
    });
    
    // 自動送信状態変更イベント
    eventSubscribe(EVENTS.AUTO_SUBMIT_STATE_CHANGED, (autoSubmit) => {
        // 状態を更新
        setState('autoSubmit', autoSubmit);
        
        // UI を更新
        updateAutoSubmitButtonState(autoSubmit);
    });
    
    // 入力クリアイベント
    eventSubscribe(EVENTS.INPUT_CLEARED, () => {
        clearCurrentInput();
    });
    
    // 校閲開始イベント
    eventSubscribe(EVENTS.GPT_PROOFREADING_STARTED, () => {
        proofreadCurrentInput();
    });
    
    // 入力フィールド検索イベント
    eventSubscribe(EVENTS.INPUT_FIELD_FOUND, () => {
        const bestInputField = findBestInputField();
        if (bestInputField) {
            setState('currentInputElement', bestInputField);
        }
    });
    
    // 音声認識結果イベント
    eventSubscribe(EVENTS.SPEECH_RECOGNITION_RESULT, (data) => {
        const { final, text } = data;
        const currentInputElement = getState('currentInputElement');
        
        if (!currentInputElement) return;
        
        // 最終結果
        if (final) {
            // 通常モードの場合（上書き）
            if (simulateTypingIntoElement(currentInputElement, text)) {
                // シミュレーション成功
            } else {
                writeToInputField(currentInputElement, text);
            }
            
            // 自動送信（自動送信がオンの場合のみ）
            const useRecognitionModal = getState('useRecognitionModal');
            const autoSubmit = getState('autoSubmit');
            if (!useRecognitionModal && autoSubmit) {
                autoSubmitAfterVoiceInput();
            }
        } else {
            // 中間結果
            writeToInputField(currentInputElement, text);
        }
    });
    
    // メニュー状態更新イベント
    eventSubscribe(EVENTS.MENU_STATE_UPDATE_NEEDED, async () => {
        try {
            await loadMenuState();
            updateMenuState();
        } catch (error) {
            if (error.message.includes("Extension context invalidated")) {
                // Ignore extension context invalidated errors
            } else {
                console.error('Error updating menu state:', error);
                publish(EVENTS.ERROR_OCCURRED, {
                    source: 'input-handler',
                    message: 'Error updating menu state',
                    error
                });
            }
        }
    });
    
    // 入力ハンドラ更新イベント
    eventSubscribe(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED, () => {
        try {
            enhanceInputElementHandlers();
        } catch (error) {
            if (error.message.includes("Extension context invalidated")) {
                // Ignore extension context invalidated errors
            } else {
                // Create and handle the error
                const appError = createError(
                    ERROR_CODE[ERROR_CATEGORY.DOM].EVENT_DISPATCH_FAILED,
                    'Error enhancing input handlers',
                    error,
                    null,
                    ERROR_SEVERITY.WARNING
                );
                handleError(appError, false, false, 'input-handler');
            }
        }
    });
}

/**
 * ステータス表示関数 - UIモジュールへの依存を避けるためのプロキシ
 * @param {string} messageKey - i18n key for the message to display
 * @param {string|undefined} substitutions - Replacement string in the message
 * @param {boolean} persistent - Whether to display persistently
 */
function showStatus(messageKey, substitutions, persistent = false) {
    publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
}