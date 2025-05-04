/**
 * Event Bus Module
 * Implements a publish-subscribe pattern for decoupled communication between modules
 * Resolves circular dependencies by providing a central communication mechanism
 */

// Private event handlers storage
const _eventHandlers = {};

/**
 * Subscribe to an event
 * @param {string} eventName - Name of the event to subscribe to
 * @param {function} handler - Event handler function
 * @returns {function} Unsubscribe function
 */
export function subscribe(eventName, handler) {
  if (typeof handler !== 'function') {
    console.warn('Event handler must be a function');
    return () => {};
  }
  
  // Initialize handlers array for this event if it doesn't exist
  if (!_eventHandlers[eventName]) {
    _eventHandlers[eventName] = [];
  }
  
  // Add handler to subscribers
  _eventHandlers[eventName].push(handler);
  
  // Return unsubscribe function
  return () => {
    if (_eventHandlers[eventName]) {
      _eventHandlers[eventName] = _eventHandlers[eventName].filter(h => h !== handler);
    }
  };
}

/**
 * Publish an event
 * @param {string} eventName - Name of the event to publish
 * @param {any} data - Data to pass to event handlers
 */
export function publish(eventName, data) {
  if (!_eventHandlers[eventName]) {
    return; // No handlers for this event
  }
  
  // Call all handlers for this event
  _eventHandlers[eventName].forEach(handler => {
    try {
      handler(data);
    } catch (error) {
      console.error(`Error in event handler for "${eventName}":`, error);
    }
  });
}

/**
 * Clear all event handlers
 * Useful for testing or resetting the event bus
 */
export function clear() {
  Object.keys(_eventHandlers).forEach(eventName => {
    _eventHandlers[eventName] = [];
  });
}

/**
 * Get all registered event names
 * Useful for debugging
 * @returns {string[]} Array of event names
 */
export function getEventNames() {
  return Object.keys(_eventHandlers);
}

/**
 * Get count of handlers for a specific event
 * Useful for debugging
 * @param {string} eventName - Name of the event
 * @returns {number} Number of handlers
 */
export function getHandlerCount(eventName) {
  return _eventHandlers[eventName] ? _eventHandlers[eventName].length : 0;
}

// Define standard event names as constants to prevent typos and ensure consistency
export const EVENTS = {
  // UI events
  MENU_TOGGLED: 'menu:toggled',
  SETTINGS_MODAL_TOGGLED: 'settings:modal:toggled',
  APPEND_MODE_TOGGLED: 'append:mode:toggled',
  AUTO_SUBMIT_TOGGLED: 'auto:submit:toggled',
  AUTO_SUBMIT_STATE_CHANGED: 'auto:submit:state:changed',
  PROCESSING_STATE_CHANGED: 'processing:state:changed',
  STATUS_UPDATED: 'status:updated',
  MODAL_VISIBILITY_TOGGLED: 'modal:visibility:toggled',
  RECOGNITION_MODAL_UPDATED: 'recognition:modal:updated',
  RECOGNITION_MODAL_SHOWN: 'recognition:modal:shown',
  UI_RECOVERY_NEEDED: 'ui:recovery:needed',
  MENU_STATE_UPDATE_NEEDED: 'menu:state:update:needed',
  
  // Input events
  INPUT_CLEARED: 'input:cleared',
  INPUT_FIELD_FOUND: 'input:field:found',
  INPUT_FIELD_CLICKED: 'input:field:clicked',
  INPUT_HANDLERS_UPDATE_NEEDED: 'input:handlers:update:needed',
  
  // Speech events
  SPEECH_RECOGNITION_STARTED: 'speech:recognition:started',
  SPEECH_RECOGNITION_STOPPED: 'speech:recognition:stopped',
  SPEECH_RECOGNITION_RESULT: 'speech:recognition:result',
  MIC_BUTTON_CLICKED: 'mic:button:clicked',
  
  // Settings events
  SETTINGS_SAVED: 'settings:saved',
  SETTINGS_LOADED: 'settings:loaded',
  API_KEY_UPDATED: 'api:key:updated',
  LANGUAGE_UPDATED: 'language:updated',
  THEME_TOGGLED: 'theme:toggled',
  
  // History events
  HISTORY_ADDED: 'history:added',
  HISTORY_PANEL_TOGGLED: 'history:panel:toggled',
  
  // GPT events
  GPT_CORRECTION_STARTED: 'gpt:correction:started',
  GPT_CORRECTION_COMPLETED: 'gpt:correction:completed',
  GPT_CORRECTION_FAILED: 'gpt:correction:failed',
  GPT_PROOFREADING_STARTED: 'gpt:proofreading:started',
  GPT_PROOFREADING_COMPLETED: 'gpt:proofreading:completed',
  GPT_PROOFREADING_FAILED: 'gpt:proofreading:failed',
  GPT_EDITING_STARTED: 'gpt:editing:started',
  GPT_EDITING_COMPLETED: 'gpt:editing:completed',
  GPT_EDITING_FAILED: 'gpt:editing:failed',
  
  // System events
  INITIALIZATION_COMPLETE: 'initialization:complete',
  INITIALIZATION_ERROR: 'initialization:error',
  ERROR_OCCURRED: 'error:occurred'
};