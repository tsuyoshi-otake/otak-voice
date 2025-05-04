/**
 * History Management Module
 * Manages voice input history
 */

import { MAX_HISTORY } from '../constants.js';
import { publish, subscribe, EVENTS } from './event-bus.js';
import { getState } from './state.js';

// Voice input history (maximum 10 entries)
export let voiceHistory = [];

// Set up event subscriptions
setupEventSubscriptions();

/**
 * Set up event subscriptions for history module
 */
function setupEventSubscriptions() {
    // Subscribe to history panel toggle events
    subscribe(EVENTS.HISTORY_PANEL_TOGGLED, () => {
        toggleHistoryPanel();
    });
    
    // Subscribe to history added events
    subscribe(EVENTS.HISTORY_ADDED, (text) => {
        addToHistory(text);
    });
}

/**
 * Add to voice input history
 * @param {string} text - Text to add
 */
export function addToHistory(text) {
    if (!text || text.trim() === '') return;

    // 重複チェック - 直前の履歴と同じ内容なら追加しない
    if (voiceHistory.length > 0 && voiceHistory[voiceHistory.length - 1].text === text) {
        return;
    }

    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    voiceHistory.push({
        text: text,
        timestamp: timestamp
    });

    // Remove oldest entries if history exceeds maximum size
    if (voiceHistory.length > MAX_HISTORY) {
        voiceHistory.shift();
    }

    // Update history panel if it's visible
    const panel = document.querySelector('.otak-voice-history');
    if (panel && getComputedStyle(panel).display !== 'none') {
        updateHistoryPanel();
    }
    
    // 無限ループを防ぐため、ここでのイベント発行を削除
}

/**
 * Update history panel
 */
export function updateHistoryPanel() {
    const panel = document.querySelector('.otak-voice-history');
    if (!panel) return;

    // Clear previous history content (keep the title)
    const titleElement = panel.firstChild;
    panel.innerHTML = '';
    if (titleElement) panel.appendChild(titleElement); // Only add if titleElement exists

    // If there's no history
    if (voiceHistory.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.textContent = chrome.i18n.getMessage('historyPanelEmpty');
        emptyMsg.style.color = '#888';
        emptyMsg.style.padding = '10px 4px';
        emptyMsg.style.fontSize = '13px';
        panel.appendChild(emptyMsg);
        return;
    }

    // Display history (newest first)
    [...voiceHistory].reverse().forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'otak-voice-history__item';

        const timeElem = document.createElement('div');
        timeElem.className = 'otak-voice-history__time';
        timeElem.textContent = item.timestamp;

        const textElem = document.createElement('div');
        textElem.className = 'otak-voice-history__text';
        textElem.textContent = item.text;

        historyItem.appendChild(timeElem);
        historyItem.appendChild(textElem);
        panel.appendChild(historyItem);
    });
}

/**
 * Toggle history panel display
 */
export function toggleHistoryPanel() {
    const panel = document.querySelector('.otak-voice-history');
    if (!panel) return;

    const currentDisplay = getComputedStyle(panel).display;

    if (currentDisplay === 'none') {
        updateHistoryPanel();
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
}