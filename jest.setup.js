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

// Mock console methods
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

// Mock document object
document.body.innerHTML = '<div id="root"></div>';