/**
 * System.exe Research and Development Site Handler
 * Provides System.exe-specific processing
 */

import { showStatus } from '../modules/ui.js';
import { retryInputEvents } from '../modules/utils.js';
import {
  findElement,
  findAllElements,
  isButtonDisabled,
  clickButtonWithFeedback,
  isElementVisible
} from '../modules/dom-utils.js';
import { publish, EVENTS } from '../modules/event-bus.js';

/**
 * Searches for System.exe-specific submit button
 * @returns {Element|null} Submit button element or null
 */
export function findSubmitButton() {
    // System.exe site-specific button detection (using the abstraction layer)
    const systemExeButton = findElement('#buttonSubmitMessageConversation');
    if (systemExeButton) {
        return systemExeButton;
    }
    
    // Also search by class name (using the abstraction layer)
    const systemExeButtons = findAllElements('.buttonSubmitMessageConversation');
    if (systemExeButtons.length > 0) {
        return systemExeButtons[0];
    }
    
    // Look for paper airplane SVG button (common in newer System.exe interfaces)
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
        // Check if it has paper airplane SVG pattern
        const svg = button.querySelector('svg');
        if (svg) {
            const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
            const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');

            if (hasLine && hasPolygon) {
                console.log('Found paper airplane SVG button in System.exe site');
                return button;
            }
        }
    }
    
    // Also look for parent div with cursor-not-allowed class that contains the SVG
    const cursorNotAllowedDivs = document.querySelectorAll('div.cursor-not-allowed');
    for (const div of cursorNotAllowedDivs) {
        const svg = div.querySelector('svg');
        if (svg) {
            const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
            const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');

            if (hasLine && hasPolygon) {
                console.log('Found paper airplane SVG in cursor-not-allowed div');
                // Return the div itself as the button
                return div;
            }
        }
    }
    
    return null;
}

/**
 * Performs auto-submit after voice input
 * @returns {boolean} true if submission process started
 */
export function submitAfterVoiceInput() {
    const submitButton = findSubmitButton();
    
    if (submitButton) {
        // Special handling for cursor-not-allowed div with opacity: 1
        if (submitButton.classList.contains('cursor-not-allowed')) {
            const style = window.getComputedStyle(submitButton);
            if (style.opacity === '1') {
                // The button is actually enabled despite the cursor-not-allowed class
                console.log('Found enabled button with cursor-not-allowed class');
                
                // If it's a div containing an SVG, click the SVG directly
                const svg = submitButton.querySelector('svg');
                if (svg) {
                    console.log('Clicking SVG inside cursor-not-allowed div');
                    svg.click();
                    return true;
                }
                
                // Otherwise click the div itself
                submitButton.click();
                return true;
            }
        }
        
        // Standard disabled check
        if (isButtonDisabled(submitButton)) {
            console.log(chrome.i18n.getMessage('logSubmitButtonDisabled'));
            
            // Trigger events again to encourage React state update
            if (typeof retryInputEvents === 'function') {
                retryInputEvents();
            }
            
            return false;
        }

        // Use the abstraction layer to click the button with feedback
        clickButtonWithFeedback(submitButton);
        return true;
    }
    
    return false;
}

/**
 * Finds the submit button related to the input field
 * @param {Element} inputElement - Input element
 * @returns {Element|null} Submit button element or null
 */
export function findSubmitButtonForInput(inputElement) {
    // Prioritize finding System.exe site-specific button
    const systemExeButton = findSubmitButton();
    if (systemExeButton) {
        return systemExeButton;
    }
    
    // Fall back to general button search
    // This part uses the same implementation as the default handler
    return null;
}

/**
 * Finds the best input field on System.exe Research and Development site
 * @returns {Element|null} Best input field element or null
 */
export function findBestInputField() {
    // System.exe site-specific input field detection (using the abstraction layer)
    const textareas = findAllElements('textarea');
    
    // Look for the main message input textarea
    for (const textarea of textareas) {
        // Check for specific attributes or classes that identify the main input field
        if (textarea.id === 'messageInput' ||
            textarea.classList.contains('messageInput') ||
            textarea.placeholder?.includes('メッセージを入力') ||
            textarea.placeholder?.includes('Enter message')) {
            return textarea;
        }
    }
    
    // If no specific textarea found, look for any visible textarea
    for (const textarea of textareas) {
        if (isElementVisible(textarea)) {
            return textarea;
        }
    }
    
    return null;
}

/**
 * Checks if current page is a System.exe site
 * @returns {boolean} true if current page is a System.exe site
 */
export function isSystemExePage() {
    const hostname = window.location.hostname;
    return hostname.includes('systemexe') ||
           hostname.includes('system.exe') ||
           document.title.includes('System.exe');
}