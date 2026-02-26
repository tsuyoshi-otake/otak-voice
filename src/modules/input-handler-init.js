/**
 * Input Handler Initialization Module
 * Provides initialization and event subscription setup for input handling
 */

import { loadMenuState, loadAutoSubmitState } from './input-storage.js';
import { toggleMenu, updateMenuState, toggleSettingsModal, updateAutoSubmitButtonState, toggleAutoSubmit } from './input-menu.js';
import {
    findBestInputField,
    autoSubmitAfterVoiceInput,
    writeToInputField,
    simulateTypingIntoElement,
    clearCurrentInput,
    proofreadCurrentInput,
    enhanceInputElementHandlers
} from './input-operations.js';
import { getState, setState, initializeState } from './state.js';
import { publish, subscribe as eventSubscribe, EVENTS } from './event-bus.js';
import {
    createError,
    handleError,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './error-handler.js';
import { isInputElement } from './dom-utils.js';

// Variables for append mode
// Local variable removed because we use window.originalText
let interimText = ""; // Interim recognition result
let menuExpanded = false; // Menu expanded state
const keydownHandlers = new Map(); // Map of elements and keydown handlers

/**
 * input-handler モジュールの初期化
 */
export async function initInputHandler() {
    // 状態管理モジュールの初期化
    initializeState();

    // メニュー状態と自動送信状態の読み込み
    console.log('Initializing input handler - loading states...');
    menuExpanded = await loadMenuState();
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
export function setupEventSubscriptions() {
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
