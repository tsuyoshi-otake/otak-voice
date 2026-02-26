/**
 * Input Storage Module
 * Provides Chrome storage operations for input handler state
 */

import { publish, EVENTS } from './event-bus.js';
import { setState } from './state.js';
import {
    createError,
    handleError,
    tryCatch,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './error-handler.js';
import { updateAutoSubmitButtonState } from './input-menu.js';

// Storage keys
export const MENU_EXPANDED_STORAGE_KEY = 'menu_expanded_state';
export const AUTO_SUBMIT_STORAGE_KEY = 'otak_voice_auto_submit_state';

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
        return result[MENU_EXPANDED_STORAGE_KEY];
    } else {
        return false; // Default value
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
