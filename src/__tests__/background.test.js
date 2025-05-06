// Mock chrome.runtime and chrome.storage before importing background.js
const mockStorageLocalSet = jest.fn((settings, callback) => {
  // Simulate successful save by default
  callback();
});
const mockStorageLocalGet = jest.fn((keys, callback) => {
  // Simulate async behavior using Promise and process.nextTick
  Promise.resolve().then(() => {
    // Simulate returning some settings by default
    const mockSettings = {
      menu_expanded_state: false,
      auto_detect_input_fields: true
    };
    callback(mockSettings);
  });
});

global.chrome = {
  ...global.chrome,
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    lastError: undefined, // Simulate no error by default
  },
  storage: {
    ...global.chrome.storage,
    local: {
      set: mockStorageLocalSet,
      get: mockStorageLocalGet,
    }
  }
};

// Import the background script after setting up mocks
require('../background');

describe('background script', () => {
  let onInstalledListener;
  let onMessageListener;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeAll(() => {
    // Get the listeners that were added by background.js
    onInstalledListener = global.chrome.runtime.onInstalled.addListener.mock.calls[0][0];
    onMessageListener = global.chrome.runtime.onMessage.addListener.mock.calls[0][0];
  });

  beforeEach(() => {
    // Reset mocks and spies before each test
    mockStorageLocalSet.mockClear();
    mockStorageLocalGet.mockClear();
    global.chrome.runtime.lastError = undefined;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console spies
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('onInstalled listener', () => {
    test('should be added on script load', () => {
      expect(global.chrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
    });

    test('should save default settings on install', () => {
      const details = { reason: 'install' };
      onInstalledListener(details);

      expect(consoleLogSpy).toHaveBeenCalledWith('onInstalled event detected:', details);
      expect(consoleLogSpy).toHaveBeenCalledWith('Extension newly installed. Saving default settings.');
      expect(mockStorageLocalSet).toHaveBeenCalledTimes(1);
      expect(mockStorageLocalSet).toHaveBeenCalledWith({
        menu_expanded_state: false,
        auto_detect_input_fields: true
      }, expect.any(Function));
      expect(consoleLogSpy).toHaveBeenCalledWith('Default settings saved:', {
        menu_expanded_state: false,
        auto_detect_input_fields: true
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('should log error if saving default settings fails', () => {
      const details = { reason: 'install' };
      const mockError = new Error('Storage error');
      global.chrome.runtime.lastError = mockError;

      onInstalledListener(details);

      expect(consoleLogSpy).toHaveBeenCalledWith('onInstalled event detected:', details);
      expect(consoleLogSpy).toHaveBeenCalledWith('Extension newly installed. Saving default settings.');
      expect(mockStorageLocalSet).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save default settings:', mockError);
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Default settings saved:', expect.any(Object));
    });

    test('should log update reason on update', () => {
      const details = { reason: 'update', previousVersion: '1.0' };
      onInstalledListener(details);

      expect(consoleLogSpy).toHaveBeenCalledWith('onInstalled event detected:', details);
      expect(consoleLogSpy).toHaveBeenCalledWith('Extension updated. Version:', details.previousVersion);
      expect(mockStorageLocalSet).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('should do nothing for other reasons', () => {
      const details = { reason: 'chrome_update' }; // Example of another reason
      onInstalledListener(details);

      expect(consoleLogSpy).toHaveBeenCalledWith('onInstalled event detected:', details);
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Extension newly installed. Saving default settings.');
      expect(consoleLogSpy).not.toHaveBeenCalledWith('Extension updated. Version:', expect.any(String));
      expect(mockStorageLocalSet).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('onMessage listener', () => {
    test('should be added on script load', () => {
      expect(global.chrome.runtime.onMessage.addListener).toHaveBeenCalledTimes(1);
    });

    test('should handle getSettings message', async () => {
      const message = { type: 'getSettings' };
      const sender = {}; // Mock sender object
      const sendResponse = jest.fn();

      const result = onMessageListener(message, sender, sendResponse);

      expect(mockStorageLocalGet).toHaveBeenCalledTimes(1);
      expect(mockStorageLocalGet).toHaveBeenCalledWith(null, expect.any(Function));

      // The mock itself now handles the async callback, so we just need to wait for it.
      // We can wait for the next tick to ensure the callback has had a chance to run.
      await new Promise(process.nextTick);

      expect(sendResponse).toHaveBeenCalledTimes(1);
      // Expect sendResponse to be called with the default settings object
      expect(sendResponse).toHaveBeenCalledWith({
        menu_expanded_state: false,
        auto_detect_input_fields: true
      });
      expect(result).toBe(true); // Should return true for async response
    });

    test('should do nothing for other message types', () => {
      const message = { type: 'someOtherMessage' };
      const sender = {};
      const sendResponse = jest.fn();

      const result = onMessageListener(message, sender, sendResponse);

      expect(mockStorageLocalGet).not.toHaveBeenCalled();
      expect(sendResponse).not.toHaveBeenCalled();
      expect(result).toBeUndefined(); // Should not return true for non-async response
    });
  });
});