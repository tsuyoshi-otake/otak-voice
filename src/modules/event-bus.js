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

/**
 * Publish a STATUS_UPDATED event (convenience wrapper to avoid circular deps)
 * @param {string} messageKey - i18n key for the status message
 * @param {string|undefined} substitutions - Optional substitution string
 * @param {boolean} persistent - Whether to display persistently
 */
export function publishStatus(messageKey, substitutions, persistent = false) {
  publish(EVENTS.STATUS_UPDATED, { messageKey, substitutions, persistent });
}

/**
 * Standard event names used throughout the application.
 * Grouped by category with namespace pattern: 'category:subcategory:action'
 *
 * Usage: import { EVENTS } from './event-bus.js';
 *        publish(EVENTS.MENU_TOGGLED, data);
 *        subscribe(EVENTS.MENU_TOGGLED, handler);
 *
 * @readonly
 * @enum {string}
 */
export const EVENTS = {
  // --- UI events ---
  /** Fired when menu is expanded/collapsed. Data: { expanded: boolean } */
  MENU_TOGGLED: 'menu:toggled',
  /** Fired when settings modal open/close is requested */
  SETTINGS_MODAL_TOGGLED: 'settings:modal:toggled',
  /** Fired when append mode is toggled. Data: { enabled: boolean } */
  APPEND_MODE_TOGGLED: 'append:mode:toggled',
  /** Fired when auto-submit toggle is clicked */
  AUTO_SUBMIT_TOGGLED: 'auto:submit:toggled',
  /** Fired when auto-submit state changes. Data: { enabled: boolean } */
  AUTO_SUBMIT_STATE_CHANGED: 'auto:submit:state:changed',
  /** Fired when processing state changes. Data: { state: PROCESSING_STATE } */
  PROCESSING_STATE_CHANGED: 'processing:state:changed',
  /** Fired to update status message. Data: { messageKey, substitutions, persistent } */
  STATUS_UPDATED: 'status:updated',
  /** Fired when modal visibility is toggled */
  MODAL_VISIBILITY_TOGGLED: 'modal:visibility:toggled',
  /** Fired when recognition modal content is updated. Data: { text, isInitial } */
  RECOGNITION_MODAL_UPDATED: 'recognition:modal:updated',
  /** Fired when recognition modal is shown */
  RECOGNITION_MODAL_SHOWN: 'recognition:modal:shown',
  /** Fired when UI needs to be re-created (e.g. SPA navigation) */
  UI_RECOVERY_NEEDED: 'ui:recovery:needed',
  /** Fired when menu state needs to be reapplied */
  MENU_STATE_UPDATE_NEEDED: 'menu:state:update:needed',

  // --- Input events ---
  /** Fired when input field is cleared */
  INPUT_CLEARED: 'input:cleared',
  /** Fired when a suitable input field is found. Data: { element } */
  INPUT_FIELD_FOUND: 'input:field:found',
  /** Fired when user clicks an input field. Data: { element } */
  INPUT_FIELD_CLICKED: 'input:field:clicked',
  /** Fired when input handlers need to be re-applied */
  INPUT_HANDLERS_UPDATE_NEEDED: 'input:handlers:update:needed',

  // --- Speech events ---
  /** Fired when speech recognition starts */
  SPEECH_RECOGNITION_STARTED: 'speech:recognition:started',
  /** Fired when speech recognition stops */
  SPEECH_RECOGNITION_STOPPED: 'speech:recognition:stopped',
  /** Fired with speech result. Data: { final, text, append } */
  SPEECH_RECOGNITION_RESULT: 'speech:recognition:result',
  /** Fired when mic button is clicked */
  MIC_BUTTON_CLICKED: 'mic:button:clicked',

  // --- Settings events ---
  /** Fired after settings are saved. Data: settings object */
  SETTINGS_SAVED: 'settings:saved',
  /** Fired after settings are loaded from storage. Data: settings object */
  SETTINGS_LOADED: 'settings:loaded',
  /** Fired when API key is updated. Data: { apiKey } */
  API_KEY_UPDATED: 'api:key:updated',
  /** Fired when recognition language changes. Data: { lang } */
  LANGUAGE_UPDATED: 'language:updated',
  /** Fired when theme is toggled. Data: { theme } */
  THEME_TOGGLED: 'theme:toggled',

  // --- History events ---
  /** Fired when new entry is added to history. Data: { text, timestamp } */
  HISTORY_ADDED: 'history:added',
  /** Fired when history panel visibility is toggled */
  HISTORY_PANEL_TOGGLED: 'history:panel:toggled',

  // --- GPT events ---
  /** Fired when GPT auto-correction starts */
  GPT_CORRECTION_STARTED: 'gpt:correction:started',
  /** Fired when GPT auto-correction completes. Data: { text } */
  GPT_CORRECTION_COMPLETED: 'gpt:correction:completed',
  /** Fired when GPT auto-correction fails. Data: { error } */
  GPT_CORRECTION_FAILED: 'gpt:correction:failed',
  /** Fired when GPT proofreading starts */
  GPT_PROOFREADING_STARTED: 'gpt:proofreading:started',
  /** Fired when GPT proofreading completes. Data: { text } */
  GPT_PROOFREADING_COMPLETED: 'gpt:proofreading:completed',
  /** Fired when GPT proofreading fails. Data: { error } */
  GPT_PROOFREADING_FAILED: 'gpt:proofreading:failed',
  /** Fired when GPT editing starts */
  GPT_EDITING_STARTED: 'gpt:editing:started',
  /** Fired when GPT editing completes. Data: { text } */
  GPT_EDITING_COMPLETED: 'gpt:editing:completed',
  /** Fired when GPT editing fails. Data: { error } */
  GPT_EDITING_FAILED: 'gpt:editing:failed',

  // --- System events ---
  /** Fired when extension initialization is complete */
  INITIALIZATION_COMPLETE: 'initialization:complete',
  /** Fired when extension initialization fails. Data: { error } */
  INITIALIZATION_ERROR: 'initialization:error',
  /** Fired when any error occurs. Data: { source, message, error } */
  ERROR_OCCURRED: 'error:occurred'
};