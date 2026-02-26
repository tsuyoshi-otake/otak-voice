/**
 * UI Core Module
 * Responsible for creating and managing core UI elements
 */

import { updateHistoryPanel } from './history.js';
import { PROCESSING_STATE } from '../constants.js';
import { getState } from './state.js';
import { updateAutoSubmitButtonState } from './input-handler.js';
import { toggleTheme } from './settings.js';
import { createSettingsModal } from './ui-settings-modal.js';
import { toggleModalVisibility } from './ui-events.js';

import {
    MENU_ICON,
    MIC_ICON,
    APPEND_ICON,
    CLEAR_ICON,
    PROOFREAD_ICON,
    EDIT_ICON,
    SETTINGS_ICON,
    HISTORY_ICON,
    MODAL_TOGGLE_ICON,
    THEME_TOGGLE_ICON,
    AUTO_SUBMIT_ICON
} from '../icons.js';

/**
 * Creates UI elements
 */
export function createUI() {
    // Remove existing elements (just in case)
    removeExistingElements();

    // Main menu button
    const menuButton = document.createElement('div');
    menuButton.className = 'otak-voice-menu__btn';
    menuButton.id = 'otak-voice-menu-btn'; // Add ID for easier selection
    menuButton.innerHTML = MENU_ICON;
    // Remove title attribute to disable native tooltip
    document.body.appendChild(menuButton);

    // Menu container
    const menuContainer = document.createElement('div');
    menuContainer.className = 'otak-voice-menu__container';
    menuContainer.id = 'otak-voice-menu-container'; // Add ID for easier selection
    document.body.appendChild(menuContainer);

    // Theme toggle button
    const themeToggleButton = createMenuItem('theme-toggle-btn', THEME_TOGGLE_ICON, chrome.i18n.getMessage('themeToggleTooltip') || 'テーマ切り替え');
    const themeMode = getState('themeMode');
    // Remove title attribute to disable native tooltip
    menuContainer.appendChild(themeToggleButton);

    // Modal display/hide toggle button
    const modalToggleButton = createMenuItem('modal-toggle-btn', MODAL_TOGGLE_ICON, chrome.i18n.getMessage('modalToggleTooltip'));
    const showModalWindow = getState('showModalWindow');
    // Set initial state based on settings
    if (!showModalWindow) {
        modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
    }
    // Remove title attribute to disable native tooltip
    menuContainer.appendChild(modalToggleButton);

    // Microphone button
    const micButton = createMenuItem('input-btn', MIC_ICON, chrome.i18n.getMessage('micTooltip'));
    menuContainer.appendChild(micButton);

    // Auto-submit toggle button
    const autoSubmitButton = createMenuItem('append-btn', AUTO_SUBMIT_ICON, chrome.i18n.getMessage('autoSubmitTooltip'));
    menuContainer.appendChild(autoSubmitButton);

    // Set initial state for auto-submit button
    const autoSubmit = getState('autoSubmit');
    if (autoSubmit !== undefined) {
        updateAutoSubmitButtonState(autoSubmit);
    }

    // Clear button
    const clearButton = createMenuItem('clear-btn', CLEAR_ICON, chrome.i18n.getMessage('clearTooltip'));
    menuContainer.appendChild(clearButton);

    // Proofread button
    const proofreadButton = createMenuItem('proofread-btn', PROOFREAD_ICON, chrome.i18n.getMessage('proofreadTooltip'));
    menuContainer.appendChild(proofreadButton);

    // Edit button
    const editButton = createMenuItem('edit-btn', EDIT_ICON, chrome.i18n.getMessage('editTooltip'));
    menuContainer.appendChild(editButton);

    // Settings button
    const settingsButton = createMenuItem('settings-btn', SETTINGS_ICON, chrome.i18n.getMessage('settingsTooltip'));
    menuContainer.appendChild(settingsButton);

    // History button
    const historyButton = createMenuItem('history-btn', HISTORY_ICON, chrome.i18n.getMessage('historyTooltip'));
    menuContainer.appendChild(historyButton);

    // Status display
    const statusDisplay = document.createElement('div');
    statusDisplay.className = 'otak-voice-status';
    document.body.appendChild(statusDisplay);

    // Settings modal
    createSettingsModal();

    // History panel
    createHistoryPanel();
    // Add event listener for modal toggle button
    const modalToggleBtn = document.querySelector('.otak-voice-menu__modal-toggle-btn');
    if (modalToggleBtn) {
        modalToggleBtn.addEventListener('click', toggleModalVisibility);
    }

    // Add event listener for theme toggle button
    const themeToggleBtn = document.querySelector('.otak-voice-menu__theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Update button state at initialization
    updateEditProofreadButtonsState();
}

/**
 * Update edit/proofread buttons state based on input field state
 */
export function updateEditProofreadButtonsState() {
    const proofreadButton = document.querySelector('.otak-voice-menu__proofread-btn');
    const editButton = document.querySelector('.otak-voice-menu__edit-btn');

    if (!proofreadButton || !editButton) return;

    const currentInputElement = getState('currentInputElement');

    if (!currentInputElement ||
        (currentInputElement.value === '' && !currentInputElement.textContent) ||
        (currentInputElement.value && currentInputElement.value.trim() === '') ||
        (currentInputElement.textContent && currentInputElement.textContent.trim() === '')) {

        proofreadButton.classList.add('otak-voice-menu__item--disabled');
        editButton.classList.add('otak-voice-menu__item--disabled');
    } else {
        const processingState = getState('processingState');
        if (processingState === PROCESSING_STATE.IDLE) {
            proofreadButton.classList.remove('otak-voice-menu__item--disabled');
            editButton.classList.remove('otak-voice-menu__item--disabled');
        }
    }
}

/**
 * Creates a menu item
 * @param {string} id - Element ID
 * @param {string} iconSvg - Icon SVG string
 * @param {string} tooltip - Tooltip text
 * @returns {HTMLElement} Created menu item element
 */
export function createMenuItem(id, iconSvg, tooltip) {
    const item = document.createElement('div');
    item.className = `otak-voice-menu__${id} otak-voice-menu__item`;

    // Set SVG icon
    const iconContainer = document.createElement('div');
    iconContainer.className = 'otak-voice-menu__icon-container';
    iconContainer.innerHTML = iconSvg;
    item.appendChild(iconContainer);

    const label = document.createElement('div');
    label.className = 'otak-voice-menu__label';

    // Set label text for all buttons
    label.textContent = tooltip;

    // Do not set native tooltip (remove title attribute)

    item.appendChild(label);

    return item;
}

/**
 * Removes existing elements
 */
export function removeExistingElements() {
    const elementSelectors = [
        '.otak-voice-menu__btn',
        '.otak-voice-menu__container',
        '.otak-voice-menu__input-btn',
        '.otak-voice-menu__append-btn',
        '.otak-voice-menu__proofread-btn',
        '.otak-voice-menu__edit-btn',
        '.otak-voice-menu__settings-btn',
        '.otak-voice-menu__history-btn',
        '.otak-voice-menu__clear-btn',
        '.otak-voice-status',
        '.otak-voice-settings',
        '.otak-voice-history',
        '.otak-voice-menu__modal-toggle-btn',
        '.otak-voice-menu__theme-toggle-btn'
    ];

    elementSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.remove();
    });
}

/**
 * Creates the history panel
 */
export function createHistoryPanel() {
    const panel = document.createElement('div');
    panel.className = 'otak-voice-history';
    // Title is now handled by CSS :first-child selector, but keep a placeholder div
    panel.innerHTML = `<div>${chrome.i18n.getMessage('historyPanelTitle')}</div>`;
    document.body.appendChild(panel);

    updateHistoryPanel();
}
