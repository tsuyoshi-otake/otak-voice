/**
 * Input Menu Module
 * Provides menu and settings modal UI operations
 */

import { saveMenuState } from './input-storage.js';
import { getState, setState } from './state.js';
import { MENU_ICON } from '../icons.js';

/**
 * Toggle menu display
 */
export function toggleMenu() {
    const menuContainer = document.getElementById('otak-voice-menu-container');
    const menuButton = document.getElementById('otak-voice-menu-btn');

    if (!menuContainer || !menuButton) return;

    // Get current menu state from state management
    const currentMenuExpanded = getState('menuExpanded');

    // Toggle menu state
    const newMenuExpanded = !currentMenuExpanded;

    // Update state in state management
    setState('menuExpanded', newMenuExpanded);

    // Update menu state
    updateMenuState();

    // Save menu state
    // await might not be necessary, but consider wrapping in try...catch for error handling
    saveMenuState(newMenuExpanded);
}

/**
 * Update menu state
 */
export function updateMenuState() {
    const menuContainer = document.getElementById('otak-voice-menu-container');
    const menuButton = document.getElementById('otak-voice-menu-btn');

    if (!menuContainer || !menuButton) {
        console.log('Menu elements not found');
        return;
    }

    // Update menu container state
    const menuExpanded = getState('menuExpanded');
    if (menuExpanded) {
        menuContainer.classList.add('otak-voice-menu__container--expanded');
        menuButton.classList.add('otak-voice-menu__btn--expanded');

        // Update menu button icon - directly set the innerHTML since it doesn't have an icon container
        menuButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="15" y1="5" x2="5" y2="15"></line>
          <line x1="5" y1="5" x2="15" y2="15"></line>
        </svg>`;
    } else {
        menuContainer.classList.remove('otak-voice-menu__container--expanded');
        menuButton.classList.remove('otak-voice-menu__btn--expanded');

        // Update menu button icon - directly set the innerHTML
        // Use MENU_ICON directly from import
        menuButton.innerHTML = MENU_ICON;
        // Close history panel when menu is closed
        const historyPanel = document.getElementById('otak-voice-history-panel');
        if (historyPanel) historyPanel.style.display = 'none';
        // Close settings modal as well
        const settingsModal = document.getElementById('otak-voice-settings-modal');
        if (settingsModal) settingsModal.style.display = 'none';
    }
}

