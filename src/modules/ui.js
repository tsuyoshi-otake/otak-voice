/**
 * UI Module - Barrel file
 * Re-exports all UI functions from split modules
 */

export { showStatus, updateProcessingState } from './ui-status.js';
export { createUI, createMenuItem, removeExistingElements, createHistoryPanel, updateEditProofreadButtonsState } from './ui-core.js';
export { createSettingsModal, toggleSettingsModal, updateSettingsModalValues, makeDraggable } from './ui-settings-modal.js';
export { showRecognitionTextModal, updateRecognitionModal } from './ui-recognition-modal.js';
export { setupEventListeners, setupEventSubscriptions, toggleModalVisibility, updateAutoDetectTooltip, updateAutoCorrectionTooltip, updateUseHistoryContextTooltip, updateShowModalWindowTooltip } from './ui-events.js';
