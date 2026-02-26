/**
 * Speech Edit Module
 * Provides speech-based editing functionality
 */

import { editWithGPT } from './gpt-service.js';
import { isInputElement } from './dom-utils.js';
import { getState, setState } from './state.js';
import { publish, EVENTS } from './event-bus.js';
import { PROCESSING_STATE } from '../constants.js';
import {
    createError, handleError, mapSpeechErrorToErrorCode,
    ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY
} from './error-handler.js';
import { updateMicButtonState, showStatus } from './speech-utils.js';
import { stopExistingRecognition, setRecognitionInstance } from './speech-recognition.js';

/**
 * Edit button click handler
 */
export function handleEditButtonClick() {
    const processingState = getState('processingState');
    if (processingState && processingState !== PROCESSING_STATE.IDLE) {
        showStatus('statusProcessingInProgress');
        return;
    }

    setState('processingState', PROCESSING_STATE.EDITING);

    let targetElement = document.activeElement;
    if (!isInputElement(targetElement)) {
        const lastClickedInput = getState('lastClickedInput');

        // Request to find best input field via event bus
        publish(EVENTS.INPUT_FIELD_FOUND);

        // Get the result from state
        targetElement = lastClickedInput && isInputElement(lastClickedInput)
            ? lastClickedInput
            : getState('currentInputElement');

        if (targetElement) {
            targetElement.focus();
            showStatus('statusInputFound');
        } else {
            showStatus('statusEditFound');
            setState('processingState', PROCESSING_STATE.IDLE);
            return;
        }
    }

    const currentText = targetElement.isContentEditable ?
        targetElement.textContent : targetElement.value;

    if (!currentText || currentText.trim() === '') {
        showStatus('statusEditEmpty');
        setState('processingState', PROCESSING_STATE.IDLE);
        return;
    }

    const apiKey = getState('apiKey');
    if (!apiKey || apiKey.trim() === '') {
        showStatus('statusApiKeyMissing');
        setState('processingState', PROCESSING_STATE.IDLE);
        publish(EVENTS.SETTINGS_MODAL_TOGGLED);
        return;
    }

    setState('isEditing', true);

    // Get edit instructions via voice input
    showStatus('statusEditListening', undefined, true);

    const targetInputElement = targetElement;

    startEditInstructionRecognition(targetInputElement);
}

/**
 * Start speech recognition for edit instructions
 * @param {Element} targetElement - Target element for editing
 */
export function startEditInstructionRecognition(targetElement) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED,
            null, null, null, ERROR_SEVERITY.ERROR
        );
        handleError(error, true, true, 'speech');
        setState('isEditing', false);
        return;
    }

    // Stop any existing recognition instance
    stopExistingRecognition();

    const recognition = new SpeechRecognition();
    setRecognitionInstance(recognition);

    recognition.lang = getState('recognitionLang');
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    // Update status display
    const statusElem = document.querySelector('.otak-voice-status');
    if (statusElem) {
        statusElem.textContent = chrome.i18n.getMessage('statusEditListening');
        statusElem.style.display = 'block';
        statusElem.classList.add('otak-voice-status--processing');
    }

    recognition.onstart = function() {
        setState('isListening', true);
        updateMicButtonState(true);
    };

    recognition.onresult = function(event) {
        const results = event.results;
        const result = results[results.length - 1];
        const transcript = result[0].transcript;

        // Display interim results
        if (!result.isFinal) {
            if (statusElem) {
                statusElem.textContent = chrome.i18n.getMessage('statusEditListeningInterim') + ': ' + transcript;
            }
            return;
        }

        const instruction = transcript.trim();

        if (!instruction) {
            showStatus('statusEditInstructionEmpty');
            setState('isEditing', false);
            setState('processingState', PROCESSING_STATE.IDLE);
            return;
        }

        // Reset status display color
        if (statusElem) {
            statusElem.classList.remove('otak-voice-status--processing');
        }

        showStatus('statusEditInstructionReceived');
        console.log('Edit instruction:', instruction);

        processEditInstruction(instruction, targetElement);
    };

    recognition.onerror = function(event) {
        const errorCode = mapSpeechErrorToErrorCode(event.error);
        const error = createError(errorCode, null, null, { originalError: event.error });
        handleError(error, true, false, 'speech');

        setState('isEditing', false);
        setState('isListening', false);
        updateMicButtonState(false);
        setState('processingState', PROCESSING_STATE.IDLE);

        if (statusElem) {
            statusElem.classList.remove('otak-voice-status--processing');
        }
    };

    recognition.onend = function() {
        setState('isListening', false);
        updateMicButtonState(false);

        if (statusElem) {
            statusElem.classList.remove('otak-voice-status--processing');
        }
    };

    try {
        recognition.start();
        showStatus('statusEditListening');
    } catch (e) {
        console.error(chrome.i18n.getMessage('logSpeechStartError'), e);
        showStatus('statusSpeechStartError');
        setState('isEditing', false);
        setState('processingState', PROCESSING_STATE.IDLE);
    }
}

/**
 * Process edit instructions
 * @param {string} instruction - Edit instruction
 * @param {Element} targetElement - Target element for editing
 */
export async function processEditInstruction(instruction, targetElement) {
    const activeElement = targetElement || document.activeElement;

    if (!activeElement || (!['INPUT', 'TEXTAREA'].includes(activeElement.tagName) && !activeElement.isContentEditable)) {
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND,
            null, null, { elementType: 'input field' }, ERROR_SEVERITY.ERROR
        );
        handleError(error, true, false, 'speech');

        setState('isEditing', false);
        setState('isListening', false);
        updateMicButtonState(false);
        setState('processingState', PROCESSING_STATE.IDLE);
        return;
    }

    const currentText = activeElement.isContentEditable ?
        activeElement.textContent : activeElement.value;

    const apiKey = getState('apiKey');
    if (!apiKey) {
        showStatus('statusApiKeyMissing');
        console.log(chrome.i18n.getMessage('logApiKeyMissingSkip'));
        setState('isEditing', false);
        setState('isListening', false);
        updateMicButtonState(false);
        setState('processingState', PROCESSING_STATE.IDLE);
        return;
    }

    showStatus('statusEditing', undefined, true); // Persistent display
    await editWithGPT(currentText, instruction, activeElement);

    setState('isEditing', false);
    setState('isListening', false);
    updateMicButtonState(false);
    setState('processingState', PROCESSING_STATE.IDLE);
}
