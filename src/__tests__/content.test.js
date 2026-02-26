// Mock necessary modules and browser APIs
jest.mock('../modules/dom-observer', () => ({
  setupDOMObserver: jest.fn(),
}));
jest.mock('../modules/settings', () => ({
  loadSettings: jest.fn().mockResolvedValue({}),
}));
jest.mock('../modules/ui', () => ({
  createUI: jest.fn(),
  setupEventListeners: jest.fn(),
  updateMenuState: jest.fn(),
}));
jest.mock('../modules/input-handler', () => ({
  loadMenuState: jest.fn().mockResolvedValue({}),
  updateMenuState: jest.fn(), 
  initInputHandler: jest.fn().mockResolvedValue({}),
}));
jest.mock('../icons', () => ({
  MENU_ICON: '<svg></svg>', // Mock SVG content
}));
jest.mock('../modules/utils', () => ({
  isInputElement: jest.fn(),
}));
jest.mock('../site-handlers/site-detector', () => ({
  detectSiteType: jest.fn(),
}));
jest.mock('../modules/state', () => ({
  initializeState: jest.fn(),
  setState: jest.fn(),
  getState: jest.fn(),
}));
jest.mock('../modules/speech', () => ({
  initSpeechEvents: jest.fn(),
}));
jest.mock('../modules/event-bus', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
  EVENTS: {
    UI_RECOVERY_NEEDED: 'uiRecoveryNeeded',
    INITIALIZATION_COMPLETE: 'initializationComplete',
    INITIALIZATION_ERROR: 'initializationError',
    GPT_PROOFREADING_STARTED: 'gptProofreadingStarted',
    SPEECH_RECOGNITION_STARTED: 'speechRecognitionStarted',
    SPEECH_RECOGNITION_STOPPED: 'speechRecognitionStopped',
    SETTINGS_LOADED: 'settingsLoaded',
  },
}));

// Mock chrome.i18n
global.chrome = {
  ...global.chrome,
  i18n: {
    getMessage: jest.fn((key) => `[${key}]`),
  },
};

// Mock window.setInterval and window.alert
global.window.setInterval = jest.fn((fn) => {
  // Store the callback for later execution in tests
  global.window.setInterval.mock.mostRecentCallback = fn;
  return 123; // Return a dummy ID
});
global.window.clearInterval = jest.fn();
global.window.alert = jest.fn();

// Mock SpeechRecognition API
global.window.webkitSpeechRecognition = jest.fn();
global.window.SpeechRecognition = jest.fn();

// Import the content module functions AFTER mocking dependencies
const { 
  initVoiceInput, 
  runInitialization, 
  setupEventSubscriptions, 
  setupPeriodicSelfHealing 
} = require('../content');

describe('content script', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '<div id="root"></div>';
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('runInitialization', () => {
    test('successfully initializes modules', async () => {
      await runInitialization();
      
      // Verify key modules were initialized
      expect(require('../modules/state').initializeState).toHaveBeenCalled();
      expect(require('../modules/speech').initSpeechEvents).toHaveBeenCalled();
      expect(require('../modules/settings').loadSettings).toHaveBeenCalled();
      expect(require('../modules/input-handler').initInputHandler).toHaveBeenCalled();
      expect(require('../modules/dom-observer').setupDOMObserver).toHaveBeenCalled();
      expect(require('../modules/event-bus').publish).toHaveBeenCalledWith('initializationComplete');
    });

    test('handles initialization errors', async () => {
      // Force an error during initialization
      require('../modules/state').initializeState.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      await runInitialization();
      
      expect(require('../modules/event-bus').publish).toHaveBeenCalledWith(
        'initializationError', 
        expect.any(Error)
      );
    });
  });

  describe('initVoiceInput', () => {
    test('should check for SpeechRecognition API support', async () => {
      // Remove SpeechRecognition to test unsupported case
      delete global.window.webkitSpeechRecognition;
      delete global.window.SpeechRecognition;

      await initVoiceInput();

      expect(global.window.alert).toHaveBeenCalled();

      // Restore
      global.window.webkitSpeechRecognition = jest.fn();
      global.window.SpeechRecognition = jest.fn();
    });

    test('should create UI when menu button does not exist', async () => {
      document.body.innerHTML = '<div id="root"></div>';

      await initVoiceInput();

      expect(require('../modules/ui').createUI).toHaveBeenCalled();
      expect(require('../modules/ui').setupEventListeners).toHaveBeenCalled();
      expect(require('../modules/input-handler').updateMenuState).toHaveBeenCalled();
    });

    test('should not recreate UI when menu button already exists', async () => {
      document.body.innerHTML = '<button id="otak-voice-menu-btn"></button>';

      await initVoiceInput();

      expect(require('../modules/ui').createUI).not.toHaveBeenCalled();
      expect(require('../modules/input-handler').updateMenuState).toHaveBeenCalled();
    });
  });

  describe('setupPeriodicSelfHealing', () => {
    test('checks for UI element and triggers recovery if needed', () => {
      setupPeriodicSelfHealing();
      
      expect(window.setInterval).toHaveBeenCalledWith(expect.any(Function), 10000);
      
      // Get the interval callback
      const intervalCallback = window.setInterval.mock.mostRecentCallback;
      
      // Simulate UI element not found
      document.body.innerHTML = '<div id="root"></div>';
      intervalCallback();
      
      expect(require('../modules/event-bus').publish).toHaveBeenCalledWith('uiRecoveryNeeded');
      
      // Simulate UI element found
      document.body.innerHTML = '<div id="root"></div><button id="otak-voice-menu-btn"></button>';
      jest.clearAllMocks(); // Reset call counts
      intervalCallback();
      
      expect(require('../modules/event-bus').publish).not.toHaveBeenCalled();
    });
  });

  describe('setupEventSubscriptions', () => {
    test('subscribes to events', () => {
      setupEventSubscriptions();
      
      // Test that subscribe was called multiple times
      expect(require('../modules/event-bus').subscribe).toHaveBeenCalledTimes(5);
      
      // Test specific event subscriptions
      expect(require('../modules/event-bus').subscribe).toHaveBeenCalledWith(
        'gptProofreadingStarted', 
        expect.any(Function)
      );
      expect(require('../modules/event-bus').subscribe).toHaveBeenCalledWith(
        'speechRecognitionStarted', 
        expect.any(Function)
      );
      expect(require('../modules/event-bus').subscribe).toHaveBeenCalledWith(
        'uiRecoveryNeeded',
        expect.any(Function)
      );
    });
  });
});