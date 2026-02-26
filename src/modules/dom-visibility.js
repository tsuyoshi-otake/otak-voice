/**
 * DOM Visibility Module
 * Provides visibility detection utilities for DOM elements
 */

/**
 * Filter elements to return only visible ones
 * @param {NodeList|Array} elements - Elements to filter
 * @returns {Array} Visible elements
 */
export function filterVisibleElements(elements) {
    return Array.from(elements).filter(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               rect.width > 0 &&
               rect.height > 0;
    });
}

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
