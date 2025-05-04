// src/background.js
var MENU_EXPANDED_STORAGE_KEY = "menu_expanded_state";
var AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY = "auto_detect_input_fields";
var DEFAULT_AUTO_DETECT_INPUT_FIELDS = true;
chrome.runtime.onInstalled.addListener((details) => {
  console.log("onInstalled event detected:", details);
  if (details.reason === "install") {
    console.log("Extension newly installed. Saving default settings.");
    const defaultSettings = {
      [MENU_EXPANDED_STORAGE_KEY]: false,
      // Default menu state is collapsed
      [AUTO_DETECT_INPUT_FIELDS_STORAGE_KEY]: DEFAULT_AUTO_DETECT_INPUT_FIELDS
      // Default auto-detect setting
    };
    chrome.storage.local.set(defaultSettings, () => {
      if (chrome.runtime.lastError) {
        console.error("Failed to save default settings:", chrome.runtime.lastError);
      } else {
        console.log("Default settings saved:", defaultSettings);
      }
    });
  } else if (details.reason === "update") {
    console.log("Extension updated. Version:", details.previousVersion);
  }
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getSettings") {
    chrome.storage.local.get(null, (result) => {
      sendResponse(result);
    });
    return true;
  }
});
