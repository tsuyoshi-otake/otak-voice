
/**
 * DOM Observer Module
 * Monitors DOM changes to support Single Page Applications (SPAs)
 * and ensure extension functionality persists across page transitions
 */

import { enhanceInputElementHandlers } from './input-handler.js';
import { publish, EVENTS } from './event-bus.js';

/** Interval for periodic UI presence check (ms) */
const PERIODIC_CHECK_INTERVAL_MS = 5000;

/** Debounce delay for MutationObserver callback (ms) */
const MUTATION_DEBOUNCE_MS = 300;

/** Previous observer and interval references for cleanup on re-initialization */
let previousObserver = null;
let previousIntervalId = null;

/**
 * Set up DOM observer to monitor page changes
 */
export function setupDOMObserver() {
    // Clean up previous observer and interval to prevent accumulation
    if (previousObserver) { previousObserver.disconnect(); previousObserver = null; }
    if (previousIntervalId) { clearInterval(previousIntervalId); previousIntervalId = null; }

    console.log(chrome.i18n.getMessage('logDomObserverStart'));

    // Set up event subscriptions
    setupEventSubscriptions();

    let debounceTimer = null;

    const observer = new MutationObserver((mutations) => {
        // Check if any mutation contains new textarea elements before debouncing
        let hasNewTextareas = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const textareas = node.querySelectorAll('textarea');
                        if (textareas.length > 0) {
                            hasNewTextareas = true;
                            break;
                        }
                    }
                }
            }
            if (hasNewTextareas) break;
        }

        if (!hasNewTextareas) return;

        // Debounce rapid mutations (e.g., SPA framework rendering)
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            handleDOMMutation();
        }, MUTATION_DEBOUNCE_MS);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    previousObserver = observer;

    // Periodic check for UI presence and functionality
    previousIntervalId = setInterval(() => {
        const voiceMenuBtn = document.getElementById('otak-voice-menu-btn');
        if (!voiceMenuBtn) {
            console.log(chrome.i18n.getMessage('logPollingUiNotFound'));
            publish(EVENTS.UI_RECOVERY_NEEDED);
            publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
        }

        try {
            publish(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
            enhanceInputElementHandlers();
        } catch (error) {
            if (error.message.includes("Extension context invalidated")) {
                // Ignore extension context invalidated errors
            } else {
                console.error('Error enhancing input handlers in interval:', error);
                publish(EVENTS.ERROR_OCCURRED, {
                    source: 'dom-observer',
                    message: 'Error enhancing input handlers in interval',
                    error
                });
            }
        }
    }, PERIODIC_CHECK_INTERVAL_MS);
}

/**
 * Handle DOM mutations that include new textarea elements.
 * Called after debounce to avoid rapid-fire processing during SPA renders.
 */
function handleDOMMutation() {
    const voiceMenuBtn = document.getElementById('otak-voice-menu-btn');
    if (!voiceMenuBtn) {
        console.log(chrome.i18n.getMessage('logSpaUiReinit'));
        publish(EVENTS.UI_RECOVERY_NEEDED);
        publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
    } else {
        console.log('Page transition detected: Reapplying menu state');
        publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
    }

    try {
        publish(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
        enhanceInputElementHandlers();
    } catch (error) {
        if (error.message.includes("Extension context invalidated")) {
            // Ignore extension context invalidated errors
        } else {
            console.error('Error enhancing input handlers after SPA navigation:', error);
            publish(EVENTS.ERROR_OCCURRED, {
                source: 'dom-observer',
                message: 'Error enhancing input handlers after SPA navigation',
                error
            });
        }
    }
}

/**
 * Set up event subscriptions for DOM observer
 */
function setupEventSubscriptions() {
    // Event subscriptions are handled by their respective modules:
    // - MENU_STATE_UPDATE_NEEDED: handled by input-handler.js
    // - INPUT_HANDLERS_UPDATE_NEEDED: handled by input-handler.js
    // - UI_RECOVERY_NEEDED: handled by content.js
}