/**
 * Site Detection Module
 * Detects the current site and returns the appropriate handler
 */

import { SITE_TYPES } from '../constants.js';
import * as SystemExeHandler from './systemexe.js';
import * as AIChatHandler from './ai-chat.js';
import * as TwitterHandler from './twitter.js';
import * as DefaultHandler from './default.js';

/**
 * Detects the current site type
 * @returns {string} Site type
 */
export function detectSiteType() {
    // System.exe Research and Development site
    if (window.location.hostname.includes('systemexe-research-and-development.com')) {
        return SITE_TYPES.SYSTEMEXE;
    }
    
    // x.com (Twitter) site
    if (window.location.hostname.includes('twitter.com') ||
        window.location.hostname.includes('x.com')) {
        return SITE_TYPES.TWITTER;
    }
    
    // Detect AI chat site characteristics
    const aiChatSelectors = [
        // OpenAI ChatGPT
        'form.stretch button.absolute',
        'button[data-testid="send-button"]',
        // Claude
        'button[aria-label="Send message"]',
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
        // Common AI chat
        'button.chat-submit',
        'button.ai-submit-button',
        'button.ai-chat-send'
    ];
    
    for (const selector of aiChatSelectors) {
        if (document.querySelector(selector)) {
            return SITE_TYPES.AI_CHAT;
        }
    }
    
    // Look for buttons with specific SVG patterns (like paper airplane icons)
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
        // Check if it has paper airplane SVG pattern
        const svg = button.querySelector('svg');
        if (svg) {
            const hasLine = svg.querySelector('line[x1="22"][y1="2"][x2="11"][y2="13"]');
            const hasPolygon = svg.querySelector('polygon[points="22 2 15 22 11 13 2 9 22 2"]');

            if (hasLine && hasPolygon) {
                return SITE_TYPES.AI_CHAT;
            }
        }
    }
    
    return SITE_TYPES.DEFAULT;
}

/**
 * Gets the appropriate handler for the current site
 * @returns {Object} Site handler
 */
export function getSiteHandler() {
    const siteType = detectSiteType();
    
    switch (siteType) {
        case SITE_TYPES.SYSTEMEXE:
            console.log('Using SystemExe site handler');
            return SystemExeHandler;
        case SITE_TYPES.TWITTER:
            console.log('Using x.com (Twitter) site handler');
            return TwitterHandler;
        case SITE_TYPES.AI_CHAT:
            console.log('Using AI Chat site handler');
            return AIChatHandler;
        default:
            console.log('Using Default site handler');
            return DefaultHandler;
    }
}