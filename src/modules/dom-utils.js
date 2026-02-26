/**
 * DOM Utilities - Barrel file
 * Re-exports from focused sub-modules for backward compatibility
 */
export { filterVisibleElements, isElementVisible, isElementInViewport } from './dom-visibility.js';
export { isInputElement, findAllInputElements, scoreInputField, findBestInputField } from './dom-input-detection.js';
export { isButtonDisabled, findAllButtons, findButtonsForInput, scoreSubmitButton, findBestSubmitButton } from './dom-button-detection.js';
export { dispatchEvent, setInputValue, handleTwitterInput, writeToInputField, appendToInputField, clickButtonWithFeedback, clearInputField, findElement, findAllElements } from './dom-input-manipulation.js';
