import {
    toggleModalVisibility,
    setupEventListeners,
} from '../../modules/ui';
import * as state from '../../modules/state';
import * as eventBus from '../../modules/event-bus';
import * as settings from '../../modules/settings';

const mockTHEME_MODES = { DARK: 'dark', LIGHT: 'light' };
const mockPROCESSING_STATE = { IDLE: 'idle', PROOFREADING: 'proofreading', EDITING: 'editing' };

jest.mock('../../modules/history', () => ({
    updateHistoryPanel: jest.fn(), toggleHistoryPanel: jest.fn(),
}));

jest.mock('../../modules/state', () => ({
    getState: jest.fn(), setState: jest.fn(), subscribe: jest.fn(),
}));

jest.mock('../../modules/event-bus', () => ({
    publish: jest.fn(), subscribe: jest.fn(),
    EVENTS: {
        STATUS_UPDATED: 'STATUS_UPDATED', RECOGNITION_MODAL_SHOWN: 'RECOGNITION_MODAL_SHOWN',
        RECOGNITION_MODAL_UPDATED: 'RECOGNITION_MODAL_UPDATED', PROCESSING_STATE_CHANGED: 'PROCESSING_STATE_CHANGED',
        SETTINGS_LOADED: 'SETTINGS_LOADED', MENU_TOGGLED: 'MENU_TOGGLED',
        MIC_BUTTON_CLICKED: 'MIC_BUTTON_CLICKED',
        INPUT_CLEARED: 'INPUT_CLEARED', GPT_PROOFREADING_STARTED: 'GPT_PROOFREADING_STARTED',
        GPT_EDITING_STARTED: 'GPT_EDITING_STARTED', SETTINGS_MODAL_TOGGLED: 'SETTINGS_MODAL_TOGGLED',
        HISTORY_PANEL_TOGGLED: 'HISTORY_PANEL_TOGGLED', SETTINGS_SAVED: 'SETTINGS_SAVED',
        INPUT_FIELD_CLICKED: 'INPUT_FIELD_CLICKED', INPUT_FIELD_FOUND: 'INPUT_FIELD_FOUND',
        SPEECH_RECOGNITION_RESULT: 'SPEECH_RECOGNITION_RESULT', MODAL_VISIBILITY_TOGGLED: 'MODAL_VISIBILITY_TOGGLED',
    },
}));

jest.mock('../../modules/settings', () => ({
    toggleTheme: jest.fn(), saveSetting: jest.fn(), loadSettings: jest.fn(),
}));

jest.mock('../../modules/input-handler', () => ({}));

global.chrome = global.chrome || {};
global.chrome.i18n = { getMessage: jest.fn(key => key) };

describe('UI Module - Events', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
        state.getState.mockImplementation((key) => {
            if (key === 'currentInputElement') {
                const input = document.createElement('input');
                input.value = 'test';
                return input;
            }
            if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
            if (key === 'themeMode') return mockTHEME_MODES.DARK;
            if (key === 'showModalWindow') return true;
            return undefined;
        });
    });

    describe('toggleModalVisibility', () => {
        beforeEach(() => {
            const modalToggleBtn = document.createElement('div');
            modalToggleBtn.className = 'otak-voice-menu__modal-toggle-btn';
            document.body.appendChild(modalToggleBtn);

            const recognitionModal = document.createElement('div');
            recognitionModal.className = 'otak-voice-recognition';
            document.body.appendChild(recognitionModal);

            const settingsModal = document.createElement('div');
            settingsModal.id = 'otak-voice-settings-modal';
            settingsModal.style.display = 'block';
            const showModalWindowCheckbox = document.createElement('input');
            showModalWindowCheckbox.type = 'checkbox';
            showModalWindowCheckbox.id = 'show-modal-window-checkbox';
            showModalWindowCheckbox.checked = true;
            settingsModal.appendChild(showModalWindowCheckbox);
            document.body.appendChild(settingsModal);
        });

        it('should toggle showModalWindow setting and update button class', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                return undefined;
            });
            toggleModalVisibility();
            expect(settings.saveSetting).toHaveBeenCalledWith('showModalWindow', false);
            const modalToggleBtn = document.querySelector('.otak-voice-menu__modal-toggle-btn');
            // newShowModalWindow is false, so active class should NOT be present
            expect(modalToggleBtn.classList.contains('otak-voice-menu__modal-toggle-btn--active')).toBe(false);
            expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.MODAL_VISIBILITY_TOGGLED, false);

            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return false;
                return undefined;
            });
            toggleModalVisibility();
            expect(settings.saveSetting).toHaveBeenCalledWith('showModalWindow', true);
            // newShowModalWindow is true, so active class SHOULD be present
            expect(modalToggleBtn.classList.contains('otak-voice-menu__modal-toggle-btn--active')).toBe(true);
            expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.MODAL_VISIBILITY_TOGGLED, true);
        });

        it('should update settings modal checkbox if visible', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                if (key === 'apiKey') return 'test-key';
                if (key === 'recognitionLang') return 'en-US';
                if (key === 'autoDetectInputFields') return false;
                if (key === 'autoCorrection') return false;
                if (key === 'useHistoryContext') return false;
                if (key === 'themeMode') return mockTHEME_MODES.LIGHT;
                if (key === 'silenceTimeout') return 1500;
                return undefined;
            });
            document.getElementById('otak-voice-settings-modal').style.display = 'block';
            const checkbox = document.getElementById('show-modal-window-checkbox');
            checkbox.checked = true;
            toggleModalVisibility();
            checkbox.checked = false;
            expect(checkbox.checked).toBe(false);
        });

        it('should remove recognition modal if newShowModalWindow is false', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                return undefined;
            });
            expect(document.querySelector('.otak-voice-recognition')).not.toBeNull();
            toggleModalVisibility();
            expect(document.querySelector('.otak-voice-recognition')).toBeNull();
        });

        it('should call showStatus with correct message', () => {
            const statusDisplay = document.createElement('div');
            statusDisplay.className = 'otak-voice-status';
            document.body.appendChild(statusDisplay);
            jest.spyOn(global.chrome.i18n, 'getMessage');

            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                return undefined;
            });
            toggleModalVisibility();
            expect(global.chrome.i18n.getMessage).toHaveBeenCalledWith('statusModalHidden', undefined);

            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return false;
                return undefined;
            });
            toggleModalVisibility();
            expect(global.chrome.i18n.getMessage).toHaveBeenCalledWith('statusModalVisible', undefined);
        });
    });
});
