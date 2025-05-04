
/**
 * Content Script - Main Entry Point
 * Initializes the extension and coordinates module interactions
 */

import { setupDOMObserver } from './modules/dom-observer.js';
import { loadSettings } from './modules/settings.js';
import { createUI, setupEventListeners } from './modules/ui.js';
import { loadMenuState, updateMenuState, initInputHandler } from './modules/input-handler.js';
import { MENU_ICON } from './icons.js';
import { isInputElement } from './modules/utils.js';
import { detectSiteType } from './site-handlers/site-detector.js';
import { initializeState, setState, getState } from './modules/state.js';
import { initSpeechEvents } from './modules/speech.js';
import { publish, subscribe, EVENTS } from './modules/event-bus.js';

// Initialize state with default values
// This will be properly set by the state module during initialization
setState({
  lastRecognizedText: '',
  currentInputElement: null,
  lastClickedInput: null,
  appendMode: false,
  isListening: false,
  isEditing: false
});

// Store MENU_ICON in state instead of window
setState('MENU_ICON', MENU_ICON);

// Make essential functions available for legacy code that might still use window
// These will be gradually phased out as modules are updated to use event bus
window.isInputElement = isInputElement;
window.detectSiteType = detectSiteType;

/**
 * Initialize voice input functionality
 * @returns {Promise<void>} Promise resolved when initialization is complete
 */
export async function initVoiceInput() {
    console.log(chrome.i18n.getMessage('logInitializing', '3.1'));

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error(chrome.i18n.getMessage('logSpeechNotSupported'));
        alert(chrome.i18n.getMessage('alertSpeechNotSupported'));
        return;
    }

    // Load menu state
    await loadMenuState();
    
    // Create UI elements (only if they don't already exist)
    if (!document.getElementById('otak-voice-menu-btn')) {
        console.log('Creating UI elements');
        createUI();
        setupEventListeners();
        updateMenuState();
    } else {
        console.log(chrome.i18n.getMessage('logUiAlreadyExists'));
        updateMenuState();
    }

    console.log(chrome.i18n.getMessage('logInitializationComplete', '3.1'));
}

/**
 * Set up periodic self-healing to ensure UI elements exist
 * This helps recover from SPA navigation or DOM changes that might remove our UI
 */
function setupPeriodicSelfHealing() {
    setInterval(() => {
        const menuButton = document.getElementById('otak-voice-menu-btn');
        if (!menuButton) {
            console.warn(chrome.i18n.getMessage('logUiNotFoundHealing'));
            // Publish event to notify about UI recovery
            publish(EVENTS.UI_RECOVERY_NEEDED);
            // Directly call initVoiceInput for backward compatibility
            initVoiceInput();
        }
    }, 10000);
}

/**
 * Main initialization function
 * Sets up all modules in the correct order
 */
async function runInitialization() {
    try {
        // Initialize state management first
        initializeState();
        
        // Set up event subscriptions
        setupEventSubscriptions();
        
        // Initialize speech event subscriptions after state is initialized
        initSpeechEvents();
        
        // Load settings from storage
        await loadSettings();
        
        // Initialize input handler
        await initInputHandler();
        
        // Initialize voice input UI and functionality
        await initVoiceInput();
        
        // Start SPA support monitoring
        setupDOMObserver();
        
        // Start self-healing functionality
        setupPeriodicSelfHealing();

        console.log(chrome.i18n.getMessage('logExtensionLoaded'));
        
        // Publish initialization complete event
        publish(EVENTS.INITIALIZATION_COMPLETE);
    } catch (error) {
        console.error('Initialization error:', error);
        // Publish initialization error event
        publish(EVENTS.INITIALIZATION_ERROR, error);
    }
}

/**
 * Set up event subscriptions for content.js
 */
function setupEventSubscriptions() {
    // Subscribe to proofreading events
    subscribe(EVENTS.GPT_PROOFREADING_STARTED, () => {
        console.log('Proofreading started via event bus');
    });
    
    // Subscribe to speech recognition events
    subscribe(EVENTS.SPEECH_RECOGNITION_STARTED, () => {
        console.log('Speech recognition started via event bus');
    });
    
    // Subscribe to speech recognition stopped events
    subscribe(EVENTS.SPEECH_RECOGNITION_STOPPED, () => {
        console.log('Speech recognition stopped via event bus');
    });
    
    // Subscribe to settings loaded events
    subscribe(EVENTS.SETTINGS_LOADED, (settings) => {
        console.log('Settings loaded via event bus');
    });
}

// Execute extension initialization
runInitialization();