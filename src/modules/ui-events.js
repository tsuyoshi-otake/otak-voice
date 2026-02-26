/**
 * UI Events Module
 * Responsible for setting up event listeners and event bus subscriptions
 */
import { PROCESSING_STATE } from '../constants.js';
import { isInputElement } from './dom-utils.js';
import { getState } from './state.js';
import { publish, subscribe, EVENTS } from './event-bus.js';
import { saveSetting } from './settings.js';
import { updateAutoSubmitButtonState } from './input-handler.js';
import { showStatus, updateProcessingState } from './ui-status.js';
import { updateEditProofreadButtonsState } from './ui-core.js';
import { updateSettingsModalValues } from './ui-settings-modal.js';
import { showRecognitionTextModal, updateRecognitionModal } from './ui-recognition-modal.js';
import {
    updateAutoDetectTooltip,
    updateAutoCorrectionTooltip,
    updateUseHistoryContextTooltip,
    updateShowModalWindowTooltip,
} from './ui-tooltips.js';

/** Helper: attach a click handler to a button that checks processing state before publishing */
function addButtonClickHandler(selector, event, eventData) {
    const btn = document.querySelector(selector);
    if (btn) {
        btn.addEventListener('click', () => {
            const ps = getState('processingState');
            if (ps === PROCESSING_STATE.IDLE && !btn.classList.contains('otak-voice-menu__item--disabled')) {
                publish(event, eventData);
            } else if (ps !== PROCESSING_STATE.IDLE) {
                showStatus('statusProcessingInProgress');
            }
        });
    }
}

/** Toggles the visibility of the modal window */
export function toggleModalVisibility() {
    const currentShowModalWindow = getState('showModalWindow');
    const newShowModalWindow = !currentShowModalWindow;
    saveSetting('showModalWindow', newShowModalWindow);
    const modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
    if (modalToggleButton) {
        if (newShowModalWindow) {
            modalToggleButton.classList.remove('otak-voice-menu__modal-toggle-btn--active');
        } else {
            modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
        }
    }
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    if (showModalWindowCheckbox) { showModalWindowCheckbox.checked = newShowModalWindow; }
    const settingsModal = document.getElementById('otak-voice-settings-modal');
    if (settingsModal && settingsModal.style.display === 'block') { updateSettingsModalValues(); }
    const existingModal = document.querySelector('.otak-voice-recognition');
    if (existingModal && !newShowModalWindow) { existingModal.remove(); }
    publish(EVENTS.MODAL_VISIBILITY_TOGGLED, newShowModalWindow);
    showStatus(newShowModalWindow ? 'statusModalVisible' : 'statusModalHidden');
}

export { updateAutoDetectTooltip, updateAutoCorrectionTooltip, updateUseHistoryContextTooltip, updateShowModalWindowTooltip };

/** Set up event subscriptions for UI module */
export function setupEventSubscriptions() {
    subscribe(EVENTS.STATUS_UPDATED, (data) => {
        showStatus(data.messageKey, data.substitutions, data.persistent);
    });
    subscribe(EVENTS.RECOGNITION_MODAL_SHOWN, (data) => {
        showRecognitionTextModal(data.text, data.isInitial);
    });
    subscribe(EVENTS.RECOGNITION_MODAL_UPDATED, (text) => { updateRecognitionModal(text); });
    subscribe(EVENTS.PROCESSING_STATE_CHANGED, (state) => {
        updateProcessingState(state);
        updateEditProofreadButtonsState();
    });
    subscribe(EVENTS.AUTO_SUBMIT_STATE_CHANGED, (autoSubmit) => {
        const modal = document.getElementById('otak-voice-settings-modal');
        if (modal && modal.style.display === 'block') {
            const cb = document.getElementById('auto-submit-checkbox');
            if (cb) { cb.checked = autoSubmit; }
        }
    });
    subscribe(EVENTS.MODAL_VISIBILITY_TOGGLED, (showModalWindow) => {
        const modal = document.getElementById('otak-voice-settings-modal');
        if (modal && modal.style.display === 'block') {
            const cb = document.getElementById('show-modal-window-checkbox');
            if (cb) { cb.checked = showModalWindow; }
        }
    });
    subscribe(EVENTS.SETTINGS_LOADED, (settings) => {
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput) { apiKeyInput.value = settings.apiKey || ''; }
        const langSelect = document.getElementById('recognition-lang-select');
        if (langSelect) { langSelect.value = settings.recognitionLang; }
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) { themeSelect.value = settings.themeMode; }
        const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
        if (autoDetectCheckbox) { autoDetectCheckbox.checked = settings.autoDetectInputFields; }
        const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
        if (autoCorrectionCheckbox) { autoCorrectionCheckbox.checked = settings.autoCorrection; }
        const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
        if (useHistoryContextCheckbox) { useHistoryContextCheckbox.checked = settings.useHistoryContext; }
        const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
        if (showModalWindowCheckbox) { showModalWindowCheckbox.checked = settings.showModalWindow; }
        const autoSubmitCheckbox = document.getElementById('auto-submit-checkbox');
        if (autoSubmitCheckbox) {
            const currentAutoSubmit = getState('autoSubmit');
            autoSubmitCheckbox.checked = currentAutoSubmit;
        }
        const autoCorrectionPromptTextarea = document.getElementById('auto-correction-prompt-textarea');
        if (autoCorrectionPromptTextarea) { autoCorrectionPromptTextarea.value = settings.autoCorrectionPrompt; }
        const proofreadingPromptTextarea = document.getElementById('proofreading-prompt-textarea');
        if (proofreadingPromptTextarea) { proofreadingPromptTextarea.value = settings.proofreadingPrompt; }
        const modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
        if (modalToggleButton) {
            if (settings.showModalWindow) {
                modalToggleButton.classList.remove('otak-voice-menu__modal-toggle-btn--active');
            } else {
                modalToggleButton.classList.add('otak-voice-menu__modal-toggle-btn--active');
            }
        }
        const autoSubmitButton = document.querySelector('.otak-voice-menu__append-btn');
        if (autoSubmitButton && settings.autoSubmit !== undefined) {
            if (typeof updateAutoSubmitButtonState === 'function') {
                updateAutoSubmitButtonState(settings.autoSubmit);
            }
        }
    });
    subscribe(EVENTS.INPUT_FIELD_CLICKED, () => { updateEditProofreadButtonsState(); });
    subscribe(EVENTS.INPUT_FIELD_FOUND, () => { updateEditProofreadButtonsState(); });
    subscribe(EVENTS.SPEECH_RECOGNITION_RESULT, () => { updateEditProofreadButtonsState(); });
}

/** Sets up event listeners */
export function setupEventListeners() {
    const menuButton = document.querySelector('.otak-voice-menu__btn');
    if (menuButton) {
        menuButton.addEventListener('click', () => { publish(EVENTS.MENU_TOGGLED); });
    }
    addButtonClickHandler('.otak-voice-menu__input-btn', EVENTS.MIC_BUTTON_CLICKED);
    addButtonClickHandler('.otak-voice-menu__append-btn', EVENTS.AUTO_SUBMIT_TOGGLED, { fromMenuButton: true });
    addButtonClickHandler('.otak-voice-menu__clear-btn', EVENTS.INPUT_CLEARED);
    addButtonClickHandler('.otak-voice-menu__proofread-btn', EVENTS.GPT_PROOFREADING_STARTED);
    addButtonClickHandler('.otak-voice-menu__edit-btn', EVENTS.GPT_EDITING_STARTED);
    addButtonClickHandler('.otak-voice-menu__settings-btn', EVENTS.SETTINGS_MODAL_TOGGLED);
    addButtonClickHandler('.otak-voice-menu__history-btn', EVENTS.HISTORY_PANEL_TOGGLED);

    const saveButton = document.querySelector('.otak-voice-settings__save-btn');
    const cancelButton = document.querySelector('.otak-voice-settings__cancel-btn');
    if (saveButton) { saveButton.addEventListener('click', () => { publish(EVENTS.SETTINGS_SAVED); }); }
    if (cancelButton) { cancelButton.addEventListener('click', () => { publish(EVENTS.SETTINGS_MODAL_TOGGLED); }); }

    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    if (autoDetectCheckbox) {
        updateAutoDetectTooltip();
        autoDetectCheckbox.addEventListener('change', updateAutoDetectTooltip);
    }
    setupEventSubscriptions();
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    if (autoCorrectionCheckbox) {
        updateAutoCorrectionTooltip();
        autoCorrectionCheckbox.addEventListener('change', updateAutoCorrectionTooltip);
    }
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    if (useHistoryContextCheckbox) {
        updateUseHistoryContextTooltip();
        useHistoryContextCheckbox.addEventListener('change', updateUseHistoryContextTooltip);
    }
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    if (showModalWindowCheckbox) { showModalWindowCheckbox.checked = getState('showModalWindow'); }

    // Automatically turn on the microphone when a text area is focused (only if auto-recognition is off)
    document.addEventListener('focusin', e => {
        if (isInputElement(e.target) && getState('autoDetectInputFields') === true && !getState('isListening')) {
            publish(EVENTS.MIC_BUTTON_CLICKED);
        }
    });
}
