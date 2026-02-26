/**
 * UI Status Module
 * Responsible for status display and processing state management
 */

import { PROCESSING_STATE } from '../constants.js';
import { getState, setState } from './state.js';
import { LOADING_ICON, PROOFREAD_ICON, EDIT_ICON } from '../icons.js';

// Processing state timeout ID
let processingStateTimeoutId = null;

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

    // Determine if this is an error message
    const isErrorMessage = messageKey.startsWith('status') && (
        messageKey.includes('Error') ||
        messageKey.includes('Empty') ||
        messageKey.includes('NotFound') ||
        messageKey === 'statusProcessingInProgress' ||
        messageKey === 'statusAutoDetectOff'
    );

    // Only hide after timeout if not persistent display or is an error message
    if (!persistent || isErrorMessage) {
        // Shorter timeout for error messages
        const timeout = isErrorMessage ? 3000 : 5000;

        setTimeout(() => {
            if (!statusElem) return;

            // Force hide for error messages
            if (isErrorMessage) {
                statusElem.style.display = 'none';
                statusElem.classList.remove('otak-voice-status--processing');
                return;
            }

            // For normal messages, only hide if not processing
            const currentProcessingState = getState('processingState');
            if (currentProcessingState === PROCESSING_STATE.IDLE) {
                statusElem.style.display = 'none';
                statusElem.classList.remove('otak-voice-status--processing');
            }
        }, timeout);
    }
}

/**
 * Updates the processing state and changes button display
 * @param {string} state - Processing state (from PROCESSING_STATE constant)
 */
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

    // Clear existing timeout when processing state changes
    if (processingStateTimeoutId) {
        clearTimeout(processingStateTimeoutId);
        processingStateTimeoutId = null;
    }

    // Auto-reset processing state after 30 seconds for safety
    if (isProcessing) {
        processingStateTimeoutId = setTimeout(() => {
            console.log('Processing state was not changed for 30 seconds, resetting automatically');
            updateProcessingState(PROCESSING_STATE.IDLE);

            // Also hide status display
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
            proofreadButton.classList.remove('otak-voice-menu__item--disabled');
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
            editButton.classList.remove('otak-voice-menu__item--disabled');
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
