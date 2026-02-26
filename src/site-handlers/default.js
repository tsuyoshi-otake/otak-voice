/**
 * Default Site Handler
 * Provides processing for cases that don't match specific site handlers
 */

import { showStatus } from '../modules/ui.js';
import { publish, EVENTS } from '../modules/event-bus.js';
import { getState } from '../modules/state.js';
import {
  findBestSubmitButton,
  findBestInputField as domFindBestInputField,
  isInputElement,
  isButtonDisabled,
  clickButtonWithFeedback,
  findElement,
  findAllElements
} from '../modules/dom-utils.js';

/**
 * Finds the submit button related to the input field
 * @param {Element} inputElement - Input element
 * @returns {Element|null} Submit button element or null
 */
export function findSubmitButtonForInput(inputElement) {
    if (!inputElement) return null;
    
    // Use the DOM abstraction layer to find the best submit button
    const button = findBestSubmitButton(inputElement);
    
    // Debug information
    if (button) {
        console.log(chrome.i18n.getMessage('logSubmitButtonFound'), button);
    } else {
        console.log(chrome.i18n.getMessage('logSubmitButtonNotFound'));
    }
    
    return button;
}

/**
 * Finds the optimal input field
 * @returns {Element|null} Input element or null
 */
export function findBestInputField() {
    // First check for specific tailwind-styled textareas (using the abstraction layer)
    const specificTextarea = findElement('textarea.textarea.w-full.resize-none.pl-2.pr-2[placeholder="メッセージを入力..."]');
    if (specificTextarea && isInputElement(specificTextarea)) {
        console.log(chrome.i18n.getMessage('logSpecificTextareaFound'));
        return specificTextarea;
    }

    // Search without padding classes (wider range)
    const specificTextareaAlt = findElement('textarea.textarea.w-full.resize-none[placeholder="メッセージを入力..."]');
    if (specificTextareaAlt && isInputElement(specificTextareaAlt)) {
        console.log(chrome.i18n.getMessage('logSimilarTextareaFound'));
        return specificTextareaAlt;
    }

    // Search for common Tailwind-styled textarea
    const tailwindTextarea = findElement('textarea.textarea.w-full.resize-none');
    if (tailwindTextarea && isInputElement(tailwindTextarea)) {
        console.log(chrome.i18n.getMessage('logTailwindTextareaFound'));
        return tailwindTextarea;
    }

    // Also prioritize textareas with specific placeholder text
    const placeholderTextareas = findAllElements('textarea[placeholder*="メッセージ"], textarea[placeholder*="message"]');
    const visiblePlaceholderTextarea = placeholderTextareas.find(isInputElement);
    if (visiblePlaceholderTextarea) {
        console.log(chrome.i18n.getMessage('logMessageTextareaFound'));
        return visiblePlaceholderTextarea;
    }

    // For all other cases, use the DOM abstraction layer's findBestInputField
    const bestInput = domFindBestInputField();
    
    if (bestInput) {
        console.log(chrome.i18n.getMessage('logGenericInputFound'));
    }
    
    return bestInput;
}

/**
 * Performs auto-submit after voice input
 * @returns {boolean} true if submission process started
 */
export function submitAfterVoiceInput() {
    // Find current focused element or clicked input element
    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        // Use state management to get lastClickedInput
        const lastClickedInput = getState('lastClickedInput');
        targetElement = lastClickedInput && isInputElement(lastClickedInput)
            ? lastClickedInput
            : findBestInputField();

        if (targetElement) {
            targetElement.focus();
            publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusInputFound' });
        } else {
            publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusInputNotFound' });
            return false;
        }
    }

    // Find submit button using the abstraction layer
    let submitButton = findSubmitButtonForInput(targetElement);

    if (submitButton) {
        // Check if button is disabled using the abstraction layer
        if (isButtonDisabled(submitButton)) {
            publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusSubmitDisabled' });
            return false;
        }

        // Use the abstraction layer to click the button with feedback
        clickButtonWithFeedback(submitButton);
        return true;
    } else {
        publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusSubmitButtonNotFound' });
        return false;
    }
}