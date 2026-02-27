/**
 * Input Handler Initialization Module
 * Provides initialization and event subscription setup for input handling
 */

import { loadMenuState } from './input-storage.js';
import { toggleMenu, updateMenuState } from './input-menu.js';
import { toggleSettingsModal } from './ui-settings-modal.js';
import {
    findBestInputField,
    submitAfterVoiceInput,
    writeToInputField,
    simulateTypingIntoElement,
    clearCurrentInput,
    proofreadCurrentInput,
    enhanceInputElementHandlers
} from './input-operations.js';
import { getState, setState } from './state.js';
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
let menuExpanded = false; // Menu expanded state

/** AbortController for document-level listeners */
let clickListenerController = null;

/** Stored unsubscribe functions to prevent subscription accumulation */
let unsubscribeFunctions = [];

/**
 * input-handler モジュールの初期化
 */
export async function initInputHandler() {
    // メニュー状態の読み込み
    console.log('Initializing input handler - loading states...');
    menuExpanded = await loadMenuState();
    console.log('States loaded successfully');

    // メニュー状態を状態管理モジュールに反映
    setState('menuExpanded', menuExpanded);

    // Clean up previous click listener to prevent accumulation on re-init
    if (clickListenerController) clickListenerController.abort();
    clickListenerController = new AbortController();

    // イベントリスナーを設定
    document.addEventListener('click', e => {
        if (isInputElement(e.target)) {
            setState('lastClickedInput', e.target);
            publish(EVENTS.INPUT_FIELD_CLICKED, e.target);
        }
    }, { capture: true, signal: clickListenerController.signal });

    // イベントバスのサブスクライブ
    setupEventSubscriptions();
}

/**
 * イベントバスのサブスクリプションを設定
 */
export function setupEventSubscriptions() {
    // Unsubscribe all previous subscriptions to prevent accumulation
    unsubscribeFunctions.forEach(unsub => unsub());
    unsubscribeFunctions = [];

    // メニュートグルイベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.MENU_TOGGLED, () => {
        toggleMenu();
    }));

    // 設定モーダルトグルイベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.SETTINGS_MODAL_TOGGLED, () => {
        toggleSettingsModal();
    }));

    // 入力クリアイベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.INPUT_CLEARED, () => {
        clearCurrentInput();
    }));

    // 校閲開始イベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.GPT_PROOFREADING_STARTED, () => {
        proofreadCurrentInput();
    }));

    // 入力フィールド検索イベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.INPUT_FIELD_FOUND, () => {
        const bestInputField = findBestInputField();
        if (bestInputField) {
            setState('currentInputElement', bestInputField);
        }
    }));

    // 音声認識結果イベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.SPEECH_RECOGNITION_RESULT, (data) => {
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

            // 手動送信（モーダルのSubmitボタンから）
            if (data.submit) {
                submitAfterVoiceInput();
            }
        } else {
            // 中間結果
            writeToInputField(currentInputElement, text);
        }
    }));

    // メニュー状態更新イベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.MENU_STATE_UPDATE_NEEDED, async () => {
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
    }));

    // 入力ハンドラ更新イベント
    unsubscribeFunctions.push(eventSubscribe(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED, () => {
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
    }));
}
