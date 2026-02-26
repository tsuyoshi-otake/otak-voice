/**
 * Background Script
 * Handles extension events (such as installation)
 */

// Define storage keys directly in this file to avoid importing modules that use window
const MENU_EXPANDED_STORAGE_KEY = 'menu_expanded_state';
const AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY = 'auto_detect_input_fields';

// Default settings
const DEFAULT_AUTO_DETECT_INPUT_FIELDS = true;

chrome.runtime.onInstalled.addListener(details => {
  console.log('onInstalled event detected:', details);
  if (details.reason === 'install') {
    console.log('Extension newly installed. Saving default settings.');
    const defaultSettings = {
      [MENU_EXPANDED_STORAGE_KEY]: false, // Default menu state is collapsed
      [AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY]: DEFAULT_AUTO_DETECT_INPUT_FIELDS // Default auto-detect setting
    };
    chrome.storage.sync.set(defaultSettings, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save default settings:', chrome.runtime.lastError);
      } else {
        console.log('Default settings saved:', defaultSettings);
      }
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated. Version:', details.previousVersion);
    // Add update processing if needed
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Verify sender is from this extension
  if (!sender.id || sender.id !== chrome.runtime.id) {
    return false;
  }

  if (message.type === 'getSettings') {
    chrome.storage.sync.get([MENU_EXPANDED_STORAGE_KEY, AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Failed to get settings:', chrome.runtime.lastError);
        sendResponse({});
      } else {
        sendResponse(result);
      }
    });
    return true; // Required for async response
  }
});