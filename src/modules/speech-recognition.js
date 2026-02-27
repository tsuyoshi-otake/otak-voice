/**
 * Speech Recognition Module - Core speech recognition functionality
 */
import { correctWithGPT } from './gpt-service.js';
import { addToHistory } from './history.js';
import { isInputElement } from './dom-utils.js';
import { getState, setState } from './state.js';
import { publish, subscribe as eventSubscribe, EVENTS } from './event-bus.js';
import { DEFAULT_SETTINGS } from '../constants.js';
import { detectSiteType } from '../site-handlers/site-detector.js';
import {
    createError, handleError, mapSpeechErrorToErrorCode,
    ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY
} from './error-handler.js';
import {
    updateMicButtonState, basicCleanup, showStatus,
    playBeepSound
} from './speech-utils.js';
import { handleEditButtonClick } from './speech-edit.js';

let recognitionInstance = null;
let warmupTimerId = null;
setState({ isListening: false, isEditing: false });

/** Stop and clear the existing recognition instance and any pending warmup. */
export function stopExistingRecognition() {
    if (warmupTimerId) {
        clearTimeout(warmupTimerId);
        warmupTimerId = null;
    }
    if (recognitionInstance) {
        try { recognitionInstance.stop(); } catch (e) {
            console.warn("Previous recognition stop error:", e);
        }
        recognitionInstance = null;
    }
}

/** Set the recognition instance (used by speech-edit to share instance). */
export function setRecognitionInstance(instance) {
    recognitionInstance = instance;
}

/**
 * Set up event subscriptions for speech recognition.
 * Note: LANGUAGE_UPDATED subscription is handled by the barrel file (speech.js)
 * to ensure the correct function reference is used for testability.
 */
export function initSpeechEvents() {
    eventSubscribe(EVENTS.MIC_BUTTON_CLICKED, handleMicButtonClick);
    eventSubscribe(EVENTS.GPT_EDITING_STARTED, handleEditButtonClick);
    eventSubscribe(EVENTS.RECOGNITION_MODAL_CLOSED, () => {
        if (getState('isListening')) {
            stopSpeechRecognition();
        }
    });
}

/** Mic button click handler */
function handleMicButtonClick() {
    const previousActiveElement = document.activeElement;
    const wasPreviousElementInput = isInputElement(previousActiveElement);
    publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: '', isInitial: true });
    let currentInputElement;
    if (wasPreviousElementInput) {
        currentInputElement = previousActiveElement;
        setState('currentInputElement', currentInputElement);
    } else {
        currentInputElement = document.activeElement;
        if (!isInputElement(currentInputElement)) {
            const lastClickedInput = getState('lastClickedInput');
            const autoDetectInputFields = getState('autoDetectInputFields');
            if (lastClickedInput && isInputElement(lastClickedInput)) {
                currentInputElement = lastClickedInput;
            } else if (autoDetectInputFields) {
                publish(EVENTS.INPUT_FIELD_FOUND);
                currentInputElement = getState('currentInputElement');
            } else {
                currentInputElement = null;
            }
            if (currentInputElement) {
                currentInputElement.focus();
                setState('currentInputElement', currentInputElement);
                showStatus('statusInputFound');
            } else {
                setState('useRecognitionModal', true);
                showStatus('statusUsingModalDialog');
                toggleSpeechRecognition();
                return;
            }
        }
    }
    toggleSpeechRecognition();
}

/** Start/stop speech recognition */
export function toggleSpeechRecognition() {
    if (getState('isListening')) { stopSpeechRecognition(); }
    else { startSpeechRecognition(); }
}

/** Start speech recognition */
export function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
         alert(chrome.i18n.getMessage('alertSpeechApiNotAvailable'));
         return;
    }
    stopExistingRecognition();
    showStatus('statusPreparingRecognition', undefined, true);
    recognitionInstance = new SpeechRecognition();
    const recognition = recognitionInstance;
    recognition.lang = getState('recognitionLang');
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    if ('speechSetting' in recognition) {
        try {
            recognition.speechSetting = {
                speechRecognitionTimeoutMs: 100,
                speechRecognitionMaxAlternatives: 1,
                speechRecognitionGrammars: []
            };
        } catch (e) { console.warn("Failed to set speechSetting:", e); }
    }
    let lastResultTime = 0;
    let silenceTimer = null;
    const silenceTimeout = getState('silenceTimeout') || DEFAULT_SETTINGS.SILENCE_TIMEOUT;

    recognition.onstart = function() {
        setState('isListening', true);
        updateMicButtonState(true);
        setState('interimText', '');
        playBeepSound('start');
        showStatus('statusListening');
        setState('recognitionReady', true);
    };

    recognition.onresult = async function(event) {
        const results = event.results;
        const result = results[results.length - 1];
        const transcript = result[0].transcript;
        setState('lastRecognizedText', transcript);
        lastResultTime = Date.now();
        if (silenceTimer) { clearTimeout(silenceTimer); }
        silenceTimer = setTimeout(() => {
            console.log('[Speech] Silence detected for ' + silenceTimeout + 'ms, stopping recognition');
            if (recognitionInstance) {
                try { recognitionInstance.stop(); } catch (e) {
                    console.warn("Error stopping recognition after silence:", e);
                }
            }
        }, silenceTimeout);

        const showModalWindow = getState('showModalWindow');
        if (showModalWindow) {
            if (!result.isFinal) {
                publish(EVENTS.RECOGNITION_MODAL_UPDATED, transcript);
            } else {
                const cleaned = basicCleanup(transcript);
                try {
                    const autoCorrection = getState('autoCorrection');
                    const corrected = autoCorrection ? await correctWithGPT(cleaned) : cleaned;
                    setState('lastRecognizedText', corrected);
                    publish(EVENTS.RECOGNITION_MODAL_UPDATED, corrected);
                    addToHistory(corrected);
                    showStatus('statusCorrectionSuccess');
                } catch (error) {
                    console.error(chrome.i18n.getMessage('logCorrectionError'), error);
                    publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
                    addToHistory(cleaned);
                    showStatus('statusCorrectionError', error.message || 'Unknown error');
                }
            }
            return;
        }
        if (!result.isFinal) { publish(EVENTS.RECOGNITION_MODAL_UPDATED, transcript); }
        const currentInputElement = getState('currentInputElement');
        const useRecognitionModal = getState('useRecognitionModal');
        if (!currentInputElement || useRecognitionModal) {
            if (result.isFinal) {
                const cleaned = basicCleanup(transcript);
                publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
                try {
                    const autoCorrection = getState('autoCorrection');
                    const corrected = autoCorrection ? await correctWithGPT(cleaned) : cleaned;
                    setState('lastRecognizedText', corrected);
                    publish(EVENTS.RECOGNITION_MODAL_UPDATED, corrected);
                    addToHistory(corrected);
                    showStatus('statusCorrectionSuccess');
                } catch (error) {
                    console.error(chrome.i18n.getMessage('logCorrectionError'), error);
                    publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
                    addToHistory(cleaned);
                    showStatus('statusCorrectionError', error.message || 'Unknown error');
                }
                return;
            }
            return;
        }
        // Normal overwrite mode
        if (result.isFinal) {
            const cleaned = basicCleanup(transcript);
            try {
                const autoCorrection = getState('autoCorrection');
                const corrected = autoCorrection ? await correctWithGPT(cleaned) : cleaned;
                setState('lastRecognizedText', corrected);
                const siteType = detectSiteType();
                if (siteType === 'twitter') {
                    publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: corrected, isInitial: false });
                    addToHistory(corrected);
                    showStatus('statusCorrectionSuccess');
                    return;
                }
                publish(EVENTS.SPEECH_RECOGNITION_RESULT, { final: true, text: corrected, append: false });
                addToHistory(corrected);
                showStatus('statusCorrectionSuccess');
            } catch (error) {
                console.error(chrome.i18n.getMessage('logCorrectionErrorOverwrite'), error);
                const siteType = detectSiteType();
                if (siteType === 'twitter') {
                    publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: cleaned, isInitial: false });
                    addToHistory(cleaned);
                    showStatus('statusCorrectionError', error.message || 'Unknown error');
                    return;
                }
                publish(EVENTS.SPEECH_RECOGNITION_RESULT, { final: true, text: cleaned, append: false });
                addToHistory(cleaned);
                showStatus('statusCorrectionError', error.message || 'Unknown error');
            }
        } else {
            publish(EVENTS.SPEECH_RECOGNITION_RESULT, { final: false, text: transcript, append: false });
        }
    };

    recognition.onend = function() {
        const wasListening = getState('isListening');
        setState('isListening', false);
        setState('lastRecognitionStopTime', Date.now());
        updateMicButtonState(false);
        playBeepSound('end');
        setState('useRecognitionModal', false);
        setState('recognitionReady', false);
        const existingModal = document.querySelector('.otak-voice-recognition');
        if (existingModal) {
            const textarea = existingModal.querySelector('textarea');
            if (textarea && textarea.value.trim() !== '') {
                const textContent = textarea.value.trim();
                const copyButton = existingModal.querySelector('.otak-voice-recognition__copy-btn');
                if (copyButton) { copyButton.click(); }
                // When auto-submit is enabled, write modal text to input field and submit
                if (getState('autoSubmit')) {
                    publish(EVENTS.SPEECH_RECOGNITION_RESULT, { final: true, text: textContent, append: false });
                }
            } else { existingModal.remove(); }
        }
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    };

    recognition.onerror = function(event) {
        const errorCode = mapSpeechErrorToErrorCode(event.error);
        const error = createError(errorCode, null, null, { originalError: event.error });
        handleError(error, true, false, 'speech');
        setState('isListening', false);
        updateMicButtonState(false);
        recognitionInstance = null;
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    };

    // Set isListening immediately to prevent duplicate starts from rapid clicks
    setState('isListening', true);
    updateMicButtonState(true);

    warmupTimerId = setTimeout(() => {
        warmupTimerId = null;
        try {
            recognition.start();
            console.log('[Speech] Recognition started after warmup');
        } catch (e) {
            const error = createError(ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED, null, e, null, ERROR_SEVERITY.ERROR);
            handleError(error, true, false, 'speech');
            setState('isListening', false);
            updateMicButtonState(false);
            recognitionInstance = null;
        }
    }, 300);
}

/** Stop speech recognition (when explicitly stopping) */
export function stopSpeechRecognition() {
    // Cancel pending warmup timer if stop is requested during warmup
    if (warmupTimerId) {
        clearTimeout(warmupTimerId);
        warmupTimerId = null;
    }
    const isListening = getState('isListening');
    if (recognitionInstance && isListening) {
        try {
            recognitionInstance.stop();
            showStatus('statusSpeechStop');
        } catch (e) {
            const error = createError(ERROR_CODE[ERROR_CATEGORY.SPEECH].STOP_FAILED, null, e, null, ERROR_SEVERITY.ERROR);
            handleError(error, true, false, 'speech');
        }
    }
    setState('isListening', false);
    setState('lastRecognitionStopTime', Date.now());
    updateMicButtonState(false);
    recognitionInstance = null;
}
