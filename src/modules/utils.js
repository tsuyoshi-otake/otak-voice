/**
 * Utility Module
 * Provides common utility functions used throughout the application
 */

import { getState } from './state.js';
import { publish, EVENTS } from './event-bus.js';

/**
 * Performs basic text cleanup
 * @param {string} text - Text to clean up
 * @returns {string} Cleaned up text
 */
export function basicCleanup(text) {
    // Remove leading/trailing whitespace
    let cleaned = text.trim();
    // Fix punctuation (e.g., reduce consecutive punctuation to one)
    cleaned = cleaned.replace(/([、。]){2,}/g, '$1');
    // Remove unnatural spaces (e.g., spaces before punctuation)
    cleaned = cleaned.replace(/\s+([、。])/g, '$1');
    return cleaned;
}

/**
 * Function to encourage React state updates
 * Re-fires input field events to encourage React state updates
 */
export function retryInputEvents() {
    // Get current text input field from state
    const inputField = getState('currentInputElement') || document.activeElement;
    if (isInputElement(inputField)) {
        // Trigger events again to encourage React state update
        const currentText = inputField.isContentEditable ?
            inputField.textContent : inputField.value;

        if (currentText && currentText.trim() !== '') {
            // Simulate key input to force React state update
            try {
                // Try firing various events
                for (const eventType of ['keydown', 'keyup', 'keypress', 'input', 'change']) {
                    const event = eventType.startsWith('key') ?
                        new KeyboardEvent(eventType, {
                            key: 'a',
                            code: 'KeyA',
                            bubbles: true,
                            cancelable: true
                        }) :
                        new Event(eventType, { bubbles: true, cancelable: true });

                    inputField.dispatchEvent(event);
                }

                // Temporarily change value to encourage state update
                if (!inputField.isContentEditable) {
                    const tempValue = currentText + " ";
                    inputField.value = tempValue;
                    inputField.dispatchEvent(new Event('input', { bubbles: true }));

                    // Restore original value
                    setTimeout(() => {
                        inputField.value = currentText;
                        inputField.dispatchEvent(new Event('input', { bubbles: true }));
                        inputField.dispatchEvent(new Event('change', { bubbles: true }));

                        // Wait a bit more before trying to submit again
                        setTimeout(() => {
                            // Import and call autoSubmitAfterVoiceInput function
                            // To avoid circular references, don't import directly here,
                            // but call through the global object
                            // モーダルウィンドウを使用していない場合のみ自動送信
                            const useRecognitionModal = getState('useRecognitionModal');
                            if (!useRecognitionModal) {
                                // Use event bus to trigger auto submit
                                publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
                                    final: true,
                                    text: currentText,
                                    append: false
                                });
                            }
                        }, 300);
                    }, 50);
                    return;
                }
            } catch (e) {
                console.error(chrome.i18n.getMessage('logStateUpdateError'), e);
            }
        }
    }
}

/**
 * Determines if an element is an input element
 * @param {Element} el - Element to check
 * @returns {boolean} true if it's an input element
 */
export function isInputElement(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    const type = el.type ? el.type.toLowerCase() : '';
    // Also check that it's not read-only
    const isReadOnly = el.readOnly || el.disabled || el.getAttribute('aria-readonly') === 'true';
    return !isReadOnly && (
        tag === 'textarea' ||
        (tag === 'input' && ['text', 'search', 'email', 'password', 'url', 'tel', ''].includes(type)) ||
        el.isContentEditable
    );
}

/**
 * Sets value to textarea by directly manipulating DOM
 * @param {Element} element - Element to set value to
 * @param {string} value - Value to set
 * @returns {boolean} true if successful
 */
export function forceSetTextAreaValue(element, value) {
    if (!element) return false;

    try {
        // 1. Save original property descriptor
        const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');

        // 2. Bypass React control and set value directly
        Object.defineProperty(element, 'value', {
            configurable: true,
            writable: true,
            value: value
        });

        // 3. Fire input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // 4. Restore original property descriptor (optional)
        if (descriptor) {
            Object.defineProperty(element, 'value', descriptor);
        }

        console.log(chrome.i18n.getMessage('logForceSetSuccess'), value);
        return true;
    } catch (e) {
        console.error(chrome.i18n.getMessage('logForceSetError'), e);
        return false;
    }
}