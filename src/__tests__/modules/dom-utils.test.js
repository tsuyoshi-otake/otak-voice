/**
 * DOM Utilities - Barrel test file
 *
 * Verifies that the dom-utils barrel module re-exports all functions
 * from the sub-modules correctly. Detailed tests live in:
 *   - dom-visibility.test.js
 *   - dom-input-detection.test.js
 *   - dom-button-detection.test.js
 *   - dom-input-manipulation.test.js
 */

import * as domUtils from '../../modules/dom-utils';

describe('DOM Utilities barrel exports', () => {
  const expectedExports = [
    // dom-visibility
    'filterVisibleElements',
    'isElementVisible',
    'isElementInViewport',
    // dom-input-detection
    'isInputElement',
    'findAllInputElements',
    'scoreInputField',
    'findBestInputField',
    // dom-button-detection
    'isButtonDisabled',
    'findAllButtons',
    'findButtonsForInput',
    'scoreSubmitButton',
    'findBestSubmitButton',
    // dom-input-manipulation
    'dispatchEvent',
    'setInputValue',
    'handleTwitterInput',
    'writeToInputField',
    'appendToInputField',
    'clickButtonWithFeedback',
    'clearInputField',
    'findElement',
    'findAllElements',
  ];

  it.each(expectedExports)('should export %s as a function', (name) => {
    expect(typeof domUtils[name]).toBe('function');
  });

  it('should export exactly the expected number of functions', () => {
    const exportedKeys = Object.keys(domUtils);
    expect(exportedKeys.length).toBe(expectedExports.length);
  });
});
