/**
 * Site Detection Module
 * Detects the current site and returns the appropriate handler
 */

import { SITE_TYPES, PAPER_PLANE_SVG } from '../constants.js';
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
        if (hasPaperPlaneSVG(button.querySelector('svg'))) {
            return SITE_TYPES.AI_CHAT;
        }
    }
    
    return SITE_TYPES.DEFAULT;
}

/**
 * Checks if an SVG element matches the paper airplane icon pattern
 * @param {Element} svgElement - SVG element to check
 * @returns {boolean} true if paper airplane pattern found
 */
export function hasPaperPlaneSVG(svgElement) {
    if (!svgElement) return false;
    const hasLine = svgElement.querySelector(PAPER_PLANE_SVG.LINE_SELECTOR);
    const hasPolygon = svgElement.querySelector(PAPER_PLANE_SVG.POLYGON_SELECTOR);
    return !!(hasLine && hasPolygon);
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