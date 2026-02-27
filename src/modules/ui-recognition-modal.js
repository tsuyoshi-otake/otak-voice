/**
 * UI Recognition Modal Module
 * Responsible for creating and managing the voice recognition text modal
 */

import { THEME_MODES } from '../constants.js';
import { getState, setState } from './state.js';
import { makeDraggable } from './ui-settings-modal.js';

/** AbortController for the recognition modal ESC key listener */
let escAbortController = null;

/** Timer ID for copy button feedback (prevents overlapping timers) */
let copyFeedbackTimerId = null;

/**
 * Creates and displays a modal dialog for showing voice recognition text
 * @param {string} text - Text to display
 * @param {boolean} isInitial - Whether this is the initial display
 */
export function showRecognitionTextModal(text = '', isInitial = false) {
  // Set flag indicating the start of a new recognition session
  if (isInitial) {
    setState('newRecognitionSession', true);
    setState('lastAppendedText', '');
  }

  // Do nothing if modal display flag is off
  if (!getState('showModalWindow')) {
    return;
  }

  // Get current theme
  const currentTheme = getState('themeMode') || THEME_MODES.DARK;

  // Check if a modal already exists
  let modal = document.querySelector('.otak-voice-recognition');

  // Create a new modal if one doesn't exist
  if (!modal) {
    // Modal container
    modal = document.createElement('div');
    modal.className = 'otak-voice-recognition';

    // Set theme attribute on document root element
    document.documentElement.setAttribute('data-otak-theme', currentTheme);

    // Header, body structure
    modal.innerHTML = `
      <h3>${chrome.i18n.getMessage('recognitionModalTitle')}</h3>
      <textarea placeholder="${isInitial ? chrome.i18n.getMessage('recognitionModalPlaceholder') : ''}"></textarea>
      <div class="otak-voice-recognition__button-container">
        <button class="otak-voice-recognition__copy-btn">${chrome.i18n.getMessage('recognitionModalCopyButton')}</button>
        <button class="otak-voice-recognition__close-btn">${chrome.i18n.getMessage('recognitionModalCloseButton')}</button>
      </div>
    `;

    // Safely set textarea value to prevent XSS
    const textarea = modal.querySelector('textarea');
    if (textarea) {
        textarea.value = text;
    }

    // Add event listeners to buttons
    const copyButton = modal.querySelector('.otak-voice-recognition__copy-btn');
    copyButton.onclick = () => {
      const textarea = modal.querySelector('textarea');
      const textToCopy = textarea.value;
      navigator.clipboard.writeText(textToCopy).catch(() => {
        textarea.select();
        document.execCommand('copy');
      });

      // Save original button text
      const originalText = copyButton.textContent;

      // Change button text to "Copied"
      copyButton.textContent = chrome.i18n.getMessage('recognitionModalCopied');

      // Clear previous copy feedback timer
      if (copyFeedbackTimerId) { clearTimeout(copyFeedbackTimerId); copyFeedbackTimerId = null; }

      // Check if autoSubmit is enabled
      const autoSubmit = getState('autoSubmit');

      // Only close the modal if autoSubmit is enabled
      if (autoSubmit) {
        copyFeedbackTimerId = setTimeout(() => {
          copyFeedbackTimerId = null;
          if (modal.isConnected) modal.remove();
        }, 1000);
      } else {
        // If not auto-closing, revert button text after 2 seconds
        copyFeedbackTimerId = setTimeout(() => {
          copyFeedbackTimerId = null;
          if (modal.isConnected && modal.querySelector('.otak-voice-recognition__copy-btn')) {
            copyButton.textContent = originalText;
          }
        }, 2000);
      }
    };

    const closeButton = modal.querySelector('.otak-voice-recognition__close-btn');
    closeButton.onclick = () => {
      modal.remove();
    };

    // Allow closing with ESC key (clean up previous listener first)
    if (escAbortController) escAbortController.abort();
    escAbortController = new AbortController();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.querySelector('.otak-voice-recognition')) {
        modal.remove();
        if (escAbortController) { escAbortController.abort(); escAbortController = null; }
      }
    }, { signal: escAbortController.signal });

    // Add to body
    document.body.appendChild(modal);

    // Add drag functionality
    makeDraggable(modal);
  } else {
    // Update text if modal already exists
    const textarea = modal.querySelector('textarea');
    if (textarea) {
      textarea.value = text;
    }
  }

  // Select the textarea (only if not initial display)
  if (!isInitial && text.trim() !== '') {
    const textarea = modal.querySelector('textarea');
    if (textarea) {
      textarea.select();
    }
  }

  return modal;
}

/**
 * Updates the text in the voice recognition modal
 * @param {string} text - Text to display
 */
export function updateRecognitionModal(text) {
  // Do nothing if modal display flag is off
  if (!getState('showModalWindow')) {
    return;
  }

  const modal = document.querySelector('.otak-voice-recognition');
  if (modal) {
    const textarea = modal.querySelector('textarea');
    if (textarea) {
      // Simply replace the text
      textarea.value = text;
    }
  }
}
