/**
 * UI Tooltips Module
 * Tooltip update helpers for settings toggles.
 * Kept in a separate module to avoid circular imports between
 * ui-events.js (which imports ui-settings-modal.js) and the modal/menu modules.
 */

/** Updates the tooltip for the auto-detect setting toggle */
export function updateAutoDetectTooltip() {
    const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
    const autoDetectLabel = autoDetectCheckbox?.closest('.otak-voice-settings__switch');
    if (autoDetectCheckbox && autoDetectLabel) {
        // Reserved for future tooltip implementation
        void (autoDetectCheckbox.checked ? 'settingAutoDetectTooltipOn' : 'settingAutoDetectTooltipOff');
    }
}

/** Updates the tooltip for the auto-correction setting toggle */
export function updateAutoCorrectionTooltip() {
    const autoCorrectionCheckbox = document.getElementById('auto-correction-checkbox');
    const autoCorrectionLabel = autoCorrectionCheckbox?.closest('.otak-voice-settings__switch');
    if (autoCorrectionCheckbox && autoCorrectionLabel) {
        // Reserved for future tooltip implementation
        void (autoCorrectionCheckbox.checked ? 'settingAutoCorrectionTooltipOn' : 'settingAutoCorrectionTooltipOff');
    }
}

/** Updates the tooltip for the history context setting toggle */
export function updateUseHistoryContextTooltip() {
    const useHistoryContextCheckbox = document.getElementById('use-history-context-checkbox');
    const useHistoryContextLabel = useHistoryContextCheckbox?.closest('.otak-voice-settings__switch');
    if (useHistoryContextCheckbox && useHistoryContextLabel) {
        // Reserved for future tooltip implementation
        void (useHistoryContextCheckbox.checked ? 'settingUseHistoryContextTooltipOn' : 'settingUseHistoryContextTooltipOff');
    }
}

/** Updates the tooltip for the show modal window setting toggle */
export function updateShowModalWindowTooltip() {
    const showModalWindowCheckbox = document.getElementById('show-modal-window-checkbox');
    const showModalWindowLabel = showModalWindowCheckbox?.closest('.otak-voice-settings__switch');
    if (showModalWindowCheckbox && showModalWindowLabel) {
        // Reserved for future tooltip implementation
        void (showModalWindowCheckbox.checked ? 'settingShowModalWindowTooltipOn' : 'settingShowModalWindowTooltipOff');
    }
}
