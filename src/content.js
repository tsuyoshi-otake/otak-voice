
/**
 * Content Script - Main Entry Point
 * Initializes the extension and coordinates module interactions
 */

import { setupDOMObserver } from './modules/dom-observer.js';
import { loadSettings } from './modules/settings.js';
import { createUI, setupEventListeners } from './modules/ui.js';
import { loadMenuState, updateMenuState, initInputHandler } from './modules/input-handler.js';
import { MENU_ICON } from './icons.js';
import { initializeState, setState, getState } from './modules/state.js';
import { initSpeechEvents } from './modules/speech.js';
import { publish, subscribe, EVENTS } from './modules/event-bus.js';

/** Interval for self-healing UI recovery check (ms) */
const SELF_HEALING_INTERVAL_MS = 10000;

/** Self-healing interval ID (prevents accumulation on re-initialization) */
let selfHealingIntervalId = null;

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
export function setupPeriodicSelfHealing() {
    if (selfHealingIntervalId) clearInterval(selfHealingIntervalId);
    selfHealingIntervalId = setInterval(() => {
        const menuButton = document.getElementById('otak-voice-menu-btn');
        if (!menuButton) {
            console.warn(chrome.i18n.getMessage('logUiNotFoundHealing'));
            // UI_RECOVERY_NEEDED subscriber already calls initVoiceInput
            publish(EVENTS.UI_RECOVERY_NEEDED);
        }
    }, SELF_HEALING_INTERVAL_MS);
}

/**
 * Main initialization function
 * Sets up all modules in the correct order
 */
export async function runInitialization() {
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

/** Stored unsubscribe functions for content.js event subscriptions */
let contentUnsubscribeFunctions = [];

/**
 * Set up event subscriptions for content.js
 */
export function setupEventSubscriptions() {
    // Unsubscribe all previous subscriptions to prevent accumulation
    contentUnsubscribeFunctions.forEach(unsub => unsub());
    contentUnsubscribeFunctions = [];

    // Subscribe to proofreading events
    contentUnsubscribeFunctions.push(subscribe(EVENTS.GPT_PROOFREADING_STARTED, () => {
        console.log('Proofreading started via event bus');
    }));

    // Subscribe to speech recognition events
    contentUnsubscribeFunctions.push(subscribe(EVENTS.SPEECH_RECOGNITION_STARTED, () => {
        console.log('Speech recognition started via event bus');
    }));

    // Subscribe to speech recognition stopped events
    contentUnsubscribeFunctions.push(subscribe(EVENTS.SPEECH_RECOGNITION_STOPPED, () => {
        console.log('Speech recognition stopped via event bus');
    }));

    // Subscribe to settings loaded events
    contentUnsubscribeFunctions.push(subscribe(EVENTS.SETTINGS_LOADED, (settings) => {
        console.log('Settings loaded via event bus');
    }));

    // Subscribe to UI recovery events
    contentUnsubscribeFunctions.push(subscribe(EVENTS.UI_RECOVERY_NEEDED, () => {
        console.log('UI recovery needed via event bus');
        initVoiceInput();
    }));
}

// Execute extension initialization
runInitialization();