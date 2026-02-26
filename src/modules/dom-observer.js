
/**
 * DOM Observer Module
 * Monitors DOM changes to support Single Page Applications (SPAs)
 * and ensure extension functionality persists across page transitions
 */

import { enhanceInputElementHandlers } from './input-handler.js';
import { publish, subscribe, EVENTS } from './event-bus.js';

/** Interval for periodic UI presence check (ms) */
const PERIODIC_CHECK_INTERVAL_MS = 5000;

/**
 * Set up DOM observer to monitor page changes
 */
export function setupDOMObserver() {
    console.log(chrome.i18n.getMessage('logDomObserverStart'));

    // Set up event subscriptions
    setupEventSubscriptions();

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const textareas = node.querySelectorAll('textarea');
                        if (textareas.length > 0) {
                            console.log(chrome.i18n.getMessage('logSpaNavigationDetected'), textareas);

                            const voiceMenuBtn = document.getElementById('otak-voice-menu-btn');
                            if (!voiceMenuBtn) {
                                console.log(chrome.i18n.getMessage('logSpaUiReinit'));
                                // Publish event for UI reinit
                                publish(EVENTS.UI_RECOVERY_NEEDED);
                                publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
                            } else {
                                console.log('Page transition detected: Reapplying menu state');
                                // Publish event for menu state update
                                publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
                            }

                            try {
                                // Publish event for input handlers enhancement
                                publish(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
                                // Call directly for backward compatibility
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
                            break;
                        }
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Periodic check for UI presence and functionality
    const periodicCheckId = setInterval(() => {
        const voiceMenuBtn = document.getElementById('otak-voice-menu-btn');
        if (!voiceMenuBtn) {
            console.log(chrome.i18n.getMessage('logPollingUiNotFound'));
            // Publish event for UI recovery
            publish(EVENTS.UI_RECOVERY_NEEDED);
            publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
        } else {
            console.log('Periodic check: Reapplying menu state');
            // Publish event for menu state update
            publish(EVENTS.MENU_STATE_UPDATE_NEEDED);
        }

        try {
            // Publish event for input handlers enhancement
            publish(EVENTS.INPUT_HANDLERS_UPDATE_NEEDED);
            // Call directly for backward compatibility
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
 * Set up event subscriptions for DOM observer
 */
function setupEventSubscriptions() {
    // Event subscriptions are handled by their respective modules:
    // - MENU_STATE_UPDATE_NEEDED: handled by input-handler.js
    // - INPUT_HANDLERS_UPDATE_NEEDED: handled by input-handler.js
    // - UI_RECOVERY_NEEDED: handled by content.js
}