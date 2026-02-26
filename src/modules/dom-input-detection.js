/**
 * DOM Input Detection Module
 * Provides utilities for finding and scoring input elements
 */

import { isElementVisible, isElementInViewport } from './dom-visibility.js';

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
    const chatKeywords = ['chat', 'message', '\u5165\u529B', '\u9001\u4FE1', 'input', 'text', 'comment'];
    const searchKeywords = ['search', '\u691C\u7D22'];

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
