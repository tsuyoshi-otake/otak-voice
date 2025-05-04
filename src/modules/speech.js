/**
 * Speech Recognition Module
 * Provides speech recognition functionality
 */

import { correctWithGPT, editWithGPT } from './gpt-service.js';
import { addToHistory } from './history.js';
import { isInputElement } from './utils.js';
import { getState, setState, subscribe } from './state.js';
import { publish, subscribe as eventSubscribe, EVENTS } from './event-bus.js';
import { PROCESSING_STATE, DEFAULT_SETTINGS, SILENCE_TIMEOUT_STORAGE_KEY } from '../constants.js';
import { detectSiteType } from '../site-handlers/site-detector.js';
import {
    createError,
    handleError,
    mapSpeechErrorToErrorCode,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './error-handler.js';

// Local variables
let recognitionInstance = null;

// Initialize state
setState({
  isListening: false,
  isEditing: false
});

// Event subscriptions will be set up when the function is called
// This prevents issues with subscription timing
function setupEventSubscriptions() {
    // Subscribe to mic button click event
    eventSubscribe(EVENTS.MIC_BUTTON_CLICKED, handleMicButtonClick);
    
    // Subscribe to edit button click event
    eventSubscribe(EVENTS.GPT_EDITING_STARTED, handleEditButtonClick);
    
    // Subscribe to language update events
    eventSubscribe(EVENTS.LANGUAGE_UPDATED, updateRecognitionLanguage);
}

// Export the setup function so it can be called after state initialization
export { setupEventSubscriptions as initSpeechEvents };

// Function definition moved above

/**
 * Mic button click handler
 */
function handleMicButtonClick() {
    // Save active element before mic button click
    const previousActiveElement = document.activeElement;
    const wasPreviousElementInput = isInputElement(previousActiveElement);

    // 音声認識モーダルを即座に表示（初期状態）
    publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: '', isInitial: true });

    // Get current input element from state
    let currentInputElement = null;
    
    if (wasPreviousElementInput) {
        currentInputElement = previousActiveElement;
        setState('currentInputElement', currentInputElement);
        console.log('[Debug handleMicButtonClick: Using previous input element:', currentInputElement);
    } else {
        currentInputElement = document.activeElement;
        
        if (!isInputElement(currentInputElement)) {
            const lastClickedInput = getState('lastClickedInput');
            const autoDetectInputFields = getState('autoDetectInputFields');
            
            if (lastClickedInput && isInputElement(lastClickedInput)) {
                currentInputElement = lastClickedInput;
            }
            else if (autoDetectInputFields) {
                // Request to find best input field via event bus
                publish(EVENTS.INPUT_FIELD_FOUND);
                // This will be handled by input-handler.js which will call findBestInputField
                // and update the state with the result
                currentInputElement = getState('currentInputElement');
            }
            else {
                currentInputElement = null;
            }

            if (currentInputElement) {
                currentInputElement.focus();
                setState('currentInputElement', currentInputElement);
                console.log('[Debug] handleMicButtonClick: Found input via lastClickedInput or findBestInputField:', currentInputElement);
                showStatus('statusInputFound');
            } else {
                // 入力フィールドが見つからない場合でも音声認識を開始
                // フラグを設定して、認識結果をモーダルダイアログに表示するようにする
                setState('useRecognitionModal', true);
                console.log('[Debug] handleMicButtonClick: No input field found, will use modal dialog');
                showStatus('statusUsingModalDialog');
                toggleSpeechRecognition();
                return;
            }
        }
    }

    toggleSpeechRecognition();
}

/**
 * Start/stop speech recognition
 */
export function toggleSpeechRecognition() {
    const isListening = getState('isListening');
    if (isListening) {
        stopSpeechRecognition();
    } else {
        startSpeechRecognition();
    }
}

/**
 * Start speech recognition
 */
export function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
         alert(chrome.i18n.getMessage('alertSpeechApiNotAvailable'));
         return;
    }
    // Stop existing instance before creating a new one
    if (recognitionInstance) {
        try {
            recognitionInstance.stop();
        } catch (e) {
            console.warn("Previous recognition stop error:", e);
        }
        recognitionInstance = null;
    }
    
    // 音声認識開始前に「準備中」のステータスを表示
    showStatus('statusPreparingRecognition', undefined, true);
    recognitionInstance = new SpeechRecognition();
    const recognition = recognitionInstance;

    recognition.lang = getState('recognitionLang');
    recognition.interimResults = true;
    recognition.continuous = false; // Recognize one sentence at a time
    recognition.maxAlternatives = 1;
    
    // 音声認識の開始時の無音時間を短くする（デフォルトは500ms）
    if ('speechSetting' in recognition) {
        try {
            recognition.speechSetting = {
                speechRecognitionTimeoutMs: 100, // 無音検出の時間を短く
                speechRecognitionMaxAlternatives: 1,
                speechRecognitionGrammars: []
            };
        } catch (e) {
            console.warn("Failed to set speechSetting:", e);
        }
    }
    
    // カスタム無音検出のための変数
    let lastResultTime = 0;
    let silenceTimer = null;
    
    // 設定から無音タイムアウト値を取得（デフォルトは3秒）
    const silenceTimeout = getState('silenceTimeout') || DEFAULT_SETTINGS.SILENCE_TIMEOUT;

    recognition.onstart = function() {
        setState('isListening', true);
        updateMicButtonState(true);

        // Initialize the interim text
        setState('interimText', '');

        // 音声認識開始時にビープ音を鳴らして認識開始を知らせる
        playBeepSound('start');

        // 音声認識開始のステータス表示
        showStatus('statusListening');
        
        // 音声認識の準備完了を示すフラグを設定
        setState('recognitionReady', true);
    };

    recognition.onresult = async function(event) { // Made async
        const results = event.results;
        const result = results[results.length - 1];
        const transcript = result[0].transcript;

        // 最後に認識したテキストを状態に保存
        setState('lastRecognizedText', transcript);
        
        // 音声入力があった時点で無音タイマーをリセット
        lastResultTime = Date.now();
        if (silenceTimer) {
            clearTimeout(silenceTimer);
        }
        
        // 新しい無音タイマーを設定
        silenceTimer = setTimeout(() => {
            console.log('[Speech] Silence detected for ' + silenceTimeout + 'ms, stopping recognition');
            if (recognitionInstance) {
                try {
                    recognitionInstance.stop();
                } catch (e) {
                    console.warn("Error stopping recognition after silence:", e);
                }
            }
        }, silenceTimeout);

        // モーダルウィンドウの表示状態を取得
        const showModalWindow = getState('showModalWindow');

        // モーダルウィンドウが表示されている場合は、モーダルウィンドウのテキストエリアにのみ入力
        if (showModalWindow) {
            // 中間結果をリアルタイムでモーダルに表示
            if (!result.isFinal) {
                // Use event bus to update modal
                publish(EVENTS.RECOGNITION_MODAL_UPDATED, transcript);
            } else {
                const cleaned = basicCleanup(transcript);
                
                try {
                    const autoCorrection = getState('autoCorrection');
                    const corrected = autoCorrection ?
                        await correctWithGPT(cleaned) :
                        cleaned;
                    
                    // 修正されたテキストも保存
                    setState('lastRecognizedText', corrected);
                    
                    // モーダルダイアログを更新
                    publish(EVENTS.RECOGNITION_MODAL_UPDATED, corrected);
                    addToHistory(corrected);
                    showStatus('statusCorrectionSuccess');
                } catch (error) {
                    console.error(chrome.i18n.getMessage('logCorrectionError'), error);
                    
                    // エラーの場合は未修正のテキストを表示
                    publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
                    addToHistory(cleaned);
                    showStatus('statusCorrectionError', error.message || 'Unknown error');
                }
            }
            return; // モーダルウィンドウが表示されている場合は、ここで処理を終了
        }

        // 中間結果をリアルタイムでモーダルに表示（モーダルウィンドウが表示されていない場合）
        if (!result.isFinal) {
            // Use event bus to update modal
            publish(EVENTS.RECOGNITION_MODAL_UPDATED, transcript);
        }

        // 入力フィールドが見つからない場合や、特定のサイトの場合はモーダルダイアログを使用
        const currentInputElement = getState('currentInputElement');
        const useRecognitionModal = getState('useRecognitionModal');
        
        if (!currentInputElement || useRecognitionModal) {
            if (result.isFinal) {
                const cleaned = basicCleanup(transcript);
                
                // 最終結果が出た時点で一旦クリーンアップしたテキストを表示
                publish(EVENTS.RECOGNITION_MODAL_UPDATED, cleaned);
                
                try {
                    const autoCorrection = getState('autoCorrection');
                    const corrected = autoCorrection ?
                        await correctWithGPT(cleaned) :
                        cleaned;
                    
                    // 修正されたテキストも保存
                    setState('lastRecognizedText', corrected);
                    
                    // モーダルダイアログを更新
                    publish(EVENTS.RECOGNITION_MODAL_UPDATED, corrected);
                    addToHistory(corrected);
                    showStatus('statusCorrectionSuccess');
                } catch (error) {
                    console.error(chrome.i18n.getMessage('logCorrectionError'), error);
                    
                    // エラーの場合は未修正のテキストを表示
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
                    const corrected = autoCorrection ?
                        await correctWithGPT(cleaned) :
                        cleaned;

                    // 修正されたテキストも保存
                    setState('lastRecognizedText', corrected);

                    // サイトハンドラがx.comの場合は、モーダルダイアログを表示する
                    const siteType = detectSiteType();
                    if (siteType === 'twitter') {
                        publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: corrected, isInitial: false });
                        addToHistory(corrected);
                        showStatus('statusCorrectionSuccess');
                        return;
                    }

                    // React compatibility: Try typing simulation first
                    const currentInputElement = getState('currentInputElement');
                    
                    publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
                        final: true,
                        text: corrected,
                        append: false
                    });

                    addToHistory(corrected);
                    showStatus('statusCorrectionSuccess');
                    
                    // 自動送信は input-handler 側で final: true を見て判断するため、ここでの再発行は不要
               } catch (error) {
                   console.error(chrome.i18n.getMessage('logCorrectionErrorOverwrite'), error);

                   // サイトハンドラがx.comの場合は、モーダルダイアログを表示する
                   const siteType = detectSiteType();
                   if (siteType === 'twitter') {
                       publish(EVENTS.RECOGNITION_MODAL_SHOWN, { text: cleaned, isInitial: false });
                       addToHistory(cleaned);
                       showStatus('statusCorrectionError', error.message || 'Unknown error');
                       return;
                   }

                   const currentInputElement = getState('currentInputElement');
                   
                   publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
                       final: true,
                       text: cleaned,
                       append: false
                   });

                    addToHistory(cleaned);
                    showStatus('statusCorrectionError', error.message || 'Unknown error');
                    
                    // 自動送信は input-handler 側で final: true を見て判断するため、ここでの再発行は不要
                }
            } else {
                // Overwrite with interim results
                const currentInputElement = getState('currentInputElement');
                
                publish(EVENTS.SPEECH_RECOGNITION_RESULT, {
                    final: false,
                    text: transcript,
                    append: false
                });
            }
    };


    recognition.onend = function() {
        const wasListening = getState('isListening');
        setState('isListening', false);
        updateMicButtonState(false);
        // showStatus('statusSpeechStop'); // Removed: Don't clear status on end

        // 音声認識終了時にビープ音を鳴らして終了を知らせる
        playBeepSound('end');

        // Reset the modal dialog flag
        setState('useRecognitionModal', false);
        
        // 音声認識の準備完了フラグをリセット
        setState('recognitionReady', false);
        
        // モーダルウィンドウの状態をリセット
        // 既存のモーダルウィンドウを閉じる
        const existingModal = document.querySelector('.otak-voice-recognition');
        if (existingModal) {
            // モーダルウィンドウを閉じる前に、テキストをコピーするかどうかを確認
            const textarea = existingModal.querySelector('textarea');
            if (textarea && textarea.value.trim() !== '') {
                // テキストが空でない場合は、コピーボタンをクリックしたことにする
                const copyButton = existingModal.querySelector('.otak-voice-recognition__copy-btn');
                if (copyButton) {
                    // コピーボタンのクリックイベントを発火
                    copyButton.click();
                }
            } else {
                // テキストが空の場合は、モーダルウィンドウを閉じる
                existingModal.remove();
            }
        }

        // 無音タイマーをクリア
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
        }

        // Always-on mode has been removed
    };

    recognition.onerror = function(event) {
        // Map speech recognition error to our error code
        const errorCode = mapSpeechErrorToErrorCode(event.error);
        
        // Create and handle the error
        const error = createError(errorCode, null, null, { originalError: event.error });
        handleError(error, true, false, 'speech');
        
        // Update state
        setState('isListening', false);
        updateMicButtonState(false);
        recognitionInstance = null;
        
        // 無音タイマーをクリア
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
        }
    };

    try {
        // 音声認識開始前のウォームアップ時間を設ける
        // これにより、ブラウザの音声認識エンジンが準備完了状態になる
        setTimeout(() => {
            try {
                recognition.start();
                console.log('[Speech] Recognition started after warmup');
            } catch (e) {
                // Create and handle the error
                const error = createError(
                    ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED,
                    null,
                    e,
                    null,
                    ERROR_SEVERITY.ERROR
                );
                handleError(error, true, false, 'speech');
                
                // Update state
                setState('isListening', false);
                updateMicButtonState(false);
                recognitionInstance = null;
            }
        }, 300); // 300msのウォームアップ時間
    } catch (e) {
        // Create and handle the error
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED,
            null,
            e,
            null,
            ERROR_SEVERITY.ERROR
        );
        handleError(error, true, false, 'speech');
        
        // Update state
        setState('isListening', false);
        updateMicButtonState(false);
        recognitionInstance = null;
    }
}

/**
 * Stop speech recognition (when explicitly stopping)
 */
export function stopSpeechRecognition() {
    const isListening = getState('isListening');
    if (recognitionInstance && isListening) {
        try {
            recognitionInstance.stop();
            // isListening/button state updated in onend
            showStatus('statusSpeechStop');
        } catch (e) {
            // Create and handle the error
            const error = createError(
                ERROR_CODE[ERROR_CATEGORY.SPEECH].STOP_FAILED,
                null,
                e,
                null,
                ERROR_SEVERITY.ERROR
            );
            handleError(error, true, false, 'speech');
            
            // Force reset state on error
            setState('isListening', false);
            updateMicButtonState(false);
            recognitionInstance = null;
        }
    } else {
         setState('isListening', false);
         updateMicButtonState(false);
    }
}

/**
 * Update mic button state
 * @param {boolean} active - Whether the button is active
 */
export function updateMicButtonState(active) {
    const micButton = document.querySelector('.otak-voice-menu__input-btn');
    if (!micButton) return;

    if (active) {
        micButton.classList.add('otak-voice-menu__input-btn--active');
    } else {
        micButton.classList.remove('otak-voice-menu__input-btn--active');
    }

    // Set tooltip (title attribute only)
    micButton.title = chrome.i18n.getMessage('micTooltip');

    // マイクボタンのラベルテキストを設定
    const label = micButton.querySelector('.otak-voice-menu__label');
    if (label) {
        label.textContent = chrome.i18n.getMessage('micTooltip');
    }
}

/**
 * Edit button click handler
 */
function handleEditButtonClick() {
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
            return;
        }
    }

    const currentText = targetElement.isContentEditable ?
        targetElement.textContent : targetElement.value;

    if (!currentText || currentText.trim() === '') {
        showStatus('statusEditEmpty');
        return;
    }

    const apiKey = getState('apiKey');
    if (!apiKey || apiKey.trim() === '') {
        showStatus('statusApiKeyMissing');
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
            null,
            null,
            null,
            ERROR_SEVERITY.ERROR
        );
        handleError(error, true, true, 'speech');
        setState('isEditing', false);
        return;
    }

    if (recognitionInstance) {
        try {
            recognitionInstance.stop();
        } catch (e) {
            console.warn("Previous recognition stop error:", e);
        }
    }

    const recognition = new SpeechRecognition();
    recognitionInstance = recognition;

    recognition.lang = getState('recognitionLang');
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    // Update status display
    const statusElem = document.querySelector('.otak-voice-status');
    if (statusElem) {
        statusElem.textContent = chrome.i18n.getMessage('statusEditListening');
        statusElem.style.display = 'block';
        statusElem.classList.add('otak-voice-status--processing'); // Highlight edit mode
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
        // Map speech recognition error to our error code
        const errorCode = mapSpeechErrorToErrorCode(event.error);
        
        // Create and handle the error
        const error = createError(errorCode, null, null, { originalError: event.error });
        handleError(error, true, false, 'speech');
        
        // Update state
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
        // Create and handle the error
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND,
            null,
            null,
            { elementType: 'input field' },
            ERROR_SEVERITY.ERROR
        );
        handleError(error, true, false, 'speech');
        
        // Update state
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

/**
 * Perform basic text cleanup
 * @param {string} text - Text to clean up
 * @returns {string} Cleaned up text
 */
function basicCleanup(text) {
    let cleaned = text.trim();
    // Fix punctuation
    cleaned = cleaned.replace(/([、。]){2,}/g, '$1');
    // Remove unnatural spaces
    cleaned = cleaned.replace(/\s+([、。])/g, '$1');
    return cleaned;
}

/**
 * Set value to textarea by directly manipulating DOM (React compatibility)
 * @param {Element} element - Element to set value to
 * @param {string} value - Value to set
 * @returns {boolean} true if successful
 */
function forceSetTextAreaValue(element, value) {
    if (!element) return false;

    try {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');

        // Bypass React control and set value directly
        Object.defineProperty(element, 'value', {
            configurable: true,
            writable: true,
            value: value
        });

        // Fire input events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        // Restore original property descriptor (optional)
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

/**
 * Update recognition language.
 * Called from settings.js and restarts recognition if language is changed during recognition.
 * @param {string} newLang - New language code (e.g., 'en-US', 'ja-JP')
 */
export function updateRecognitionLanguage(newLang) {
    console.log(`[Speech] Recognition language updated to: ${newLang}`);
    // Update the state with the new language
    setState('recognitionLang', newLang);

    // If language changes during recognition, restart to apply the new language
    const isListening = getState('isListening');
    if (isListening) {
        console.log('[Speech] Restarting recognition to apply new language...');
        stopSpeechRecognition();
        setTimeout(() => {
            const currentIsListening = getState('isListening');
            if (!currentIsListening) { // Restart only if stopping completed
                 startSpeechRecognition();
            }
        }, 100); // Wait briefly for stop to complete
    }
}

/**
 * Status display function - proxy to avoid circular dependencies
 * @param {string} messageKey - i18n key for the message to display
 * @param {string|undefined} substitutions - Replacement string in the message
 * @param {boolean} persistent - Whether to display persistently
 */
function showStatus(messageKey, substitutions, persistent = false) {
    publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
}

/**
 * 音声認識の開始/終了時にSiriライクなサウンドを鳴らす
 * @param {string} type - 'start' または 'end'
 */
function playBeepSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 開始時と終了時で異なる音を設定
        if (type === 'start') {
            // Siriライクな開始音
            playSiriStartSound(audioContext);
        } else {
            // Siriライクな終了音
            playSiriEndSound(audioContext);
        }
    } catch (e) {
        console.warn("Failed to play sound:", e);
    }
}

/**
 * Siriライクな開始音を鳴らす
 * @param {AudioContext} audioContext - オーディオコンテキスト
 */
function playSiriStartSound(audioContext) {
    // 2つのオシレーターを使用（Siriの特徴的な音を再現）
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    
    // ゲインノード
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    // フィルター（Siriの透明感ある音質を再現）
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 2.5;
    
    // 周波数設定（Siriの特徴的な上昇音）
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(900, audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(1800, audioContext.currentTime + 0.1);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(2400, audioContext.currentTime + 0.1);
    
    // ゲイン設定（Siriの短く明るい音を再現）
    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gain1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
    
    masterGain.gain.value = 0.7;
    
    // 接続
    osc1.connect(gain1);
    osc2.connect(gain2);
    
    gain1.connect(filter);
    gain2.connect(filter);
    
    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // 再生
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    
    osc1.stop(audioContext.currentTime + 0.2);
    osc2.stop(audioContext.currentTime + 0.2);
}

/**
 * Siriライクな終了音を鳴らす
 * @param {AudioContext} audioContext - オーディオコンテキスト
 */
function playSiriEndSound(audioContext) {
    // 2つのオシレーターを使用（Siriの特徴的な音を再現）
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    
    // ゲインノード
    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    // フィルター（Siriの透明感ある音質を再現）
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;
    
    // 周波数設定（Siriの特徴的な下降音）
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1800, audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(900, audioContext.currentTime + 0.15);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2400, audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.15);
    
    // ゲイン設定（Siriの短く柔らかい音を再現）
    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.02);
    gain1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
    
    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
    gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
    
    masterGain.gain.value = 0.7;
    
    // 接続
    osc1.connect(gain1);
    osc2.connect(gain2);
    
    gain1.connect(filter);
    gain2.connect(filter);
    
    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // 再生
    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);
    
    osc1.stop(audioContext.currentTime + 0.25);
    osc2.stop(audioContext.currentTime + 0.25);
}