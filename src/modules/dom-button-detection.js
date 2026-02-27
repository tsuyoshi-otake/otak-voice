/**
 * DOM Button Detection Module
 * Provides utilities for finding and scoring button elements
 */

import { isElementVisible } from './dom-visibility.js';

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
           parseFloat(getComputedStyle(button).opacity) < 0.9;
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
    const submitKeywords = ['\u9001\u4FE1', '\u6295\u7A3F', 'submit', 'post', 'send', '\u78BA\u5B9A', '\u5B9F\u884C', 'ok', '\u4E86\u89E3'];
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
