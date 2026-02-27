/**
 * Utility Module
 * Provides common utility functions used throughout the application
 */

import { getState } from './state.js';
import { publish, EVENTS } from './event-bus.js';
import { isInputElement } from './dom-utils.js';

/** Timer IDs for retryInputEvents to prevent accumulation */
let retryOuterTimerId = null;
let retryInnerTimerId = null;

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

                    // Clear previous timers to prevent accumulation from rapid calls
                    if (retryOuterTimerId) { clearTimeout(retryOuterTimerId); retryOuterTimerId = null; }
                    if (retryInnerTimerId) { clearTimeout(retryInnerTimerId); retryInnerTimerId = null; }

                    // Restore original value
                    retryOuterTimerId = setTimeout(() => {
                        retryOuterTimerId = null;
                        if (!inputField.isConnected) return;
                        inputField.value = currentText;
                        inputField.dispatchEvent(new Event('input', { bubbles: true }));
                        inputField.dispatchEvent(new Event('change', { bubbles: true }));

                        // Wait a bit more before trying to submit again
                        retryInnerTimerId = setTimeout(() => {
                            retryInnerTimerId = null;
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

