/**
 * UI-related Module
 * Responsible for creating and managing UI elements
 */

import { updateHistoryPanel } from './history.js';
import { PROCESSING_STATE, THEME_MODES } from '../constants.js';
import { isInputElement } from './utils.js';
import { getState, setState, subscribe as stateSubscribe } from './state.js'; // Import state management
import { publish, subscribe, EVENTS } from './event-bus.js'; // Import event bus
import { toggleTheme, saveSetting } from './settings.js'; // Import saveSetting for modal window toggle
import { updateAutoSubmitButtonState } from './input-handler.js'; // Import updateAutoSubmitButtonState for auto submit button

import {
    MENU_ICON,
    MIC_ICON,
    APPEND_ICON,
    CLEAR_ICON,
    PROOFREAD_ICON,
    EDIT_ICON,
    SETTINGS_ICON,
    HISTORY_ICON,
    LOADING_ICON,
    MODAL_TOGGLE_ICON,
    THEME_TOGGLE_ICON,
    AUTO_SUBMIT_ICON
} from '../icons.js';

// Initialize state values from state module when needed

/**
 * Status display function
 * @param {string} messageKey - i18n key for the message to display
 * @param {string|undefined} substitutions - Replacement string in the message
 * @param {boolean} persistent - Whether to display persistently
 */
export function showStatus(messageKey, substitutions, persistent = false) {
    const statusElem = document.querySelector('.otak-voice-status');
    if (!statusElem) return;

    const msg = chrome.i18n.getMessage(messageKey, substitutions);
    statusElem.textContent = msg;
    statusElem.style.display = 'block';

    // Get current processing state
    const processingState = getState('processingState');

    // Change background color if processing
    if (processingState !== PROCESSING_STATE.IDLE) {
        statusElem.classList.add('otak-voice-status--processing');
    } else {
        statusElem.classList.remove('otak-voice-status--processing');
    }

    // エラーメッセージかどうかを判定
    const isErrorMessage = messageKey.startsWith('status') && (
        messageKey.includes('Error') ||
        messageKey.includes('Empty') ||
        messageKey.includes('NotFound') ||
        messageKey === 'statusProcessingInProgress' ||
        messageKey === 'statusAutoDetectOff'
    );
    
    // Only hide after timeout if not persistent display or is an error message
    if (!persistent || isErrorMessage) {
        // エラーメッセージの場合は短いタイムアウト
        const timeout = isErrorMessage ? 3000 : 5000;
        
        setTimeout(() => {
            if (!statusElem) return;
            
            // エラーメッセージの場合は強制的に非表示
            if (isErrorMessage) {
                statusElem.style.display = 'none';
                statusElem.classList.remove('otak-voice-status--processing');
                return;
            }
            
            // 通常のメッセージは処理中でない場合のみ非表示
            const currentProcessingState = getState('processingState');
            if (currentProcessingState === PROCESSING_STATE.IDLE) {
                statusElem.style.display = 'none';
                statusElem.classList.remove('otak-voice-status--processing');
            }
        }, timeout);
    }
}

/**
 * Creates UI elements
 */
export function createUI() {
    // Remove existing elements (just in case)
    removeExistingElements();

    // Main menu button
    const menuButton = document.createElement('div');
    menuButton.className = 'otak-voice-menu__btn';
    menuButton.id = 'otak-voice-menu-btn'; // Add ID for easier selection
    menuButton.innerHTML = MENU_ICON;
    // Remove title attribute to disable native tooltip
    document.body.appendChild(menuButton);

    // Menu container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'otak-voice-menu__container';
    menuContainer.id = 'otak-voice-menu-container'; // Add ID for easier selection
    document.body.appendChild(menuContainer);

    // Theme toggle button
    const themeToggleButton = createMenuItem('theme-toggle-btn', THEME_TOGGLE_ICON, chrome.i18n.getMessage('themeToggleTooltip') || 'テーマ切り替え');
    const themeMode = getState('themeMode');
    // Remove title attribute to disable native tooltip
    menuContainer.appendChild(themeToggleButton);
    
    // Modal display/hide toggle button
    const modalToggleButton = createMenuItem('modal-toggle-btn', MODAL_TOGGLE_ICON, chrome.i18n.getMessage('modalToggleTooltip'));
    const showModalWindow = getState('showModalWindow');
    // Set initial state based on settings
    if (!showModalWindow) {
        modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
    }
    // Remove title attribute to disable native tooltip
    menuContainer.appendChild(modalToggleButton);
    
    // Microphone button
    const micButton = createMenuItem('input-btn', MIC_ICON, chrome.i18n.getMessage('micTooltip')); // ツールチップを設定
    menuContainer.appendChild(micButton);

    // Auto-submit toggle button
    const autoSubmitButton = createMenuItem('append-btn', AUTO_SUBMIT_ICON, chrome.i18n.getMessage('autoSubmitTooltip'));
    menuContainer.appendChild(autoSubmitButton);
    
    // Set initial state for auto-submit button
    const autoSubmit = getState('autoSubmit');
    if (autoSubmit !== undefined) {
        updateAutoSubmitButtonState(autoSubmit);
    }

    // Clear button
    const clearButton = createMenuItem('clear-btn', CLEAR_ICON, chrome.i18n.getMessage('clearTooltip'));
    menuContainer.appendChild(clearButton);

    // Proofread button
    const proofreadButton = createMenuItem('proofread-btn', PROOFREAD_ICON, chrome.i18n.getMessage('proofreadTooltip'));
    menuContainer.appendChild(proofreadButton);

    // Edit button
    const editButton = createMenuItem('edit-btn', EDIT_ICON, chrome.i18n.getMessage('editTooltip'));
    menuContainer.appendChild(editButton);

    // Settings button
    const settingsButton = createMenuItem('settings-btn', SETTINGS_ICON, chrome.i18n.getMessage('settingsTooltip')); // モデル名も更新
    menuContainer.appendChild(settingsButton);

    // History button
    const historyButton = createMenuItem('history-btn', HISTORY_ICON, chrome.i18n.getMessage('historyTooltip'));
    menuContainer.appendChild(historyButton);

    // Status display
    const statusDisplay = document.createElement('div');
    statusDisplay.className = 'otak-voice-status';
    document.body.appendChild(statusDisplay);

    // Settings modal
    createSettingsModal();

    // History panel
    createHistoryPanel();
    // Add event listener for modal toggle button
    const modalToggleBtn = document.querySelector('.otak-voice-menu__modal-toggle-btn');
    if (modalToggleBtn) {
        modalToggleBtn.addEventListener('click', toggleModalVisibility);
    }
    
    /**
     * 入力フィールドの状態に基づいて編集・校閲ボタンの有効/無効を切り替える
     */
    function updateEditProofreadButtonsState() {
        // 編集ボタンと校閲ボタンを取得
        const proofreadButton = document.querySelector('.otak-voice-menu__proofread-btn');
        const editButton = document.querySelector('.otak-voice-menu__edit-btn');
        
        if (!proofreadButton || !editButton) return;
        
        // 現在の入力要素を取得
        const currentInputElement = getState('currentInputElement');
        
        // 入力要素がない、または内容が空の場合はボタンを無効化
        if (!currentInputElement ||
            (currentInputElement.value === '' && !currentInputElement.textContent) ||
            (currentInputElement.value && currentInputElement.value.trim() === '') ||
            (currentInputElement.textContent && currentInputElement.textContent.trim() === '')) {
            
            proofreadButton.classList.add('otak-voice-menu__item--disabled');
            editButton.classList.add('otak-voice-menu__item--disabled');
        } else {
            // 処理中でなければボタンを有効化
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE) {
                proofreadButton.classList.remove('otak-voice-menu__item--disabled');
                editButton.classList.remove('otak-voice-menu__item--disabled');
            }
        }
    }
    
    // Add event listener for theme toggle button
    const themeToggleBtn = document.querySelector('.otak-voice-menu__theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    // 初期状態でボタンの状態を更新
    updateEditProofreadButtonsState();
}

/**
 * 入力フィールドの状態に基づいて編集・校閲ボタンの有効/無効を切り替える
 */
function updateEditProofreadButtonsState() {
    // 編集ボタンと校閲ボタンを取得
    const proofreadButton = document.querySelector('.otak-voice-menu__proofread-btn');
    const editButton = document.querySelector('.otak-voice-menu__edit-btn');
    
    if (!proofreadButton || !editButton) return;
    
    // 現在の入力要素を取得
    const currentInputElement = getState('currentInputElement');
    
    // 入力要素がない、または内容が空の場合はボタンを無効化
    if (!currentInputElement ||
        (currentInputElement.value === '' && !currentInputElement.textContent) ||
        (currentInputElement.value && currentInputElement.value.trim() === '') ||
        (currentInputElement.textContent && currentInputElement.textContent.trim() === '')) {
        
        proofreadButton.classList.add('otak-voice-menu__item--disabled');
        editButton.classList.add('otak-voice-menu__item--disabled');
    } else {
        // 処理中でなければボタンを有効化
        const processingState = getState('processingState');
        if (processingState === PROCESSING_STATE.IDLE) {
            proofreadButton.classList.remove('otak-voice-menu__item--disabled');
            editButton.classList.remove('otak-voice-menu__item--disabled');
        }
    }
}

/**
 * Set up event subscriptions for UI module
 */
function setupEventSubscriptions() {
    // Subscribe to status update events
    subscribe(EVENTS.STATUS_UPDATED, (data) => {
        showStatus(data.messageKey, data.substitutions, data.persistent);
    });
    
    // Subscribe to recognition modal events
    subscribe(EVENTS.RECOGNITION_MODAL_SHOWN, (data) => {
        showRecognitionTextModal(data.text, data.isInitial);
    });
    
    subscribe(EVENTS.RECOGNITION_MODAL_UPDATED, (text) => {
        updateRecognitionModal(text);
    });
    
    // Subscribe to processing state changes
    subscribe(EVENTS.PROCESSING_STATE_CHANGED, (state) => {
        updateProcessingState(state);
        // 処理状態が変更されたときにボタン状態も更新
        updateEditProofreadButtonsState();
    });
    
    // 自動送信状態が変更されたときに設定モーダルの値を更新
    subscribe(EVENTS.AUTO_SUBMIT_STATE_CHANGED, (autoSubmit) => {
        // 設定モーダルが表示されている場合のみ更新
        const modal = document.getElementById('otak-voice-settings-modal');
        if (modal && modal.style.display === 'block') {
            const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
            if (autoSubmitCheckbox) {
                // 自動送信の状態とチェックボックスの状態を一致させる
                autoSubmitCheckbox.checked = autoSubmit;
            }
        }
    });
    
    // モーダルウィンドウの表示/非表示状態が変更されたときに設定モーダルの値を更新
    subscribe(EVENTS.MODAL_VISIBILITY_TOGGLED, (showModalWindow) => {
        // 設定モーダルが表示されている場合のみ更新
        const modal = document.getElementById('otak-voice-settings-modal');
        if (modal && modal.style.display === 'block') {
            const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
            if (showModalWindowCheckbox) {
                showModalWindowCheckbox.checked = showModalWindow;
            }
        }
    });
    
    // Subscribe to settings loaded event
    subscribe(EVENTS.SETTINGS_LOADED, (settings) => {
        // Update all settings UI elements to reflect loaded settings
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) {
            apiKeyInput.value = settings.apiKey || '';
        }
        
        const langSelect = document.getElementById('recognition-lang-select');
        if (langSelect) {
            langSelect.value = settings.recognitionLang;
        }
        
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = settings.themeMode;
        }
        
        const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
        if (autoDetectCheckbox) {
            autoDetectCheckbox.checked = settings.autoDetectInputFields;
        }
        
        const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
        if (autoCorrectionCheckbox) {
            autoCorrectionCheckbox.checked = settings.autoCorrection;
        }
        
        const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
        if (useHistoryContextCheckbox) {
            useHistoryContextCheckbox.checked = settings.useHistoryContext;
        }
        
        const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
        if (showModalWindowCheckbox) {
            showModalWindowCheckbox.checked = settings.showModalWindow;
        }
        
        const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
        if (autoSubmitCheckbox) {
            // Get the current auto submit state from input-handler.js
            const currentAutoSubmit = getState('autoSubmit');
            // チェックボックスの状態を自動送信の状態と一致させる（ONの場合はチェックをON、OFFの場合はチェックをOFF）
            autoSubmitCheckbox.checked = currentAutoSubmit;
        }
        
        
        
        const autoCorrectionPromptTextarea = document.getElementById('auto-correction-prompt-textarea');
        if (autoCorrectionPromptTextarea) {
            autoCorrectionPromptTextarea.value = settings.autoCorrectionPrompt;
        }
        
        const proofreadingPromptTextarea = document.getElementById('proofreading-prompt-textarea');
        if (proofreadingPromptTextarea) {
            proofreadingPromptTextarea.value = settings.proofreadingPrompt;
        }
        
        // Update modal toggle button state
        const modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
        if (modalToggleButton) {
            if (settings.showModalWindow) {
                modalToggleButton.classList.remove('otak-voice-menu__modal-toggle-btn--active');
            } else {
                modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
            }
        }
        
        // Update auto submit button state
        const autoSubmitButton = document.querySelector('.otak-voice-menu__append-btn');
        if (autoSubmitButton && settings.autoSubmit !== undefined) {
            // Call the function from input-handler.js to update the button state
            if (typeof updateAutoSubmitButtonState === 'function') {
                updateAutoSubmitButtonState(settings.autoSubmit);
            }
        }
    });
    
    // 入力フィールドが変更されたときにボタン状態を更新
    subscribe(EVENTS.INPUT_FIELD_CLICKED, () => {
        updateEditProofreadButtonsState();
    });
    
    // 入力フィールドが見つかったときにボタン状態を更新
    subscribe(EVENTS.INPUT_FIELD_FOUND, () => {
        updateEditProofreadButtonsState();
    });
    
    // 音声認識結果が入力されたときにボタン状態を更新
    subscribe(EVENTS.SPEECH_RECOGNITION_RESULT, () => {
        updateEditProofreadButtonsState();
    });
}

/**
 * Toggle settings modal display
 */
export function toggleSettingsModal() {
    const modal = document.getElementById('otak-voice-settings-modal');
    if (!modal) return;

    const currentDisplay = modal.style.display || 'none';
    modal.style.display = currentDisplay === 'none' ? 'block' : 'none';

    // モーダルを表示する場合は、最新の設定値を読み込む
    if (currentDisplay === 'none') {
        updateSettingsModalValues();
    }
}

/**
 * 設定モーダルの値を最新の状態に更新する
 * この関数は設定モーダルが表示されるときと、ボタン側で設定が変更されたときに呼び出される
 */
export function updateSettingsModalValues() {
    const apiKeyInput = document.getElementById('api-key-input');
    const langSelect = document.getElementById('recognition-lang-select');
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    const themeSelect = document.getElementById('theme-select');
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
    const silenceTimeoutInput = document.getElementById('silence-timeout-input');

    // Get values from state management
    const apiKey = getState('apiKey');
    const recognitionLang = getState('recognitionLang');
    const autoDetectInputFields = getState('autoDetectInputFields');
    const autoCorrection = getState('autoCorrection');
    const useHistoryContext = getState('useHistoryContext');
    const themeMode = getState('themeMode');
    const showModalWindow = getState('showModalWindow');
    const autoSubmit = getState('autoSubmit');
    const silenceTimeout = getState('silenceTimeout') || 3000;

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
    
    // モーダルウィンドウ表示設定を更新
    if (showModalWindowCheckbox) {
        showModalWindowCheckbox.checked = showModalWindow === true;
    }
    
    // 自動送信設定を更新
    if (autoSubmitCheckbox) {
        autoSubmitCheckbox.checked = autoSubmit;
    }
    
    // Set theme select value
    if (themeSelect) {
        themeSelect.value = themeMode || THEME_MODES.DARK;
    }
    
    // Set silence timeout value
    if (silenceTimeoutInput) {
        silenceTimeoutInput.value = silenceTimeout;
    }
}

/**
 * Toggles the visibility of the modal window
 */
export function toggleModalVisibility() {
    // Get current state and invert it
    const currentShowModalWindow = getState('showModalWindow');
    const newShowModalWindow = !currentShowModalWindow;
    
    // Update state and save to sync storage
    saveSetting('showModalWindow', newShowModalWindow);
    
    // Update button title
    const modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
    if (modalToggleButton) {
        // Remove title attribute to disable native tooltip
        
        // Toggle active state
        if (newShowModalWindow) {
            modalToggleButton.classList.remove('otak-voice-menu__modal-toggle-btn--active');
        } else {
            modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
        }
    }
    
    // 設定モーダル内のチェックボックスも更新
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    if (showModalWindowCheckbox) {
        showModalWindowCheckbox.checked = newShowModalWindow;
    }
    
    // 設定モーダルが表示されている場合は、すべての設定値を最新の状態に更新
    const settingsModal = document.getElementById('otak-voice-settings-modal');
    if (settingsModal && settingsModal.style.display === 'block') {
        updateSettingsModalValues();
    }
    
    // Close any currently displayed modal
    const existingModal = document.querySelector('.otak-voice-recognition');
    if (existingModal && !newShowModalWindow) {
        existingModal.remove();
    }
    
    // モーダルウィンドウの表示/非表示状態が変更されたことを通知
    publish(EVENTS.MODAL_VISIBILITY_TOGGLED, newShowModalWindow);
    
    // Show status
    showStatus(newShowModalWindow ? 'statusModalVisible' : 'statusModalHidden');
}

/**
 * メニューアイテムを作成します
 * @param {string} id - 要素のID
 * @param {string} icon - アイコン文字列
 * @param {string} tooltip - ツールチップテキスト
 * @returns {HTMLElement} 作成されたメニューアイテム要素
 */
export function createMenuItem(id, iconSvg, tooltip) {
    const item = document.createElement('div');
    item.className = `otak-voice-menu__${id} otak-voice-menu__item`;
    
    // SVGアイコンを設定
    const iconContainer = document.createElement('div');
    iconContainer.className = 'otak-voice-menu__icon-container';
    iconContainer.innerHTML = iconSvg;
    item.appendChild(iconContainer);

    const label = document.createElement('div');
    label.className = 'otak-voice-menu__label';
    
    // すべてのボタンにラベルテキストを設定
    label.textContent = tooltip;
    
    // ネイティブツールチップは設定しない（title属性を削除）
    
    item.appendChild(label);

    return item;
}

/**
 * 既存の要素を削除します
 */
export function removeExistingElements() {
    const elementSelectors = [
        '.otak-voice-menu__btn',
        '.otak-voice-menu__container',
        '.otak-voice-menu__input-btn',
        '.otak-voice-menu__append-btn',
        '.otak-voice-menu__proofread-btn',
        '.otak-voice-menu__edit-btn',
        '.otak-voice-menu__settings-btn',
        '.otak-voice-menu__history-btn',
        '.otak-voice-menu__clear-btn',
        '.otak-voice-status',
        '.otak-voice-settings',
        '.otak-voice-history',
        '.otak-voice-menu__modal-toggle-btn',
        '.otak-voice-menu__theme-toggle-btn'
    ];

    elementSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.remove();
    });
}

/**
 * Creates the settings modal
 */
export function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'otak-voice-settings';
    modal.id = 'otak-voice-settings-modal'; // Add ID for easier selection

    // 言語選択オプションを生成
    const langOptions = [
        { value: 'ja-JP', textKey: 'modalSettingsLangJa' },
        { value: 'en-US', textKey: 'modalSettingsLangEn' },
        { value: 'vi-VN', textKey: 'modalSettingsLangVi' }
    ];

    const langSelectOptionsHTML = langOptions.map(lang =>
        `<option value="${lang.value}">${chrome.i18n.getMessage(lang.textKey)}</option>`
    ).join('');
    
    // テーマ選択オプションを生成
    const themeOptions = [
        { value: THEME_MODES.DARK, textKey: 'modalSettingsThemeDark' },
        { value: THEME_MODES.LIGHT, textKey: 'modalSettingsThemeLight' }
    ];
    
    const themeSelectOptionsHTML = themeOptions.map(theme =>
        `<option value="${theme.value}">${chrome.i18n.getMessage(theme.textKey)}</option>`
    ).join('');

    // DeepL風のヘッダー、ボディ構造
    modal.innerHTML = `
        <h3>${chrome.i18n.getMessage('modalSettingsTitle')}</h3>
        <p>${chrome.i18n.getMessage('modalSettingsDescription')}</p>
        
        <div class="otak-voice-settings__grid">
            <!-- API設定ブロック -->
            <div class="otak-voice-settings__block">
                <h4>${chrome.i18n.getMessage('settingApiSettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="api-key-input">OpenAI API Key</label>
                    <input type="password" id="api-key-input" placeholder="${chrome.i18n.getMessage('modalSettingsInputPlaceholder')}" autocomplete="off">
                    <div class="otak-voice-settings__help-text">
                        ${chrome.i18n.getMessage('settingApiKeyHelpText')} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">${chrome.i18n.getMessage('settingApiKeyLink')}</a>
                    </div>
                </div>
            </div>

            <!-- 言語・テーマ設定ブロック -->
            <div class="otak-voice-settings__block">
                <h4>${chrome.i18n.getMessage('settingDisplaySettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="recognition-lang-select">${chrome.i18n.getMessage('modalSettingsLangLabel')}</label>
                    <select id="recognition-lang-select">
                        ${langSelectOptionsHTML}
                    </select>

                    <label for="theme-select">${chrome.i18n.getMessage('modalSettingsThemeLabel')}</label>
                    <select id="theme-select">
                        ${themeSelectOptionsHTML}
                    </select>
                </div>
            </div>

            <!-- 機能設定ブロック -->
            <div class="otak-voice-settings__block">
                <h4>${chrome.i18n.getMessage('settingFunctionSettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    <div class="otak-voice-settings__item">
                        <label for="auto-detect-input-fields-checkbox">${chrome.i18n.getMessage('settingAutoDetectInputFieldsLabel')}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="auto-detect-input-fields-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="auto-correction-checkbox">${chrome.i18n.getMessage('settingAutoCorrectionLabel')}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="auto-correction-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="use-history-context-checkbox">${chrome.i18n.getMessage('settingUseHistoryContextLabel')}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="use-history-context-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="show-modal-window-checkbox">${chrome.i18n.getMessage('settingShowModalWindowLabel')}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="show-modal-window-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>

                    <div class="otak-voice-settings__item">
                        <label for="auto-submit-checkbox">${chrome.i18n.getMessage('settingAutoSubmitLabel')}</label>
                        <label class="otak-voice-settings__switch">
                            <input type="checkbox" id="auto-submit-checkbox">
                            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
                        </label>
                    </div>
                    
                    <div class="otak-voice-settings__item">
                        <label for="silence-timeout-input">${chrome.i18n.getMessage('settingSilenceTimeoutLabel')}</label>
                        <input type="number" id="silence-timeout-input" min="500" max="10000" step="500" value="3000" class="otak-voice-settings__number-input">
                    </div>

                </div>
            </div>

            <!-- プロンプト設定ブロック -->
            <div class="otak-voice-settings__block">
                <h4>${chrome.i18n.getMessage('settingPromptSettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="auto-correction-prompt-textarea">${chrome.i18n.getMessage('autoCorrectionPromptLabel')}</label>
                    <textarea id="auto-correction-prompt-textarea" rows="4" placeholder="${chrome.i18n.getMessage('promptPlaceholder')}"></textarea>

                    <label for="proofreading-prompt-textarea">${chrome.i18n.getMessage('proofreadingPromptLabel')}</label>
                    <textarea id="proofreading-prompt-textarea" rows="4" placeholder="${chrome.i18n.getMessage('promptPlaceholder')}"></textarea>
                </div>
            </div>
        </div>

        <div class="button-row">
            <a id="otak-voice-version-link" href="https://github.com/tsuyoshi-otake/otak-voice" target="_blank">Version: 3.1</a>
            <div class="button-group">
                <button class="otak-voice-settings__cancel-btn">${chrome.i18n.getMessage('modalSettingsButtonCancel')}</button>
                <button class="otak-voice-settings__save-btn">${chrome.i18n.getMessage('modalSettingsButtonSave')}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // ドラッグ機能を追加
    makeDraggable(modal);
    
    // Add auto-save functionality to all settings inputs
    // API Key input
    const apiKeyInput = document.getElementById('api-key-input');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('change', () => {
            saveSetting('apiKey', apiKeyInput.value.trim());
        });
    }
    
    // Recognition language select
    const langSelect = document.getElementById('recognition-lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            saveSetting('recognitionLang', langSelect.value);
        });
    }
    
    // Theme select
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', () => {
            saveSetting('themeMode', themeSelect.value);
        });
    }
    
    // Auto-detect input fields checkbox
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    if (autoDetectCheckbox) {
        autoDetectCheckbox.addEventListener('change', () => {
            saveSetting('autoDetectInputFields', autoDetectCheckbox.checked);
        });
    }
    
    // Auto-correction checkbox
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    if (autoCorrectionCheckbox) {
        autoCorrectionCheckbox.addEventListener('change', () => {
            saveSetting('autoCorrection', autoCorrectionCheckbox.checked);
        });
    }
    
    // Use history context checkbox
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    if (useHistoryContextCheckbox) {
        useHistoryContextCheckbox.addEventListener('change', () => {
            saveSetting('useHistoryContext', useHistoryContextCheckbox.checked);
        });
    }
    
    // Show modal window checkbox - no immediate change handler
    // Changes will only be applied when the save button is clicked
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    
    // Auto-submit checkbox - no immediate change handler
    // Changes will only be applied when the save button is clicked
    const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
    
    
    // Silence timeout input
    const silenceTimeoutInput = document.getElementById('silence-timeout-input');
    if (silenceTimeoutInput) {
        silenceTimeoutInput.addEventListener('change', () => {
            const value = parseInt(silenceTimeoutInput.value, 10);
            // Ensure the value is within the valid range
            const validValue = Math.min(Math.max(value, 500), 10000);
            if (value !== validValue) {
                silenceTimeoutInput.value = validValue;
            }
            saveSetting('silenceTimeout', validValue);
        });
    }
    
    // Auto-correction prompt textarea
    const autoCorrectionPromptTextarea = document.getElementById('auto-correction-prompt-textarea');
    if (autoCorrectionPromptTextarea) {
        autoCorrectionPromptTextarea.addEventListener('change', () => {
            saveSetting('autoCorrectionPrompt', autoCorrectionPromptTextarea.value);
        });
    }
    
    // Proofreading prompt textarea
    const proofreadingPromptTextarea = document.getElementById('proofreading-prompt-textarea');
    if (proofreadingPromptTextarea) {
        proofreadingPromptTextarea.addEventListener('change', () => {
            saveSetting('proofreadingPrompt', proofreadingPromptTextarea.value);
        });
    }
}

/**
 * Makes an element draggable
 * @param {HTMLElement} element - The element to make draggable
 */
function makeDraggable(element) {
    const header = element.querySelector('h3');
    if (!header) return;
    
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    header.style.cursor = 'move';
    
    header.onmousedown = e => {
        isDragging = true;
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
        
        // ドラッグ中のスタイル
        if (element.classList.contains('otak-voice-settings')) {
            element.classList.add('otak-voice-settings--dragging');
        } else if (element.classList.contains('otak-voice-recognition')) {
            element.classList.add('otak-voice-recognition--dragging');
        } else {
            element.classList.add('otak-voice-modal--dragging');
        }
    };

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;

        element.style.left = (e.clientX - offsetX) + 'px';
        element.style.top = (e.clientY - offsetY) + 'px';
        element.style.transform = 'none';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (element.classList.contains('otak-voice-settings')) {
            element.classList.remove('otak-voice-settings--dragging');
        } else if (element.classList.contains('otak-voice-recognition')) {
            element.classList.remove('otak-voice-recognition--dragging');
        } else {
            element.classList.remove('otak-voice-modal--dragging');
        }
    });
}

/**
 * Creates the history panel
 */
export function createHistoryPanel() {
    const panel = document.createElement('div');
    panel.className = 'otak-voice-history';
    // Title is now handled by CSS :first-child selector, but keep a placeholder div
    panel.innerHTML = `<div>${chrome.i18n.getMessage('historyPanelTitle')}</div>`;
    document.body.appendChild(panel);

    updateHistoryPanel();
}

/**
 * Sets up event listeners
 */
export function setupEventListeners() {
    // Input field click monitoring has been moved to initInputHandler in input-handler.js

    // メインメニューボタン
    const menuButton = document.querySelector('.otak-voice-menu__btn');
    if (menuButton) {
        menuButton.addEventListener('click', () => {
            publish(EVENTS.MENU_TOGGLED);
        });
    }

    // マイクボタン
    const micButton = document.querySelector('.otak-voice-menu__input-btn');
    if (micButton) {
        micButton.addEventListener('click', () => {
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE && !micButton.classList.contains('otak-voice-menu__item--disabled')) {
                publish(EVENTS.MIC_BUTTON_CLICKED);
            } else if (processingState !== PROCESSING_STATE.IDLE) {
                showStatus('statusProcessingInProgress');
            }
        });
    }

    // 自動送信トグルボタン
    const autoSubmitButton = document.querySelector('.otak-voice-menu__append-btn');
    if (autoSubmitButton) {
        autoSubmitButton.addEventListener('click', () => {
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE && !autoSubmitButton.classList.contains('otak-voice-menu__item--disabled')) {
                publish(EVENTS.AUTO_SUBMIT_TOGGLED, { fromMenuButton: true });
            } else if (processingState !== PROCESSING_STATE.IDLE) {
                showStatus('statusProcessingInProgress');
            }
        });
    }

    // クリアボタン
    const clearButton = document.querySelector('.otak-voice-menu__clear-btn');
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE && !clearButton.classList.contains('otak-voice-menu__item--disabled')) {
                publish(EVENTS.INPUT_CLEARED);
            } else if (processingState !== PROCESSING_STATE.IDLE) {
                showStatus('statusProcessingInProgress');
            }
        });
    }

    // 校閲ボタン
    const proofreadButton = document.querySelector('.otak-voice-menu__proofread-btn');
    if (proofreadButton) {
        proofreadButton.addEventListener('click', () => {
            // Execute if not processing
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE && !proofreadButton.classList.contains('otak-voice-menu__item--disabled')) {
                publish(EVENTS.GPT_PROOFREADING_STARTED);
            } else if (processingState !== PROCESSING_STATE.IDLE) {
                // Notify that processing is in progress
                showStatus('statusProcessingInProgress');
            }
        });
    }

    // 編集ボタン
    const editButton = document.querySelector('.otak-voice-menu__edit-btn');
    if (editButton) {
        editButton.addEventListener('click', () => {
            // Execute if not processing
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE && !editButton.classList.contains('otak-voice-menu__item--disabled')) {
                publish(EVENTS.GPT_EDITING_STARTED);
            } else if (processingState !== PROCESSING_STATE.IDLE) {
                // Notify that processing is in progress
                showStatus('statusProcessingInProgress');
            }
        });
    }

    // 設定ボタン
    const settingsButton = document.querySelector('.otak-voice-menu__settings-btn');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE && !settingsButton.classList.contains('otak-voice-menu__item--disabled')) {
                publish(EVENTS.SETTINGS_MODAL_TOGGLED);
            } else if (processingState !== PROCESSING_STATE.IDLE) {
                showStatus('statusProcessingInProgress');
            }
        });
    }

    // 履歴ボタン
    const historyButton = document.querySelector('.otak-voice-menu__history-btn');
    if (historyButton) {
        historyButton.addEventListener('click', () => {
            const processingState = getState('processingState');
            if (processingState === PROCESSING_STATE.IDLE && !historyButton.classList.contains('otak-voice-menu__item--disabled')) {
                publish(EVENTS.HISTORY_PANEL_TOGGLED);
            } else if (processingState !== PROCESSING_STATE.IDLE) {
                showStatus('statusProcessingInProgress');
            }
        });
    }

    // Settings modal save and cancel buttons
    const saveButton = document.querySelector('.otak-voice-settings__save-btn');
    const cancelButton = document.querySelector('.otak-voice-settings__cancel-btn');

    if (saveButton) {
        saveButton.addEventListener('click', () => {
            publish(EVENTS.SETTINGS_SAVED);
        });
    }

    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            publish(EVENTS.SETTINGS_MODAL_TOGGLED);
        });
    }
 
    // Settings modal: Set up event listener for auto-detect toggle
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    if (autoDetectCheckbox) {
        // Set tooltip for initial display
        updateAutoDetectTooltip();
        // Update tooltip when state changes
        autoDetectCheckbox.addEventListener('change', updateAutoDetectTooltip);
    }
    
    // Set up event subscriptions
    setupEventSubscriptions();

    // Settings modal: Set up event listener for auto-correction toggle
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    if (autoCorrectionCheckbox) {
        // Set tooltip for initial display
        updateAutoCorrectionTooltip();
        // Update tooltip when state changes
        autoCorrectionCheckbox.addEventListener('change', updateAutoCorrectionTooltip);
    }

    // Settings modal: Set up event listener for history context toggle
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    if (useHistoryContextCheckbox) {
        // Set tooltip for initial display
        updateUseHistoryContextTooltip();
        // Update tooltip when state changes
        useHistoryContextCheckbox.addEventListener('change', updateUseHistoryContextTooltip);
    }

    // Settings modal: Set up event listener for show modal window toggle
    // Note: The change event listener for this checkbox is now added in createSettingsModal
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    if (showModalWindowCheckbox) {
        // Set initial state
        showModalWindowCheckbox.checked = getState('showModalWindow');
    }
 
    // Automatically turn on the microphone when a text area is focused (only if auto-recognition is off)
    document.addEventListener('focusin', e => {
        // If the focused element is an input element and auto-recognition is off
        if (isInputElement(e.target) && getState('autoDetectInputFields') === false && !getState('isListening')) {
            // Turn on the microphone - publish an event
            publish(EVENTS.MIC_BUTTON_CLICKED);
        }
    });
}

/**
 * Updates the processing state and changes button display
 * @param {string} state - Processing state (from PROCESSING_STATE constant)
 */
// 処理状態のタイムアウトID
let processingStateTimeoutId = null;

export function updateProcessingState(state) {
    // Update state
    setState('processingState', state);
    
    // Get all buttons
    const proofreadButton = document.querySelector('.otak-voice-menu__proofread-btn');
    const editButton = document.querySelector('.otak-voice-menu__edit-btn');
    const micButton = document.querySelector('.otak-voice-menu__input-btn');
    const appendButton = document.querySelector('.otak-voice-menu__append-btn');
    const clearButton = document.querySelector('.otak-voice-menu__clear-btn');
    const settingsButton = document.querySelector('.otak-voice-menu__settings-btn');
    const historyButton = document.querySelector('.otak-voice-menu__history-btn');
    
    // Check if processing
    const isProcessing = state !== PROCESSING_STATE.IDLE;
    
    // Add disabled-button class to all buttons when processing
    const themeToggleButton = document.querySelector('.otak-voice-menu__theme-toggle-btn');
    const modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
    const allButtons = [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton];
    allButtons.forEach(button => {
        if (button) {
            if (isProcessing) {
                button.classList.add('otak-voice-menu__item--disabled');
            } else {
                button.classList.remove('otak-voice-menu__item--disabled');
            }
        }
    });
    
    // 処理状態が変更されたら、既存のタイムアウトをクリア
    if (processingStateTimeoutId) {
        clearTimeout(processingStateTimeoutId);
        processingStateTimeoutId = null;
    }
    
    // 処理中の場合、安全のために30秒後に自動的に処理状態をリセット
    if (isProcessing) {
        processingStateTimeoutId = setTimeout(() => {
            console.log('処理状態が30秒間変更されなかったため、自動的にリセットします');
            updateProcessingState(PROCESSING_STATE.IDLE);
            
            // ステータス表示も非表示に
            const statusElem = document.querySelector('.otak-voice-status');
            if (statusElem) {
                statusElem.style.display = 'none';
                statusElem.classList.remove('otak-voice-status--processing');
            }
        }, 30000);
    }
    
    // Apply processing style only to the button that is processing
    if (proofreadButton) {
        if (state === PROCESSING_STATE.PROOFREADING) {
            // Display during proofreading
            proofreadButton.classList.add('otak-voice-menu__proofread-btn--processing');
            proofreadButton.classList.remove('otak-voice-menu__item--disabled'); // 処理中のボタンはdisabledにしない
            const iconContainer = proofreadButton.querySelector('.otak-voice-menu__icon-container');
            if (iconContainer) {
                iconContainer.innerHTML = LOADING_ICON;
            }
        } else {
            // Return to normal display
            proofreadButton.classList.remove('otak-voice-menu__proofread-btn--processing');
            const iconContainer = proofreadButton.querySelector('.otak-voice-menu__icon-container');
            if (iconContainer) {
                iconContainer.innerHTML = PROOFREAD_ICON;
            }
        }
    }
     
    if (editButton) {
        if (state === PROCESSING_STATE.EDITING) {
            // Display during editing
            editButton.classList.add('otak-voice-menu__edit-btn--processing');
            editButton.classList.remove('otak-voice-menu__item--disabled'); // 処理中のボタンはdisabledにしない
            const iconContainer = editButton.querySelector('.otak-voice-menu__icon-container');
            if (iconContainer) {
                iconContainer.innerHTML = LOADING_ICON;
            }
        } else {
            // Return to normal display
            editButton.classList.remove('otak-voice-menu__edit-btn--processing');
            const iconContainer = editButton.querySelector('.otak-voice-menu__icon-container');
            if (iconContainer) {
                iconContainer.innerHTML = EDIT_ICON;
            }
        }
    }
    
    // Update status display background color
    const statusElem = document.querySelector('.otak-voice-status');
    if (statusElem && statusElem.style.display === 'block') {
        if (isProcessing) {
            statusElem.classList.add('otak-voice-status--processing');
        } else {
            statusElem.classList.remove('otak-voice-status--processing');
        }
    }
}
/**
 * Updates the tooltip for the auto-detect setting toggle
 */
export function updateAutoDetectTooltip() {
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    // Get the label element: expected to be the parent .otak-voice-settings__switch of the checkbox
    const autoDetectLabel = autoDetectCheckbox?.closest('.otak-voice-settings__switch');

    if (autoDetectCheckbox && autoDetectLabel) {
        // Select message key based on checkbox state
        const tooltipKey = autoDetectCheckbox.checked ? 'settingAutoDetectTooltipOn' : 'settingAutoDetectTooltipOff';
        // Remove title attribute to disable native tooltip
    } else {
        // Log if elements are not found (for debugging)
        // console.warn('updateAutoDetectTooltip: Checkbox or Label not found.');
    }
}

/**
 * Updates the tooltip for the auto-correction setting toggle
 */
export function updateAutoCorrectionTooltip() {
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    // Get the label element: expected to be the parent .otak-voice-settings__switch of the checkbox
    const autoCorrectionLabel = autoCorrectionCheckbox?.closest('.otak-voice-settings__switch');

    if (autoCorrectionCheckbox && autoCorrectionLabel) {
        // Select message key based on checkbox state
        const tooltipKey = autoCorrectionCheckbox.checked ? 'settingAutoCorrectionTooltipOn' : 'settingAutoCorrectionTooltipOff';
        // Remove title attribute to disable native tooltip
    }
}

/**
 * Updates the tooltip for the history context setting toggle
 */
export function updateUseHistoryContextTooltip() {
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    // Get the label element: expected to be the parent .otak-voice-settings__switch of the checkbox
    const useHistoryContextLabel = useHistoryContextCheckbox?.closest('.otak-voice-settings__switch');

    if (useHistoryContextCheckbox && useHistoryContextLabel) {
        // Select message key based on checkbox state
        const tooltipKey = useHistoryContextCheckbox.checked ? 'settingUseHistoryContextTooltipOn' : 'settingUseHistoryContextTooltipOff';
        // Remove title attribute to disable native tooltip
    }
}

/**
 * Updates the tooltip for the show modal window setting toggle
 */
export function updateShowModalWindowTooltip() {
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    // Get the label element: expected to be the parent .otak-voice-settings__switch of the checkbox
    const showModalWindowLabel = showModalWindowCheckbox?.closest('.otak-voice-settings__switch');

    if (showModalWindowCheckbox && showModalWindowLabel) {
        // Select message key based on checkbox state
        const tooltipKey = showModalWindowCheckbox.checked ? 'settingShowModalWindowTooltipOn' : 'settingShowModalWindowTooltipOff';
        // Remove title attribute to disable native tooltip
    }
}

/**
 * Creates and displays a modal dialog for showing voice recognition text
 * @param {string} text - Text to display
 * @param {boolean} isInitial - Whether this is the initial display
 */
export function showRecognitionTextModal(text = '', isInitial = false) {
  // Set flag indicating the start of a new recognition session
  if (isInitial) {
    setState('newRecognitionSession', true);
    setState('lastAppendedText', '');
  }
  
  // Do nothing if modal display flag is off
  if (!getState('showModalWindow')) {
    return;
  }
  
  // Get current theme
  const currentTheme = getState('themeMode') || THEME_MODES.DARK;
  
  // Check if a modal already exists
  let modal = document.querySelector('.otak-voice-recognition');
  
  // Create a new modal if one doesn't exist
  if (!modal) {
    // Modal container
    modal = document.createElement('div');
    modal.className = 'otak-voice-recognition';
    
    // Set theme attribute on document root element
    document.documentElement.setAttribute('data-otak-theme', currentTheme);
    
    // Header, body structure
    modal.innerHTML = `
      <h3>${chrome.i18n.getMessage('recognitionModalTitle')}</h3>
      <textarea placeholder="${isInitial ? chrome.i18n.getMessage('recognitionModalPlaceholder') : ''}"></textarea>
      <div class="otak-voice-recognition__button-container">
        <button class="otak-voice-recognition__copy-btn">${chrome.i18n.getMessage('recognitionModalCopyButton')}</button>
        <button class="otak-voice-recognition__close-btn">${chrome.i18n.getMessage('recognitionModalCloseButton')}</button>
      </div>
    `;
    
    // Safely set textarea value to prevent XSS
    const textarea = modal.querySelector('textarea');
    if (textarea) {
        textarea.value = text;
    }

    // Add event listeners to buttons
    const copyButton = modal.querySelector('.otak-voice-recognition__copy-btn');
    copyButton.onclick = () => {
      const textarea = modal.querySelector('textarea');
      textarea.select();
      document.execCommand('copy');
      
      // 元のボタンテキストを保存
      const originalText = copyButton.textContent;
      
      // ボタンテキストを「コピーしました」に変更
      copyButton.textContent = chrome.i18n.getMessage('recognitionModalCopied');
      
      // Check if autoSubmit is enabled
      const autoSubmit = getState('autoSubmit');
      
      // Only close the modal if autoSubmit is enabled
      if (autoSubmit) {
        setTimeout(() => {
          modal.remove();
        }, 1000);
      } else {
        // 自動閉じない場合は、2秒後にボタンテキストを元に戻す
        setTimeout(() => {
          if (modal.querySelector('.otak-voice-recognition__copy-btn')) {
            copyButton.textContent = originalText;
          }
        }, 2000);
      }
    };
    
    const closeButton = modal.querySelector('.otak-voice-recognition__close-btn');
    closeButton.onclick = () => {
      modal.remove();
    };
    
    // Allow closing with ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.querySelector('.otak-voice-recognition')) {
        modal.remove();
      }
    });
    
    // Add to body
    document.body.appendChild(modal);
    
    // Add drag functionality
    makeDraggable(modal);
  } else {
    // Update text if modal already exists
    const textarea = modal.querySelector('textarea');
    if (textarea) {
      textarea.value = text;
    }
  }
  
  // Select the textarea (only if not initial display)
  if (!isInitial && text.trim() !== '') {
    const textarea = modal.querySelector('textarea');
    if (textarea) {
      textarea.select();
    }
  }
  
  return modal;
}

/**
 * Updates the text in the voice recognition modal
 * @param {string} text - Text to display
 */
export function updateRecognitionModal(text) {
  // Do nothing if modal display flag is off
  if (!getState('showModalWindow')) {
    return;
  }
  
  const modal = document.querySelector('.otak-voice-recognition');
  if (modal) {
    const textarea = modal.querySelector('textarea');
    if (textarea) {
      // Simply replace the text
      textarea.value = text;
    }
  }
}