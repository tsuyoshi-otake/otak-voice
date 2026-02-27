/**
 * Input Storage Module
 * Provides Chrome storage operations for input handler state
 */

import {
    createError,
    handleError,
    tryCatch,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './error-handler.js';
// Storage keys
export const MENU_EXPANDED_STORAGE_KEY = 'menu_expanded_state';

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
