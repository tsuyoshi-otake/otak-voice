/**
 * DOM Utilities Module
 * Provides abstracted DOM operations to reduce complexity and improve maintainability
 */

import { createError, handleError, ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY } from './error-handler.js';
import { publish, EVENTS } from './event-bus.js';

/**
 * Checks if an element is visible in the viewport
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is visible
 */
export function isElementVisible(element) {
  if (!element) return false;
  
  try {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0 &&
           element.offsetParent !== null;
  } catch (error) {
    console.error('Error checking element visibility:', error);
    return false;
  }
}

/**
 * Checks if an element is in the viewport
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is in viewport
 */
export function isElementInViewport(element) {
  if (!element) return false;
  
  try {
    const rect = element.getBoundingClientRect();
    
    return rect.top >= 0 &&
           rect.left >= 0 &&
           rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
           rect.right <= (window.innerWidth || document.documentElement.clientWidth);
  } catch (error) {
    console.error('Error checking if element is in viewport:', error);
    return false;
  }
}

/**
 * Checks if an element is an input element that can receive text
 * @param {Element} element - Element to check
 * @returns {boolean} True if element is an input element
 */
export function isInputElement(element) {
  if (!element) return false;
  
  try {
    // Check if element is contentEditable
    if (element.isContentEditable) {
      return isElementVisible(element);
    }
    
    // Check if element is an input or textarea
    const validTagNames = ['INPUT', 'TEXTAREA'];
    if (validTagNames.includes(element.tagName)) {
      // For input elements, check if they're of a type that accepts text
      if (element.tagName === 'INPUT') {
        const validInputTypes = ['text', 'search', 'email', 'password', 'url', 'tel', 'number', null, ''];
        if (!validInputTypes.includes(element.type)) {
          return false;
        }
      }
      
      // Check if the element is visible and not disabled or readonly
      return isElementVisible(element) && !element.disabled && !element.readOnly;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking if element is an input element:', error);
    return false;
  }
}
/**
 * Finds all input elements on the page
 * @returns {Element[]} Array of input elements
 */
export function findAllInputElements() {
  try {
    const elements = Array.from(document.querySelectorAll(
      'input[type="text"], input[type="search"], input[type="email"], ' +
      'input[type="password"], input[type="url"], input[type="tel"], ' +
      'textarea, [contenteditable="true"]'
    ));
    
    return elements.filter(isInputElement);
  } catch (error) {
    console.error('Error finding input elements:', error);
    return [];
  }
}

/**
 * Checks if a button is in a disabled state
 * @param {Element} button - Button element to check
 * @returns {boolean} true if disabled
 */
export function isButtonDisabled(button) {
  if (!button) return true;
  
  try {
    return button.disabled ||
           button.getAttribute('aria-disabled') === 'true' ||
           button.classList.contains('disabled') ||
           button.classList.contains('cursor-not-allowed') ||
           button.classList.contains('opacity-50') ||
           getComputedStyle(button).opacity < '0.9';
  } catch (error) {
    console.error('Error checking if button is disabled:', error);
    return true; // Assume disabled on error
  }
}

/**
 * Finds all buttons on the page
 * @returns {Element[]} Array of button elements
 */
export function findAllButtons() {
  try {
    return Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
      .filter(isElementVisible);
  } catch (error) {
    console.error('Error finding buttons:', error);
    return [];
  }
}

/**
 * Finds buttons related to an input element
 * @param {Element} inputElement - Input element
 * @returns {Element[]} Array of related button elements
 */
export function findButtonsForInput(inputElement) {
  if (!inputElement) return [];
  
  try {
    const candidates = [];
    
    // Method 1: Look for submit buttons in the same form
    if (inputElement.form) {
      const formButtons = Array.from(inputElement.form.querySelectorAll('button, input[type="submit"], input[type="button"]'));
      candidates.push(...formButtons);
    }
    
    // Method 2: If no form, look for nearby buttons
    if (!inputElement.form) {
      // Go up to 10 levels of parent elements from the input field
      let parent = inputElement.parentElement;
      let depth = 0;
      
      while (parent && depth < 10) {
        // Get buttons within this parent element
        const buttons = Array.from(parent.querySelectorAll('button, input[type="submit"], input[type="button"]'));
        candidates.push(...buttons);
        
        // Move to next parent
        parent = parent.parentElement;
        depth++;
      }
    }
    
    // Remove duplicates and filter to only visible buttons
    return [...new Set(candidates)].filter(isElementVisible);
  } catch (error) {
    console.error('Error finding buttons for input:', error);
    return [];
  }
}
/**
 * Scores a button based on how likely it is to be a submit button
 * @param {Element} button - Button element to score
 * @param {Element} inputElement - Related input element
 * @returns {number} Score (higher is more likely to be a submit button)
 */
export function scoreSubmitButton(button, inputElement) {
  if (!button || !inputElement) return 0;
  
  try {
    let score = 0;
    const text = (button.textContent || '').toLowerCase();
    const value = (button.value || '').toLowerCase();
    const id = (button.id || '').toLowerCase();
    const className = (button.className || '').toLowerCase();
    const type = (button.type || '').toLowerCase();
    
    // Scoring based on text content
    const submitKeywords = ['送信', '投稿', 'submit', 'post', 'send', '確定', '実行', 'ok', '了解'];
    for (const keyword of submitKeywords) {
      if (text.includes(keyword)) score += 5;
      if (value.includes(keyword)) score += 4;
      if (id.includes(keyword)) score += 3;
      if (className.includes(keyword)) score += 2;
    }
    
    // Scoring based on attributes
    if (type === 'submit') score += 10;
    if (button.getAttribute('role') === 'button') score += 2;
    
    // High score if it's the only button in the form
    if (inputElement.form && inputElement.form.querySelectorAll('button, input[type="submit"]').length === 1) {
      score += 8;
    }
    
    // Scoring based on icons (like FontAwesome)
    const hasSubmitIcon = button.querySelector('i.fa-paper-plane, i.fa-send, svg[data-icon="paper-plane"]');
    if (hasSubmitIcon) score += 5;
    
    // Scoring based on position relationship
    const inputRect = inputElement.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    
    // Increase score for buttons on the right or below
    if (Math.abs(buttonRect.left - inputRect.right) < 100 && Math.abs(buttonRect.top - inputRect.top) < 50) {
      score += 3;
    }
    if (buttonRect.top > inputRect.bottom && Math.abs(buttonRect.left - inputRect.left) < 100) {
      score += 3;
    }
    
    // Detect layout patterns similar to chat UIs
    if (buttonRect.top > inputRect.top &&
        buttonRect.left > inputRect.left &&
        buttonRect.left < inputRect.right + 100) {
      score += 4;
    }
    
    // Also check image-only buttons
    const hasImage = button.querySelector('img');
    if (hasImage) {
      const imgSrc = hasImage.src.toLowerCase();
      if (imgSrc.includes('send') || imgSrc.includes('submit') || imgSrc.includes('arrow')) {
        score += 3;
      }
    }
    
    // SVG icons
    const hasSVG = button.querySelector('svg');
    if (hasSVG) {
      score += 2; // SVG icons are commonly used in chat UIs
    }
    
    // Reduce score if button appears to be disabled
    if (isButtonDisabled(button)) {
      score -= 20;
    }
    
    return score;
  } catch (error) {
    console.error('Error scoring submit button:', error);
    return 0;
  }
}

/**
 * Finds the best submit button for an input element
 * @param {Element} inputElement - Input element
 * @returns {Element|null} Best submit button or null
 */
export function findBestSubmitButton(inputElement) {
  if (!inputElement) return null;
  
  try {
    // Get all buttons related to the input
    const buttons = findButtonsForInput(inputElement);
    
    // Add all buttons on the page as fallback
    const allButtons = findAllButtons();
    const allCandidates = [...new Set([...buttons, ...allButtons])];
    
    // Score each button
    const scoredButtons = allCandidates.map(button => ({
      button,
      score: scoreSubmitButton(button, inputElement)
    }));
    
    // Sort by score
    scoredButtons.sort((a, b) => b.score - a.score);
    
    // Return the highest scoring button (if it's not disabled)
    if (scoredButtons.length > 0) {
      const bestButton = scoredButtons[0].button;
      // If the highest scoring button is clearly disabled, try the next button
      if (isButtonDisabled(bestButton)) {
        return scoredButtons.length > 1 ? scoredButtons[1].button : null;
      }
      return bestButton;
    }
    
    return null;
  } catch (error) {
    console.error('Error finding best submit button:', error);
    return null;
  }
}
/**
 * Scores an input element based on how likely it is to be the main input field
 * @param {Element} element - Input element to score
 * @returns {number} Score (higher is more likely to be the main input field)
 */
export function scoreInputField(element) {
  if (!element) return 0;
  
  try {
    let score = 0;
    
    // Check if element is visible and in viewport
    if (!isElementVisible(element)) return 0;
    if (isElementInViewport(element)) score += 5;
    
    // Check element attributes
    const attributes = ['id', 'name', 'className', 'placeholder', 'aria-label', 'title'];
    const chatKeywords = ['chat', 'message', '入力', '送信', 'input', 'text', 'comment'];
    const searchKeywords = ['search', '検索'];
    
    // Check for chat-related keywords
    for (const attr of attributes) {
      const value = element[attr] || element.getAttribute(attr);
      if (!value) continue;
      
      const lowerValue = value.toString().toLowerCase();
      
      // Chat-related keywords get higher score
      for (const keyword of chatKeywords) {
        if (lowerValue.includes(keyword)) {
          score += 3;
          break;
        }
      }
      
      // Search-related keywords get medium score
      for (const keyword of searchKeywords) {
        if (lowerValue.includes(keyword)) {
          score += 2;
          break;
        }
      }
    }
    
    // Textarea elements are often used for chat/comment inputs
    if (element.tagName === 'TEXTAREA') score += 2;
    
    // Size matters - larger input fields are often the main input
    const rect = element.getBoundingClientRect();
    const area = rect.width * rect.height;
    
    // Normalize area score (0-5 points based on size)
    const areaScore = Math.min(5, Math.floor(area / 5000));
    score += areaScore;
    
    // Contenteditable elements get slightly lower priority
    if (element.isContentEditable) score -= 1;
    
    return score;
  } catch (error) {
    console.error('Error scoring input field:', error);
    return 0;
  }
}

/**
 * Finds the best input field on the page
 * @returns {Element|null} Best input field or null
 */
export function findBestInputField() {
  try {
    // Get all input elements
    const inputElements = findAllInputElements();
    if (inputElements.length === 0) return null;
    
    // Score each input element
    const scoredInputs = inputElements.map(element => ({
      element,
      score: scoreInputField(element)
    }));
    
    // Sort by score
    scoredInputs.sort((a, b) => b.score - a.score);
    
    // Return the highest scoring input
    return scoredInputs.length > 0 ? scoredInputs[0].element : null;
  } catch (error) {
    console.error('Error finding best input field:', error);
    return null;
  }
}

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
        if (options.inputType) {
          event = new InputEvent('input', {
            inputType: options.inputType,
            data: options.data,
            bubbles: true,
            cancelable: true,
            ...options
          });
        } else {
          event = new Event('input', { bubbles: true, cancelable: true, ...options });
        }
        break;
        
      case 'change':
        event = new Event('change', { bubbles: true, cancelable: true, ...options });
        break;
        
      case 'keydown':
      case 'keyup':
      case 'keypress':
        event = new KeyboardEvent(eventType, {
          key: options.key || '',
          code: options.code || '',
          bubbles: true,
          cancelable: true,
          ...options
        });
        break;
        
      case 'focus':
      case 'blur':
        event = new FocusEvent(eventType, { bubbles: true, ...options });
        break;
        
      default:
        event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    }
    
    return element.dispatchEvent(event);
  } catch (error) {
    console.error(`Error dispatching ${eventType} event:`, error);
    
    // Create and handle error
    const appError = createError(
      ERROR_CODE[ERROR_CATEGORY.DOM].EVENT_DISPATCH_FAILED,
      `Failed to dispatch ${eventType} event`,
      error,
      { element, eventType, options },
      ERROR_SEVERITY.WARNING
    );
    handleError(appError, false, false, 'dom-utils');
    
    return false;
  }
}
/**
 * Sets the value of an input element and dispatches appropriate events
 * @param {Element} element - Input element
 * @param {string} text - Text to set
 * @returns {boolean} True if successful
 */
export function setInputValue(element, text) {
  if (!element || !isInputElement(element)) return false;
  
  try {
    // Focus the element
    element.focus();
    
    // Set the value based on element type
    if (element.isContentEditable) {
      element.textContent = text;
    } else {
      element.value = text;
    }
    
    // Dispatch events
    dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
    dispatchEvent(element, 'change');
    
    // Dispatch key events for the last character
    if (text.length > 0) {
      const lastChar = text[text.length - 1];
      dispatchEvent(element, 'keydown', { key: lastChar });
      dispatchEvent(element, 'keyup', { key: lastChar });
    }
    
    return true;
  } catch (error) {
    console.error('Error setting input value:', error);
    
    // Create and handle error
    const appError = createError(
      ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
      'Failed to set input value',
      error,
      { element, text },
      ERROR_SEVERITY.WARNING
    );
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
    // Check if this is a Twitter input
    const isTwitterInput = element.closest('[data-testid^="tweetTextarea"], [aria-label*="ツイート"], [aria-label*="Tweet"], [aria-label*="返信"], [aria-label*="Reply"], [aria-label*="Post"], [aria-label*="投稿"]');
    if (!isTwitterInput) return false;
    
    // Focus the element
    element.focus();
    
    // Create a unique block key
    const blockKey = `otakvoice-block-${Date.now()}`;
    const offsetKey = `${blockKey}-0-0`;
    
    // Find or create the data-contents div
    let dataContentsDiv = element.querySelector('div[data-contents="true"]');
    if (!dataContentsDiv) {
      element.innerHTML = '';
      dataContentsDiv = document.createElement('div');
      dataContentsDiv.setAttribute('data-contents', 'true');
      element.appendChild(dataContentsDiv);
    }
    
    // Find or create the data-block div
    let dataBlockDiv = dataContentsDiv.querySelector('div[data-block="true"]');
    if (!dataBlockDiv) {
      dataBlockDiv = document.createElement('div');
      dataBlockDiv.setAttribute('data-block', 'true');
      dataBlockDiv.style.position = 'relative';
      dataContentsDiv.appendChild(dataBlockDiv);
    }
    
    // Find or create the inner div with data-offset-key
    let innerDiv = dataBlockDiv.querySelector('div[data-offset-key]');
    if (!innerDiv) {
      innerDiv = document.createElement('div');
      innerDiv.setAttribute('data-offset-key', offsetKey);
      innerDiv.style.position = 'relative';
      dataBlockDiv.appendChild(innerDiv);
    }
    
    // Find or create the span with data-offset-key
    let offsetSpan = innerDiv.querySelector(`span[data-offset-key="${offsetKey}"]`);
    if (!offsetSpan) {
      offsetSpan = document.createElement('span');
      offsetSpan.setAttribute('data-offset-key', offsetKey);
      innerDiv.appendChild(offsetSpan);
    }
    
    // Find or create the span with data-text="true"
    let textSpan = element.querySelector('span[data-text="true"]');
    if (!textSpan) {
      textSpan = document.createElement('span');
      textSpan.setAttribute('data-text', 'true');
      offsetSpan.appendChild(textSpan);
    }
    
    // Set the text content
    textSpan.textContent = text;
    
    // Dispatch events
    dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
    dispatchEvent(element, 'change');
    
    // Dispatch key events for the last character
    if (text.length > 0) {
      const lastChar = text[text.length - 1];
      dispatchEvent(element, 'keydown', { key: lastChar });
      dispatchEvent(element, 'keyup', { key: lastChar });
    }
    
    // Dispatch blur/focus events
    dispatchEvent(element, 'blur');
    dispatchEvent(element, 'focus');
    
    return true;
  } catch (error) {
    console.error('Error handling Twitter input:', error);
    
    // Create and handle error
    const appError = createError(
      ERROR_CODE[ERROR_CATEGORY.DOM].TWITTER_INPUT_FAILED,
      'Failed to handle Twitter input',
      error,
      { element, text },
      ERROR_SEVERITY.WARNING
    );
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
    publish(EVENTS.ERROR_OCCURRED, {
      source: 'dom-utils',
      message: 'Invalid input element for writing text',
      error: new Error('Invalid input element')
    });
    return false;
  }
  
  try {
    // Try Twitter-specific handling first
    if (element.isContentEditable) {
      const twitterResult = handleTwitterInput(element, text);
      if (twitterResult) return true;
    }
    
    // Try execCommand for contentEditable elements
    if (element.isContentEditable) {
      element.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      const success = document.execCommand('insertText', false, text);
      
      if (success) {
        // Dispatch events
        dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
        dispatchEvent(element, 'change');
        return true;
      }
    }
    
    // Fallback to direct value setting
    return setInputValue(element, text);
  } catch (error) {
    console.error('Error writing to input field:', error);
    
    // Create and handle error
    const appError = createError(
      ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
      'Failed to write to input field',
      error,
      { element, text },
      ERROR_SEVERITY.WARNING
    );
    handleError(appError, false, false, 'dom-utils');
    
    // Last resort fallback
    try {
      if (element.isContentEditable) {
        element.textContent = text;
      } else {
        element.value = text;
      }
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
     publish(EVENTS.ERROR_OCCURRED, {
       source: 'dom-utils',
       message: 'Invalid input element for appending text',
       error: new Error('Invalid input element')
     });
     return false;
   }
   
   try {
     // Get the current value of the element
     const currentValue = element.isContentEditable ? element.textContent : element.value;
     
     // If completeText is provided, use it directly
     // Otherwise, append the new text to the current value
     const newText = completeText !== '' ? completeText : currentValue + text;
     
     // Try Twitter-specific handling first
     if (element.isContentEditable) {
       const twitterResult = handleTwitterInput(element, newText);
       if (twitterResult) return true;
     }
     
     // Try execCommand for contentEditable elements
     if (element.isContentEditable) {
       element.focus();
       document.execCommand('selectAll', false, null);
       document.execCommand('delete', false, null);
       const success = document.execCommand('insertText', false, newText);
       
       if (success) {
         // Dispatch events
         dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
         if (isFinal) {
           dispatchEvent(element, 'change');
         }
         return true;
       }
     }
     
     // Fallback to direct value setting
     if (element.isContentEditable) {
       element.textContent = newText;
     } else {
       element.value = newText;
     }
     
     // Dispatch events
     dispatchEvent(element, 'input', { inputType: 'insertText', data: text });
     if (isFinal) {
       dispatchEvent(element, 'change');
     }
    
    // Dispatch key events for the last character
    if (text.length > 0) {
      const lastChar = text[text.length - 1];
      dispatchEvent(element, 'keydown', { key: lastChar });
      dispatchEvent(element, 'keyup', { key: lastChar });
    }
    
    return true;
  } catch (error) {
    console.error('Error appending to input field:', error);
    
    // Create and handle error
    const appError = createError(
      ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
      'Failed to append to input field',
      error,
      { element, text, originalText, isFinal },
      ERROR_SEVERITY.WARNING
    );
    handleError(appError, false, false, 'dom-utils');
    
    return false;
  }
}

/**
 * Clicks a button with visual feedback
 * @param {Element} button - Button to click
 * @returns {boolean} True if successful
 */
export function clickButtonWithFeedback(button) {
  if (!button || isButtonDisabled(button)) return false;
  
  try {
    // Store original styles
    const originalBackgroundColor = button.style.backgroundColor;
    const originalBorder = button.style.border;
    
    // Apply highlight style
    button.style.backgroundColor = '#4CAF50';
    button.style.border = '2px solid #2E7D32';
    
    // Wait a bit before clicking
    setTimeout(() => {
      // Restore original style
      button.style.backgroundColor = originalBackgroundColor;
      button.style.border = originalBorder;
      
      // Click the button
      button.click();
      
      // Publish status update
      publish(EVENTS.STATUS_UPDATED, { 
        messageKey: 'statusSubmitClicked',
        persistent: false
      });
    }, 500);
    
    return true;
  } catch (error) {
    console.error('Error clicking button with feedback:', error);
    
    // Create and handle error
    const appError = createError(
      ERROR_CODE[ERROR_CATEGORY.DOM].BUTTON_CLICK_FAILED,
      'Failed to click button with feedback',
      error,
      { button },
      ERROR_SEVERITY.WARNING
    );
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
    // Focus the element
    element.focus();
    
    // Clear based on element type
    if (element.isContentEditable) {
      element.textContent = '';
    } else {
      element.value = '';
    }
    
    // Dispatch events
    dispatchEvent(element, 'input');
    dispatchEvent(element, 'change');
    
    return true;
  } catch (error) {
    console.error('Error clearing input field:', error);
    
    // Create and handle error
    const appError = createError(
      ERROR_CODE[ERROR_CATEGORY.DOM].INPUT_OPERATION_FAILED,
      'Failed to clear input field',
      error,
      { element },
      ERROR_SEVERITY.WARNING
    );
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