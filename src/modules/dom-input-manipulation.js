/** DOM Input Manipulation Module - text input operations and DOM manipulation */
import { isInputElement } from './dom-input-detection.js';
import { isButtonDisabled } from './dom-button-detection.js';
import { createError, handleError, ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY } from './error-handler.js';
import { publish, EVENTS } from './event-bus.js';
import { UI_FEEDBACK } from '../constants.js';

/**
 * Safely dispatches events to an element
 * @param {Element} element - Element to dispatch events to
 * @param {string} eventType - Type of event to dispatch
 * @param {Object} options - Event options
 * @returns {boolean} True if event was dispatched successfully
 */
export function dispatchEvent(element, eventType, options = {}) {
  if (!element) return false;
  try {
    let event;
    switch (eventType) {
      case 'input':
        event = options.inputType
          ? new InputEvent('input', { inputType: options.inputType, data: options.data, bubbles: true, cancelable: true, ...options })
          : new Event('input', { bubbles: true, cancelable: true, ...options });
        break;
      case 'change':
        event = new Event('change', { bubbles: true, cancelable: true, ...options });
        break;
      case 'keydown': case 'keyup': case 'keypress':
        event = new KeyboardEvent(eventType, { key: options.key || '', code: options.code || '', bubbles: true, cancelable: true, ...options });
        break;
      case 'focus': case 'blur':
        event = new FocusEvent(eventType, { bubbles: true, ...options });
        break;
      default:
        event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    }
    return element.dispatchEvent(event);
  } catch (error) {
    console.error(`Error dispatching ${eventType} event:`, error);
    const appError = createError(ERROR_CODE[ERROR_CATEGORY.DOM].EVENT_DISPATCH_FAILED, `Failed to dispatch ${eventType} event`, error, { element, eventType, options }, ERROR_SEVERITY.WARNING);
    handleError(appError, false, false, 'dom-utils');
    return false;
  }
}
/** Sets the value of an input element and dispatches appropriate events
 * @param {Element} element - Input element
 * @param {string} text - Text to set
 * @returns {boolean} True if successful
 */
export function setInputValue(element, text) {
  if (!element || !isInputElement(element)) return false;
  try {
    element.focus();
    if (element.isContentEditable) { element.textContent = text; } else { element.value = text; }
    dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
    dispatchEvent(element, 'change');
    if (text.length > 0) {
      const lastChar = text[text.length - 1];
      dispatchEvent(element, 'keydown', { key: lastChar });
      dispatchEvent(element, 'keyup', { key: lastChar });
    }
    return true;
  } catch (error) {
    console.error('Error setting input value:', error);
    const appError = createError(ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED, 'Failed to set input value', error, { element, text }, ERROR_SEVERITY.WARNING);
    handleError(appError, false, false, 'dom-utils');
    return false;
  }
}
/**
 * Handles Twitter/X.com specific DOM structure for input
 * @param {Element} element - Twitter input element
 * @param {string} text - Text to set
 * @returns {boolean} True if successful
 */
export function handleTwitterInput(element, text) {
  if (!element || !element.isContentEditable) return false;
  try {
    const isTwitterInput = element.closest('[data-testid^="tweetTextarea"], [aria-label*="\u30C4\u30A4\u30FC\u30C8"], [aria-label*="Tweet"], [aria-label*="\u8FD4\u4FE1"], [aria-label*="Reply"], [aria-label*="Post"], [aria-label*="\u6295\u7A3F"]');
    if (!isTwitterInput) return false;
    element.focus();
    const blockKey = `otakvoice-block-${Date.now()}`;
    const offsetKey = `${blockKey}-0-0`;
    let dataContentsDiv = element.querySelector('div[data-contents="true"]');
    if (!dataContentsDiv) {
      element.innerHTML = '';
      dataContentsDiv = document.createElement('div');
      dataContentsDiv.setAttribute('data-contents', 'true');
      element.appendChild(dataContentsDiv);
    }
    let dataBlockDiv = dataContentsDiv.querySelector('div[data-block="true"]');
    if (!dataBlockDiv) {
      dataBlockDiv = document.createElement('div');
      dataBlockDiv.setAttribute('data-block', 'true');
      dataBlockDiv.style.position = 'relative';
      dataContentsDiv.appendChild(dataBlockDiv);
    }
    let innerDiv = dataBlockDiv.querySelector('div[data-offset-key]');
    if (!innerDiv) {
      innerDiv = document.createElement('div');
      innerDiv.setAttribute('data-offset-key', offsetKey);
      innerDiv.style.position = 'relative';
      dataBlockDiv.appendChild(innerDiv);
    }
    let offsetSpan = innerDiv.querySelector(`span[data-offset-key="${offsetKey}"]`);
    if (!offsetSpan) {
      offsetSpan = document.createElement('span');
      offsetSpan.setAttribute('data-offset-key', offsetKey);
      innerDiv.appendChild(offsetSpan);
    }
    let textSpan = element.querySelector('span[data-text="true"]');
    if (!textSpan) {
      textSpan = document.createElement('span');
      textSpan.setAttribute('data-text', 'true');
      offsetSpan.appendChild(textSpan);
    }
    textSpan.textContent = text;
    dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
    dispatchEvent(element, 'change');
    if (text.length > 0) {
      const lastChar = text[text.length - 1];
      dispatchEvent(element, 'keydown', { key: lastChar });
      dispatchEvent(element, 'keyup', { key: lastChar });
    }
    dispatchEvent(element, 'blur');
    dispatchEvent(element, 'focus');
    return true;
  } catch (error) {
    console.error('Error handling Twitter input:', error);
    const appError = createError(ERROR_CODE[ERROR_CATEGORY.DOM].TWITTER_INPUT_FAILED, 'Failed to handle Twitter input', error, { element, text }, ERROR_SEVERITY.WARNING);
    handleError(appError, false, false, 'dom-utils');
    return false;
  }
}
/**
 * Writes text to an input field with appropriate DOM handling
 * @param {Element} element - Input element
 * @param {string} text - Text to write
 * @returns {boolean} True if successful
 */
export function writeToInputField(element, text) {
  if (!element || !isInputElement(element)) {
    publish(EVENTS.ERROR_OCCURRED, { source: 'dom-utils', message: 'Invalid input element for writing text', error: new Error('Invalid input element') });
    return false;
  }
  try {
    if (element.isContentEditable) {
      const twitterResult = handleTwitterInput(element, text);
      if (twitterResult) return true;
    }
    if (element.isContentEditable) {
      element.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      const success = document.execCommand('insertText', false, text);
      if (success) {
        dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
        dispatchEvent(element, 'change');
        return true;
      }
    }
    return setInputValue(element, text);
  } catch (error) {
    console.error('Error writing to input field:', error);
    const appError = createError(ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED, 'Failed to write to input field', error, { element, text }, ERROR_SEVERITY.WARNING);
    handleError(appError, false, false, 'dom-utils');
    try {
      if (element.isContentEditable) { element.textContent = text; } else { element.value = text; }
      dispatchEvent(element, 'input');
      dispatchEvent(element, 'change');
      return true;
    } catch (fallbackError) {
      console.error('Fallback error writing to input field:', fallbackError);
      return false;
    }
  }
}
/**
 * Appends text to an input field with appropriate DOM handling
 * @param {Element} element - Input element
 * @param {string} text - Text to append
 * @param {string} originalText - Original text to append to
 * @param {boolean} isFinal - Whether this is a final result
 * @returns {boolean} True if successful
 */
export function appendToInputField(element, text, completeText = '', isFinal = true) {
  if (!element || !isInputElement(element)) {
    publish(EVENTS.ERROR_OCCURRED, { source: 'dom-utils', message: 'Invalid input element for appending text', error: new Error('Invalid input element') });
    return false;
  }
  try {
    const currentValue = element.isContentEditable ? element.textContent : element.value;
    const newText = completeText !== '' ? completeText : currentValue + text;
    if (element.isContentEditable) {
      const twitterResult = handleTwitterInput(element, newText);
      if (twitterResult) return true;
    }
    if (element.isContentEditable) {
      element.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      const success = document.execCommand('insertText', false, newText);
      if (success) {
        dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
        if (isFinal) { dispatchEvent(element, 'change'); }
        return true;
      }
    }
    if (element.isContentEditable) { element.textContent = newText; } else { element.value = newText; }
    dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
    if (isFinal) { dispatchEvent(element, 'change'); }
    if (text.length > 0) {
      const lastChar = text[text.length - 1];
      dispatchEvent(element, 'keydown', { key: lastChar });
      dispatchEvent(element, 'keyup', { key: lastChar });
    }
    return true;
  } catch (error) {
    console.error('Error appending to input field:', error);
    const appError = createError(ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED, 'Failed to append to input field', error, { element, text, completeText, isFinal }, ERROR_SEVERITY.WARNING);
    handleError(appError, false, false, 'dom-utils');
    return false;
  }
}
/** Timer ID for clickButtonWithFeedback to prevent multiple pending clicks */
let feedbackTimerId = null;

/** Clicks a button with visual feedback
 * @param {Element} button - Button to click
 * @param {number} [delayMs] - Delay before clicking (defaults to UI_FEEDBACK.CLICK_FEEDBACK_DELAY_MS)
 * @returns {boolean} True if successful
 */
export function clickButtonWithFeedback(button, delayMs = UI_FEEDBACK.CLICK_FEEDBACK_DELAY_MS) {
  if (!button || isButtonDisabled(button)) return false;
  // Prevent multiple pending clicks from rapid calls
  if (feedbackTimerId) return false;
  try {
    const originalBackgroundColor = button.style.backgroundColor;
    const originalBorder = button.style.border;
    button.style.backgroundColor = UI_FEEDBACK.BUTTON_HIGHLIGHT_COLOR;
    button.style.border = UI_FEEDBACK.BUTTON_HIGHLIGHT_BORDER;
    feedbackTimerId = setTimeout(() => {
      feedbackTimerId = null;
      if (!button.isConnected) return;
      button.style.backgroundColor = originalBackgroundColor;
      button.style.border = originalBorder;
      button.click();
      publish(EVENTS.STATUS_UPDATED, { messageKey: 'statusSubmitClicked', persistent: false });
    }, delayMs);
    return true;
  } catch (error) {
    feedbackTimerId = null;
    console.error('Error clicking button with feedback:', error);
    const appError = createError(ERROR_CODE[ERROR_CATEGORY.DOM].BUTTON_CLICK_FAILED, 'Failed to click button with feedback', error, { button }, ERROR_SEVERITY.WARNING);
    handleError(appError, false, false, 'dom-utils');
    return false;
  }
}
/**
 * Clears the content of an input element
 * @param {Element} element - Input element to clear
 * @returns {boolean} True if successful
 */
export function clearInputField(element) {
  if (!element || !isInputElement(element)) return false;
  try {
    element.focus();
    if (element.isContentEditable) { element.textContent = ''; } else { element.value = ''; }
    dispatchEvent(element, 'input');
    dispatchEvent(element, 'change');
    return true;
  } catch (error) {
    console.error('Error clearing input field:', error);
    const appError = createError(ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED, 'Failed to clear input field', error, { element }, ERROR_SEVERITY.WARNING);
    handleError(appError, false, false, 'dom-utils');
    return false;
  }
}
/**
 * Finds an element by selector with error handling
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search within
 * @returns {Element|null} Found element or null
 */
export function findElement(selector, parent = document) {
  try {
    return parent.querySelector(selector);
  } catch (error) {
    console.error(`Error finding element with selector "${selector}":`, error);
    return null;
  }
}
/**
 * Finds all elements matching a selector with error handling
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to search within
 * @returns {Element[]} Array of found elements
 */
export function findAllElements(selector, parent = document) {
  try {
    return Array.from(parent.querySelectorAll(selector));
  } catch (error) {
    console.error(`Error finding elements with selector "${selector}":`, error);
    return [];
  }
}
