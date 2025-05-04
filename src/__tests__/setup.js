/**
 * Jest setup file
 * This file is used to set up the test environment
 */

// Add a simple test to make Jest happy
test('setup file is loaded', () => {
  expect(true).toBe(true);
});

// Mock the chrome API
global.chrome = {
  i18n: {
    getMessage: (key) => key
  },
  storage: {
    sync: {
      get: () => {},
      set: () => {}
    },
    local: {
      get: () => {},
      set: () => {}
    }
  }
};

// Mock window object
global.window = {
  ...global.window,
  currentInputElement: null,
  lastClickedInput: null,
  appendMode: false,
  originalText: '',
  isListening: false,
  apiKey: '',
  recognitionLang: 'ja-JP',
  autoDetectInputFields: true,
  autoCorrection: true,
  useHistoryContext: true,
  themeMode: 'dark',
  processingState: 'idle',
  showModalWindow: true,
  modalOriginalText: '',
  lastAppendedText: '',
  newRecognitionSession: false
};

// Mock document object
document.body.innerHTML = '<div id="root"></div>';