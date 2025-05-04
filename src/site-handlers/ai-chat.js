/**
 * AI Chat Site Handler
 * Provides processing for chat sites like ChatGPT, Claude, Gemini, etc.
 */

import { showStatus } from '../modules/ui.js';
import { retryInputEvents } from '../modules/utils.js';

/**
 * Detects buttons with paper airplane SVG icons
 * @returns {Element|null} Detected button or null
 */
export function findPaperPlaneButton() {
    // Look for buttons with specific SVG patterns
    const allButtons = document.querySelectorAll('button');

    for (const button of allButtons) {
        // Check if it has this specific SVG pattern (combination of line and polygon)
        const svg = button.querySelector('svg');
        if (svg) {
            const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
            const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');

            if (hasLine && hasPolygon) {
                console.log(chrome.i18n.getMessage('logPaperPlaneButtonFound'));
                return button;
            }
        }

        // Determine by class
        if (button.classList.contains('bg-primary/40') &&
            button.getAttribute('type') === 'submit') {
            const svg = button.querySelector('svg');
            if (svg) {
                console.log(chrome.i18n.getMessage('logBgPrimaryButtonFound'));
                return button;
            }
        }
    }

    return null;
}

/**
 * Detects submit buttons specific to AI chat interfaces
 * @returns {Element|null} Detected button or null
 */
export function findAIChatSubmitButton() {
    // Look for elements specific to AI chat
    const aiChatSelectors = [
        // OpenAI ChatGPT
        'form.stretch button.absolute',
        'button[data-testid="send-button"]',
        // Claude (英語と日本語)
        'button[aria-label="Send message"]',
        'button[aria-label="メッセージを送信"]',
        '.claude-submit-button',
        // Bard / Gemini
        'button[aria-label="Send"]',
        'button.send-button',
        // Bing Chat
        'button.submit-button',
        'button.chat-send-button',
        // Perplexity
        'button.send-message-button',
        // System.exe Research and Development
        '#buttonSubmitMessageConversation',
        '.buttonSubmitMessageConversation',
        // Button with paper airplane SVG icon
        'button[type="submit"] svg[viewBox="0 0 24 24"]',
        // Claude.ai上向き矢印アイコン
        'button svg[viewBox="0 0 256 256"]',
        // Claude.ai特有のクラス名
        'button.bg-accent-main-000',
        // Claude.ai送信ボタン（直接入力の場合）
        'button[aria-label="Send message"]',
        'button[aria-label="メッセージを送信"]',
        // Common AI chat
        'button.chat-submit',
        'button.ai-submit-button',
        'button.ai-chat-send'
    ];

    // Search with all selectors
    for (const selector of aiChatSelectors) {
        const buttons = document.querySelectorAll(selector);
        if (buttons.length > 0) {
            // Filter only visible buttons
            const visibleButtons = Array.from(buttons).filter(button => {
                const style = window.getComputedStyle(button);
                const rect = button.getBoundingClientRect();

                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       style.opacity !== '0' &&
                       rect.width > 0 &&
                       rect.height > 0;
            });

            if (visibleButtons.length > 0) {
                return visibleButtons[0]; // Return the first visible button
            }
        }
    }

    // Look for buttons with special icons
    const iconButtons = document.querySelectorAll('button');
    for (const button of iconButtons) {
        // Check elements that might contain send icons
        const hasSendIcon = button.querySelector('svg, i.fa-paper-plane, i.fa-send, i.fa-arrow, img[src*="send"]');
        if (hasSendIcon) {
            const rect = button.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                // Check if the button is positioned in the lower part of the screen
                if (rect.top > window.innerHeight * 0.5) {
                    return button;
                }
            }
        }
    }

    return null;
}

/**
 * Checks if a button is in a disabled state
 * @param {Element} button - Button element to check
 * @returns {boolean} true if disabled
 */
function isButtonDisabled(button) {
    return button.disabled ||
           button.getAttribute('aria-disabled') === 'true' ||
           button.classList.contains('disabled') ||
           button.classList.contains('cursor-not-allowed') ||
           button.classList.contains('opacity-50') ||
           getComputedStyle(button).opacity < '0.9';
}

/**
 * Performs auto-submit after voice input
 * @returns {boolean} true if submission process started
 */
export function submitAfterVoiceInput() {
    // Wait a bit before checking button state (for React state updates)
    setTimeout(() => {
        // Look for specific paper airplane icon buttons with highest priority
        const paperPlaneButton = findPaperPlaneButton();
        if (paperPlaneButton) {
            // Check if button is disabled
            if (isButtonDisabled(paperPlaneButton)) {
                console.log(chrome.i18n.getMessage('logPaperPlaneButtonDisabled'));

                // Get current text input field and fire events again
                if (typeof retryInputEvents === 'function') {
                    retryInputEvents();
                }
                return;
            }

            // Highlight button
            const originalBackgroundColor = paperPlaneButton.style.backgroundColor;
            paperPlaneButton.style.backgroundColor = '#4CAF50';

            // Wait a bit before submitting
            setTimeout(() => {
                paperPlaneButton.style.backgroundColor = originalBackgroundColor;
                paperPlaneButton.click();
                
                // Display status
                if (typeof showStatus === 'function') {
                    showStatus('statusSubmitClicked');
                }
            }, 300);
            return;
        }

        // If no paper airplane button, look for normal AI chat submit button
        const submitButton = findAIChatSubmitButton();

        if (submitButton) {
            // Check if button is disabled
            if (isButtonDisabled(submitButton)) {
                console.log(chrome.i18n.getMessage('logSubmitButtonDisabled'));

                // Trigger events again to encourage React state update
                if (typeof retryInputEvents === 'function') {
                    retryInputEvents();
                }
                return;
            }

            // Highlight button
            const originalBackgroundColor = submitButton.style.backgroundColor;
            submitButton.style.backgroundColor = '#4CAF50';

            // Wait a bit before submitting
            setTimeout(() => {
                submitButton.style.backgroundColor = originalBackgroundColor;
                submitButton.click();
                
                // Display status
                if (typeof showStatus === 'function') {
                    showStatus('statusSubmitClicked');
                }
            }, 300);
        } else {
            // Fall back to general submit button search
            // Call default handler processing
            if (window.DefaultHandler && typeof window.DefaultHandler.submitAfterVoiceInput === 'function') {
                window.DefaultHandler.submitAfterVoiceInput();
            }
        }
    }, 500); // 初期待機時間
    
    return true; // Indicate that processing has started
}

/**
 * Finds the submit button related to the input field
 * @param {Element} inputElement - Input element
 * @returns {Element|null} Submit button element or null
 */
export function findSubmitButtonForInput(inputElement) {
    // Look for paper airplane button with highest priority
    const paperPlaneButton = findPaperPlaneButton();
    if (paperPlaneButton) {
        return paperPlaneButton;
    }
    
    // Look for AI chat submit button
    const aiChatButton = findAIChatSubmitButton();
    if (aiChatButton) {
        return aiChatButton;
    }
    
    // Fall back to general button search
    // This part uses the same implementation as the default handler
    return null;
}