/**
 * State Management Module
 * Implements the Observable pattern for centralized state management
 * Reduces dependency on global variables and window object
 */

import { DEFAULT_SETTINGS, PROCESSING_STATE } from '../constants.js';

// Private state object
const _state = {
  // Input handling state
  currentInputElement: null,
  lastClickedInput: null,
  autoSubmit: true,
  originalText: '',
  interimText: '',
  lastRecognizedText: '',
  appendMode: false,
  isEditing: false,
  
  // UI state
  processingState: PROCESSING_STATE.IDLE,
  menuExpanded: false,
  showModalWindow: true,
  modalOriginalText: '',
  lastAppendedText: '',
  newRecognitionSession: false,
  
  // Speech recognition state
  isListening: false,
  silenceTimeout: DEFAULT_SETTINGS.SILENCE_TIMEOUT,
  useRecognitionModal: false,
  recognitionReady: false,
  
  // Settings
  apiKey: '',
  recognitionLang: DEFAULT_SETTINGS.RECOGNITION_LANG,
  autoDetectInputFields: DEFAULT_SETTINGS.AUTO_DETECT_INPUT_FIELDS,
  autoCorrection: DEFAULT_SETTINGS.AUTO_CORRECTION,
  useHistoryContext: DEFAULT_SETTINGS.USE_HISTORY_CONTEXT,
  themeMode: DEFAULT_SETTINGS.THEME,
  autoCorrectionPrompt: DEFAULT_SETTINGS.AUTO_CORRECTION_PROMPT,
  proofreadingPrompt: DEFAULT_SETTINGS.PROOFREADING_PROMPT
};

// Subscribers for state changes
const _subscribers = {};

/**
 * Get the current state
 * @param {string} key - State key to retrieve
 * @returns {any} Current state value
 */
export function getState(key) {
  if (key === undefined) {
    return { ..._state }; // Return a copy of the entire state
  }
  
  if (!(key in _state)) {
    // 警告を出力しないように修正
    // console.warn(`State key "${key}" does not exist`);
    return undefined;
  }
  
  return _state[key];
}

/**
 * Update the state
 * @param {string|object} keyOrObject - State key to update or object with multiple updates
 * @param {any} value - New value (if key is a string)
 * @returns {boolean} Success status
 */
export function setState(keyOrObject, value) {
  // Handle object updates (multiple keys at once)
  if (typeof keyOrObject === 'object' && keyOrObject !== null) {
    const updates = {};
    let hasChanges = false;
    
    // Check each key in the update object
    Object.entries(keyOrObject).forEach(([key, val]) => {
      if (!(key in _state)) {
        // 警告を出力しないように修正
        // console.warn(`State key "${key}" does not exist`);
        return;
      }
      
      if (_state[key] !== val) {
        updates[key] = val;
        hasChanges = true;
      }
    });
    
    // If there are changes, update state and notify subscribers
    if (hasChanges) {
      // Update state
      Object.entries(updates).forEach(([key, val]) => {
        _state[key] = val;
      });
      
      // Notify subscribers for each changed key
      Object.keys(updates).forEach(key => {
        _notifySubscribers(key, _state[key]);
      });
      
      return true;
    }
    
    return false;
  }
  
  // Handle single key update
  const key = keyOrObject;
  
  if (!(key in _state)) {
    // 警告を出力しないように修正
    // console.warn(`State key "${key}" does not exist`);
    return false;
  }
  
  // Only update if value has changed
  if (_state[key] !== value) {
    _state[key] = value;
    _notifySubscribers(key, value);
    return true;
  }
  
  return false;
}

/**
 * Subscribe to state changes
 * @param {string} key - State key to subscribe to
 * @param {function} callback - Function to call when state changes
 * @returns {function} Unsubscribe function
 */
export function subscribe(key, callback) {
  if (!(key in _state)) {
    // 警告を出力しないように修正
    // console.warn(`Cannot subscribe to non-existent state key "${key}"`);
    return () => {};
  }
  
  if (typeof callback !== 'function') {
    console.warn('Subscriber callback must be a function');
    return () => {};
  }
  
  // Initialize subscribers array for this key if it doesn't exist
  if (!_subscribers[key]) {
    _subscribers[key] = [];
  }
  
  // Add callback to subscribers
  _subscribers[key].push(callback);
  
  // Return unsubscribe function
  return () => {
    if (_subscribers[key]) {
      _subscribers[key] = _subscribers[key].filter(cb => cb !== callback);
    }
  };
}

/**
 * Notify subscribers of state changes
 * @param {string} key - State key that changed
 * @param {any} value - New state value
 * @private
 */
function _notifySubscribers(key, value) {
  if (_subscribers[key]) {
    _subscribers[key].forEach(callback => {
      try {
        callback(value);
      } catch (error) {
        console.error(`Error in state subscriber for key "${key}":`, error);
      }
    });
  }
}

/**
 * Initialize state from window object and settings
 * This is a transitional function to migrate from global variables to state management
 * @param {object} windowObj - Window object (or mock for testing)
 */
export function initializeStateFromGlobals(windowObj = window) {
  // Only run in browser context
  if (typeof windowObj === 'undefined') {
    return; /* istanbul ignore next */
  }
  
  // Map of state keys to window properties
  const stateWindowMap = {
    currentInputElement: 'currentInputElement',
    lastClickedInput: 'lastClickedInput',
    autoSubmit: 'autoSubmit',
    originalText: 'originalText',
    isListening: 'isListening',
    apiKey: 'apiKey',
    recognitionLang: 'recognitionLang',
    autoDetectInputFields: 'autoDetectInputFields',
    autoCorrection: 'autoCorrection',
    useHistoryContext: 'useHistoryContext',
    themeMode: 'themeMode',
    processingState: 'processingState',
    showModalWindow: 'showModalWindow',
    modalOriginalText: 'modalOriginalText',
    lastAppendedText: 'lastAppendedText',
    newRecognitionSession: 'newRecognitionSession',
    useRecognitionModal: 'useRecognitionModal',
    recognitionReady: 'recognitionReady'
  };

  // Initialize state from window properties
  const updates = {};
  Object.entries(stateWindowMap).forEach(([stateKey, windowKey]) => {
    if (windowKey in windowObj && windowObj[windowKey] !== undefined) {
      updates[stateKey] = windowObj[windowKey];
    }
  });
  
  // Update state with all collected values
  if (Object.keys(updates).length > 0) {
    setState(updates);
  }
}

/**
 * Sync state changes back to window object
 * This is a transitional function to maintain compatibility with code that still uses window properties
 * @param {object} windowObj - Window object (or mock for testing)
 */
export function syncStateToGlobals(windowObj = window) {
  // Only run in browser context
  if (typeof windowObj === 'undefined') {
    return; /* istanbul ignore next */
  }
  
  // Map of state keys to window properties
  const stateWindowMap = {
    currentInputElement: 'currentInputElement',
    lastClickedInput: 'lastClickedInput',
    autoSubmit: 'autoSubmit',
    originalText: 'originalText',
    isListening: 'isListening',
    apiKey: 'apiKey',
    recognitionLang: 'recognitionLang',
    autoDetectInputFields: 'autoDetectInputFields',
    autoCorrection: 'autoCorrection',
    useHistoryContext: 'useHistoryContext',
    themeMode: 'themeMode',
    processingState: 'processingState',
    showModalWindow: 'showModalWindow',
    modalOriginalText: 'modalOriginalText',
    lastAppendedText: 'lastAppendedText',
    newRecognitionSession: 'newRecognitionSession',
    useRecognitionModal: 'useRecognitionModal',
    recognitionReady: 'recognitionReady'
  };

  // Set up subscribers to sync state to window
  Object.entries(stateWindowMap).forEach(([stateKey, windowKey]) => {
    subscribe(stateKey, (value) => {
      windowObj[windowKey] = value;
    });
    
    // Initial sync
    windowObj[windowKey] = _state[stateKey];
  });
}

// Export a function to initialize the state module
export function initializeState() {
  // Initialize state from window object
  initializeStateFromGlobals();
  
  // Set up sync to window object (for backward compatibility)
  syncStateToGlobals();
  
  console.log('State management initialized');
}