/**
 * UI Settings Modal Module
 * Responsible for creating and managing the settings modal
 */
import { THEME_MODES } from '../constants.js';
import { getState } from './state.js';
import { saveSetting } from './settings.js';
import { updateAutoDetectTooltip, updateAutoCorrectionTooltip, updateUseHistoryContextTooltip } from './ui-tooltips.js';

/** Toggle settings modal display */
export function toggleSettingsModal() {
    const modal = document.getElementById('otak-voice-settings-modal');
    if (!modal) return;
    const currentDisplay = modal.style.display || 'none';
    modal.style.display = currentDisplay === 'none' ? 'block' : 'none';
    if (currentDisplay === 'none') { updateSettingsModalValues(); }
}

/** Updates settings modal values to the latest state */
export function updateSettingsModalValues() {
    const apiKeyInput = document.getElementById('api-key-input');
    const langSelect = document.getElementById('recognition-lang-select');
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    const themeSelect = document.getElementById('theme-select');
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
    const silenceTimeoutInput = document.getElementById('silence-timeout-input');
    const apiKey = getState('apiKey');
    const recognitionLang = getState('recognitionLang');
    const autoDetectInputFields = getState('autoDetectInputFields');
    const autoCorrection = getState('autoCorrection');
    const useHistoryContext = getState('useHistoryContext');
    const themeMode = getState('themeMode');
    const showModalWindow = getState('showModalWindow');
    const autoSubmit = getState('autoSubmit');
    const silenceTimeout = getState('silenceTimeout') || 3000;
    if (apiKeyInput) apiKeyInput.value = apiKey || '';
    if (langSelect) langSelect.value = recognitionLang || 'ja-JP';
    if (autoDetectCheckbox) {
        autoDetectCheckbox.checked = autoDetectInputFields === true;
        updateAutoDetectTooltip();
    }
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    if (autoCorrectionCheckbox) {
        autoCorrectionCheckbox.checked = autoCorrection === true;
        updateAutoCorrectionTooltip();
    }
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    if (useHistoryContextCheckbox) {
        useHistoryContextCheckbox.checked = useHistoryContext === true;
        updateUseHistoryContextTooltip();
    }
    if (showModalWindowCheckbox) { showModalWindowCheckbox.checked = showModalWindow === true; }
    if (autoSubmitCheckbox) { autoSubmitCheckbox.checked = autoSubmit; }
    if (themeSelect) { themeSelect.value = themeMode || THEME_MODES.DARK; }
    if (silenceTimeoutInput) { silenceTimeoutInput.value = silenceTimeout; }
}

/** Helper to generate a settings toggle switch HTML */
function settingsSwitch(id, labelKey) {
    return `<div class="otak-voice-settings__item">
        <label for="${id}">${chrome.i18n.getMessage(labelKey)}</label>
        <label class="otak-voice-settings__switch">
            <input type="checkbox" id="${id}">
            <span class="otak-voice-settings__slider otak-voice-settings__slider--round"></span>
        </label>
    </div>`;
}

/** Creates the settings modal */
export function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'otak-voice-settings';
    modal.id = 'otak-voice-settings-modal';
    const langOptions = [
        { value: 'ja-JP', textKey: 'modalSettingsLangJa' },
        { value: 'en-US', textKey: 'modalSettingsLangEn' },
        { value: 'vi-VN', textKey: 'modalSettingsLangVi' }
    ];
    const langSelectOptionsHTML = langOptions.map(lang =>
        `<option value="${lang.value}">${chrome.i18n.getMessage(lang.textKey)}</option>`
    ).join('');
    const themeOptions = [
        { value: THEME_MODES.DARK, textKey: 'modalSettingsThemeDark' },
        { value: THEME_MODES.LIGHT, textKey: 'modalSettingsThemeLight' }
    ];
    const themeSelectOptionsHTML = themeOptions.map(theme =>
        `<option value="${theme.value}">${chrome.i18n.getMessage(theme.textKey)}</option>`
    ).join('');
    const msg = (key) => chrome.i18n.getMessage(key);
    modal.innerHTML = `
        <h3>${msg('modalSettingsTitle')}</h3>
        <p>${msg('modalSettingsDescription')}</p>
        <div class="otak-voice-settings__grid">
            <div class="otak-voice-settings__block">
                <h4>${msg('settingApiSettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="api-key-input">OpenAI API Key</label>
                    <input type="password" id="api-key-input" placeholder="${msg('modalSettingsInputPlaceholder')}" autocomplete="off">
                    <div class="otak-voice-settings__help-text">
                        ${msg('settingApiKeyHelpText')} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">${msg('settingApiKeyLink')}</a>
                    </div>
                </div>
            </div>
            <div class="otak-voice-settings__block">
                <h4>${msg('settingDisplaySettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="recognition-lang-select">${msg('modalSettingsLangLabel')}</label>
                    <select id="recognition-lang-select">${langSelectOptionsHTML}</select>
                    <label for="theme-select">${msg('modalSettingsThemeLabel')}</label>
                    <select id="theme-select">${themeSelectOptionsHTML}</select>
                </div>
            </div>
            <div class="otak-voice-settings__block">
                <h4>${msg('settingFunctionSettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    ${settingsSwitch('auto-detect-input-fields-checkbox', 'settingAutoDetectInputFieldsLabel')}
                    ${settingsSwitch('auto-correction-checkbox', 'settingAutoCorrectionLabel')}
                    ${settingsSwitch('use-history-context-checkbox', 'settingUseHistoryContextLabel')}
                    ${settingsSwitch('show-modal-window-checkbox', 'settingShowModalWindowLabel')}
                    ${settingsSwitch('auto-submit-checkbox', 'settingAutoSubmitLabel')}
                    <div class="otak-voice-settings__item">
                        <label for="silence-timeout-input">${msg('settingSilenceTimeoutLabel')}</label>
                        <input type="number" id="silence-timeout-input" min="500" max="10000" step="500" value="3000" class="otak-voice-settings__number-input">
                    </div>
                </div>
            </div>
            <div class="otak-voice-settings__block">
                <h4>${msg('settingPromptSettingsLabel')}</h4>
                <div class="otak-voice-settings__block-content">
                    <label for="auto-correction-prompt-textarea">${msg('autoCorrectionPromptLabel')}</label>
                    <textarea id="auto-correction-prompt-textarea" rows="4" placeholder="${msg('promptPlaceholder')}"></textarea>
                    <label for="proofreading-prompt-textarea">${msg('proofreadingPromptLabel')}</label>
                    <textarea id="proofreading-prompt-textarea" rows="4" placeholder="${msg('promptPlaceholder')}"></textarea>
                </div>
            </div>
        </div>
        <div class="button-row">
            <a id="otak-voice-version-link" href="https://github.com/tsuyoshi-otake/otak-voice" target="_blank">Version: 3.1</a>
            <div class="button-group">
                <button class="otak-voice-settings__cancel-btn">${msg('modalSettingsButtonCancel')}</button>
                <button class="otak-voice-settings__save-btn">${msg('modalSettingsButtonSave')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    makeDraggable(modal);
    // Add auto-save functionality to all settings inputs
    const apiKeyInput = document.getElementById('api-key-input');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('change', () => { saveSetting('apiKey', apiKeyInput.value.trim()); });
    }
    const langSelect = document.getElementById('recognition-lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', () => { saveSetting('recognitionLang', langSelect.value); });
    }
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', () => { saveSetting('themeMode', themeSelect.value); });
    }
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    if (autoDetectCheckbox) {
        autoDetectCheckbox.addEventListener('change', () => { saveSetting('autoDetectInputFields', autoDetectCheckbox.checked); });
    }
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    if (autoCorrectionCheckbox) {
        autoCorrectionCheckbox.addEventListener('change', () => { saveSetting('autoCorrection', autoCorrectionCheckbox.checked); });
    }
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    if (useHistoryContextCheckbox) {
        useHistoryContextCheckbox.addEventListener('change', () => { saveSetting('useHistoryContext', useHistoryContextCheckbox.checked); });
    }
    // show-modal-window-checkbox and auto-submit-checkbox have no immediate change handlers
    // Silence timeout input
    const silenceTimeoutInput = document.getElementById('silence-timeout-input');
    if (silenceTimeoutInput) {
        silenceTimeoutInput.addEventListener('change', () => {
            const value = parseInt(silenceTimeoutInput.value, 10);
            const validValue = Math.min(Math.max(value, 500), 10000);
            if (value !== validValue) { silenceTimeoutInput.value = validValue; }
            saveSetting('silenceTimeout', validValue);
        });
    }
    const autoCorrectionPromptTextarea = document.getElementById('auto-correction-prompt-textarea');
    if (autoCorrectionPromptTextarea) {
        autoCorrectionPromptTextarea.addEventListener('change', () => { saveSetting('autoCorrectionPrompt', autoCorrectionPromptTextarea.value); });
    }
    const proofreadingPromptTextarea = document.getElementById('proofreading-prompt-textarea');
    if (proofreadingPromptTextarea) {
        proofreadingPromptTextarea.addEventListener('change', () => { saveSetting('proofreadingPrompt', proofreadingPromptTextarea.value); });
    }
}

/** WeakMap to track AbortControllers for draggable elements */
const draggableControllers = new WeakMap();

/**
 * Makes an element draggable
 * @param {HTMLElement} element - The element to make draggable
 */
export function makeDraggable(element) {
    const header = element.querySelector('h3');
    if (!header) return;

    // Clean up previous listeners for this element
    const prevController = draggableControllers.get(element);
    if (prevController) prevController.abort();
    const controller = new AbortController();
    draggableControllers.set(element, controller);

    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    header.style.cursor = 'move';
    header.addEventListener('mousedown', e => {
        isDragging = true;
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;
        if (element.classList.contains('otak-voice-settings')) {
            element.classList.add('otak-voice-settings--dragging');
        } else if (element.classList.contains('otak-voice-recognition')) {
            element.classList.add('otak-voice-recognition--dragging');
        } else {
            element.classList.add('otak-voice-modal--dragging');
        }
    }, { signal: controller.signal });
    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        element.style.left = (e.clientX - offsetX) + 'px';
        element.style.top = (e.clientY - offsetY) + 'px';
        element.style.transform = 'none';
    }, { signal: controller.signal });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (element.classList.contains('otak-voice-settings')) {
            element.classList.remove('otak-voice-settings--dragging');
        } else if (element.classList.contains('otak-voice-recognition')) {
            element.classList.remove('otak-voice-recognition--dragging');
        } else {
            element.classList.remove('otak-voice-modal--dragging');
        }
    }, { signal: controller.signal });
}
