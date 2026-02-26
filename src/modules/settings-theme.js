/**
 * Settings Theme Module
 * Manages theme toggling and application
 */

import { DEFAULT_SETTINGS, THEME_MODES } from '../constants.js';
import { getState } from './state.js';
import { publishStatus as showStatus } from './event-bus.js';
import {
  tryCatch,
  ERROR_CATEGORY,
  ERROR_CODE
} from './error-handler.js';
import { saveSetting } from './settings-storage.js';

/**
 * Toggle theme between light and dark
 * @returns {Promise<boolean>} Success status
 */
async function toggleTheme() {
  return tryCatch(
    async () => {
      // Get current theme and determine new theme
      const currentTheme = getState('themeMode');
      const newTheme = currentTheme === THEME_MODES.DARK ? THEME_MODES.LIGHT : THEME_MODES.DARK;

      // Save new theme
      await saveSetting('themeMode', newTheme);

      // Show status message
      showStatus(newTheme === THEME_MODES.DARK ? 'statusThemeDark' : 'statusThemeLight');

      return true;
    },
    {
      errorCode: ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED,
      showNotification: true,
      source: 'settings'
    }
  );
}

/**
 * Apply theme to UI elements
 * @param {string} theme - Theme to apply (THEME_MODES.DARK or THEME_MODES.LIGHT)
 * @param {boolean} skipDomOperations - Skip DOM operations (useful for testing)
 * @returns {string} The applied theme
 */
function applyTheme(theme, skipDomOperations = false) {
  // Validate theme
  if (theme !== THEME_MODES.DARK && theme !== THEME_MODES.LIGHT) {
    console.warn(`Invalid theme: ${theme}, using default`);
    theme = DEFAULT_SETTINGS.THEME;
  }

  // Skip DOM operations if requested (for testing)
  // or if we're not in a browser environment
  if (skipDomOperations || typeof document === 'undefined') {
    return theme;
  }

  try {
    // Apply theme to document root
    if (document.documentElement) {
      document.documentElement.setAttribute('data-otak-theme', theme);
    }

    // Update theme select in settings modal
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
      themeSelect.value = theme;
    }

    // Update theme toggle button
    const themeToggleBtn = document.querySelector('.otak-voice-menu__theme-toggle-btn');
    if (themeToggleBtn) {
      if (theme === THEME_MODES.LIGHT) {
        themeToggleBtn.classList.add('otak-voice-menu__theme-toggle-btn--active');
        themeToggleBtn.title = chrome.i18n.getMessage('themeToggleToDark');
      } else {
        themeToggleBtn.classList.remove('otak-voice-menu__theme-toggle-btn--active');
        themeToggleBtn.title = chrome.i18n.getMessage('themeToggleToLight');
      }
    }

    // Apply theme to recognition modal
    const recognitionModal = document.querySelector('.otak-voice-recognition');
    if (recognitionModal) {
      recognitionModal.setAttribute('data-theme', theme);
    }
  } catch (error) {
    console.error('Error applying theme:', error);
    // Don't throw the error, just log it to avoid breaking the app
  }

  return theme;
}

export { toggleTheme, applyTheme };
