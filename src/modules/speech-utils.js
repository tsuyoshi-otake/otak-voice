/**
 * Speech Utilities Module
 * Provides utility functions and audio effects for speech recognition
 */

import { setState, getState } from './state.js';
import { publish, EVENTS } from './event-bus.js';

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

    // Set mic button label text
    const label = micButton.querySelector('.otak-voice-menu__label');
    if (label) {
        label.textContent = chrome.i18n.getMessage('micTooltip');
    }
}

/**
 * Perform basic text cleanup
 * @param {string} text - Text to clean up
 * @returns {string} Cleaned up text
 */
export function basicCleanup(text) {
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
export function forceSetTextAreaValue(element, value) {
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
 * Status display function - proxy to avoid circular dependencies
 * @param {string} messageKey - i18n key for the message to display
 * @param {string|undefined} substitutions - Replacement string in the message
 * @param {boolean} persistent - Whether to display persistently
 */
export function showStatus(messageKey, substitutions, persistent = false) {
    publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
}

/**
 * Play beep sound for speech recognition start/end (Siri-like)
 * @param {string} type - 'start' or 'end'
 */
export function playBeepSound(type) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        if (type === 'start') {
            playSiriStartSound(audioContext);
        } else {
            playSiriEndSound(audioContext);
        }
    } catch (e) {
        console.warn("Failed to play sound:", e);
    }
}

/**
 * Play Siri-like start sound
 * @param {AudioContext} audioContext - Audio context
 */
export function playSiriStartSound(audioContext) {
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();

    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const masterGain = audioContext.createGain();

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 2.5;

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(900, audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(1800, audioContext.currentTime + 0.1);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(2400, audioContext.currentTime + 0.1);

    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gain1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    masterGain.gain.value = 0.7;

    osc1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(filter);
    gain2.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);

    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);

    osc1.stop(audioContext.currentTime + 0.2);
    osc2.stop(audioContext.currentTime + 0.2);
}

/**
 * Play Siri-like end sound
 * @param {AudioContext} audioContext - Audio context
 */
export function playSiriEndSound(audioContext) {
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();

    const gain1 = audioContext.createGain();
    const gain2 = audioContext.createGain();
    const masterGain = audioContext.createGain();

    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 2;

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1800, audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(900, audioContext.currentTime + 0.15);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2400, audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(1200, audioContext.currentTime + 0.15);

    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.02);
    gain1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);

    gain2.gain.setValueAtTime(0, audioContext.currentTime);
    gain2.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02);
    gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);

    masterGain.gain.value = 0.7;

    osc1.connect(gain1);
    osc2.connect(gain2);

    gain1.connect(filter);
    gain2.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);

    osc1.start(audioContext.currentTime);
    osc2.start(audioContext.currentTime);

    osc1.stop(audioContext.currentTime + 0.25);
    osc2.stop(audioContext.currentTime + 0.25);
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
        // Import dynamically to avoid circular dependency
        import('./speech-recognition.js').then(({ stopSpeechRecognition, startSpeechRecognition }) => {
            stopSpeechRecognition();
            setTimeout(() => {
                const currentIsListening = getState('isListening');
                if (!currentIsListening) { // Restart only if stopping completed
                    startSpeechRecognition();
                }
            }, 100); // Wait briefly for stop to complete
        });
    }
}
