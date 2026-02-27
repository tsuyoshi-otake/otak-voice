/**
 * Input Field Operation Module
 * Barrel file that re-exports all input handler functionality
 */

export { MENU_EXPANDED_STORAGE_KEY, loadMenuState, saveMenuState } from './input-storage.js';
export { toggleMenu, updateMenuState } from './input-menu.js';
export { toggleSettingsModal } from './ui-settings-modal.js';
export { findBestInputField, submitAfterVoiceInput, writeToInputField, simulateTypingIntoElement, clearCurrentInput, proofreadCurrentInput, enhanceInputElementHandlers } from './input-operations.js';
export { initInputHandler, setupEventSubscriptions } from './input-handler-init.js';
