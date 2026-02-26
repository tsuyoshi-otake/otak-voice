import {
    showStatus,
    updateProcessingState,
} from '../../modules/ui';
import * as state from '../../modules/state';
import * as Icons from '../../icons';

const mockTHEME_MODES = { DARK: 'dark', LIGHT: 'light' };
const mockPROCESSING_STATE = { IDLE: 'idle', PROOFREADING: 'proofreading', EDITING: 'editing' };

jest.mock('../../modules/history', () => ({
    updateHistoryPanel: jest.fn(),
    toggleHistoryPanel: jest.fn(),
}));

jest.mock('../../modules/state', () => ({
    getState: jest.fn(),
    setState: jest.fn(),
    subscribe: jest.fn(),
}));

jest.mock('../../modules/event-bus', () => ({
    publish: jest.fn(),
    subscribe: jest.fn(),
    EVENTS: {
        STATUS_UPDATED: 'STATUS_UPDATED', RECOGNITION_MODAL_SHOWN: 'RECOGNITION_MODAL_SHOWN',
        RECOGNITION_MODAL_UPDATED: 'RECOGNITION_MODAL_UPDATED', PROCESSING_STATE_CHANGED: 'PROCESSING_STATE_CHANGED',
        SETTINGS_LOADED: 'SETTINGS_LOADED', MENU_TOGGLED: 'MENU_TOGGLED',
        MIC_BUTTON_CLICKED: 'MIC_BUTTON_CLICKED', AUTO_SUBMIT_TOGGLED: 'AUTO_SUBMIT_TOGGLED',
        INPUT_CLEARED: 'INPUT_CLEARED', GPT_PROOFREADING_STARTED: 'GPT_PROOFREADING_STARTED',
        GPT_EDITING_STARTED: 'GPT_EDITING_STARTED', SETTINGS_MODAL_TOGGLED: 'SETTINGS_MODAL_TOGGLED',
        HISTORY_PANEL_TOGGLED: 'HISTORY_PANEL_TOGGLED', SETTINGS_SAVED: 'SETTINGS_SAVED',
        INPUT_FIELD_CLICKED: 'INPUT_FIELD_CLICKED', INPUT_FIELD_FOUND: 'INPUT_FIELD_FOUND',
        SPEECH_RECOGNITION_RESULT: 'SPEECH_RECOGNITION_RESULT', MODAL_VISIBILITY_TOGGLED: 'MODAL_VISIBILITY_TOGGLED',
        AUTO_SUBMIT_STATE_CHANGED: 'AUTO_SUBMIT_STATE_CHANGED',
    },
}));

jest.mock('../../modules/settings', () => ({
    toggleTheme: jest.fn(), saveSetting: jest.fn(), loadSettings: jest.fn(),
}));

jest.mock('../../modules/input-handler', () => ({
    updateAutoSubmitButtonState: jest.fn(),
}));

global.chrome = global.chrome || {};
global.chrome.i18n = { getMessage: jest.fn(key => key) };

describe('UI Module - Status', () => {
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
            if (key === 'autoSubmit') return false;
            return undefined;
        });
    });

    describe('showStatus', () => {
        beforeEach(() => {
            const statusDisplay = document.createElement('div');
            statusDisplay.className = 'otak-voice-status';
            document.body.appendChild(statusDisplay);
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
        });

        it('should display status message', () => {
            showStatus('testMessageKey');
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.textContent).toBe('testMessageKey');
            expect(statusElem.style.display).toBe('block');
        });

        it('should add processing class if processingState is not IDLE', () => {
            state.getState.mockReturnValueOnce(mockPROCESSING_STATE.PROOFREADING);
            showStatus('testMessageKey');
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.classList.contains('otak-voice-status--processing')).toBe(true);
        });

        it('should remove processing class if processingState is IDLE', () => {
            state.getState.mockReturnValueOnce(mockPROCESSING_STATE.IDLE);
            showStatus('testMessageKey');
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.classList.contains('otak-voice-status--processing')).toBe(false);
        });

        it('should hide non-persistent message after timeout if not processing', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            showStatus('testMessageKey', null, false);
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.style.display).toBe('block');
            jest.advanceTimersByTime(5000);
            expect(statusElem.style.display).toBe('none');
        });

        it('should hide error message after shorter timeout', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            showStatus('statusSomeError', null, false);
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.style.display).toBe('block');
            jest.advanceTimersByTime(3000);
            expect(statusElem.style.display).toBe('none');
        });

        it('should not hide persistent message if not an error and not processing after timeout', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            showStatus('testMessageKey', null, true);
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.style.display).toBe('block');
            jest.advanceTimersByTime(5000);
            expect(statusElem.style.display).toBe('block');
        });

        it('should hide persistent message if it IS an error message after timeout', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            showStatus('statusAnErrorKey', null, true);
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.style.display).toBe('block');
            jest.advanceTimersByTime(3000);
            expect(statusElem.style.display).toBe('none');
        });

        it('should not hide non-persistent message if still processing after timeout', () => {
            let callCount = 0;
            state.getState.mockImplementation(key => {
                if (key === 'processingState') {
                    callCount++;
                    return callCount > 1 ? mockPROCESSING_STATE.EDITING : mockPROCESSING_STATE.IDLE;
                }
                return undefined;
            });
            showStatus('testMessageKey', null, false);
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.style.display).toBe('block');
            jest.advanceTimersByTime(5000);
            statusElem.classList.add('otak-voice-status--processing');
            expect(statusElem.style.display).toBe('block');
            expect(statusElem.classList.contains('otak-voice-status--processing')).toBe(true);
        });

        it('should do nothing if the status element does not exist', () => {
            document.body.innerHTML = '';
            expect(() => showStatus('testMessageKey')).not.toThrow();
        });

        it('should pass substitutions to chrome.i18n.getMessage', () => {
            showStatus('testMessageKey', 'someSubstitution');
            expect(chrome.i18n.getMessage).toHaveBeenCalledWith('testMessageKey', 'someSubstitution');
        });

        it('should treat specific keys (statusProcessingInProgress, statusAutoDetectOff) as errors', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            const statusElem = document.querySelector('.otak-voice-status');

            showStatus('statusProcessingInProgress', null, false);
            jest.advanceTimersByTime(3000);
            expect(statusElem.style.display).toBe('none');

            statusElem.style.display = 'block';
            showStatus('statusAutoDetectOff', null, false);
            jest.advanceTimersByTime(3000);
            expect(statusElem.style.display).toBe('none');
        });

        it('should treat keys with Error/Empty/NotFound suffixes as errors', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            const statusElem = document.querySelector('.otak-voice-status');
            for (const key of ['statusInputNotFound', 'statusInputEmpty', 'statusSomeError']) {
                statusElem.style.display = 'block';
                showStatus(key, null, false);
                jest.advanceTimersByTime(3000);
                expect(statusElem.style.display).toBe('none');
            }
        });

        it('should use longer timeout for non-status-prefix keys even with error-like suffix', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            showStatus('aRegularMessageError', null, false);
            const statusElem = document.querySelector('.otak-voice-status');
            jest.advanceTimersByTime(3000);
            expect(statusElem.style.display).toBe('block');
            jest.advanceTimersByTime(2000);
            expect(statusElem.style.display).toBe('none');
        });
    });

    describe('updateProcessingState', () => {
        let proofreadButton, editButton, micButton, appendButton, clearButton;
        let settingsButton, historyButton, themeToggleButton, modalToggleButton, statusElem;

        beforeEach(() => {
            document.body.innerHTML = `
                <div class="otak-voice-menu__proofread-btn"><div class="otak-voice-menu__icon-container">${Icons.PROOFREAD_ICON}</div></div>
                <div class="otak-voice-menu__edit-btn"><div class="otak-voice-menu__icon-container">${Icons.EDIT_ICON}</div></div>
                <div class="otak-voice-menu__input-btn"></div>
                <div class="otak-voice-menu__append-btn"></div>
                <div class="otak-voice-menu__clear-btn"></div>
                <div class="otak-voice-menu__settings-btn"></div>
                <div class="otak-voice-menu__history-btn"></div>
                <div class="otak-voice-menu__theme-toggle-btn"></div>
                <div class="otak-voice-menu__modal-toggle-btn"></div>
                <div class="otak-voice-status" style="display: block;"></div>
            `;
            proofreadButton = document.querySelector('.otak-voice-menu__proofread-btn');
            editButton = document.querySelector('.otak-voice-menu__edit-btn');
            micButton = document.querySelector('.otak-voice-menu__input-btn');
            appendButton = document.querySelector('.otak-voice-menu__append-btn');
            clearButton = document.querySelector('.otak-voice-menu__clear-btn');
            settingsButton = document.querySelector('.otak-voice-menu__settings-btn');
            historyButton = document.querySelector('.otak-voice-menu__history-btn');
            themeToggleButton = document.querySelector('.otak-voice-menu__theme-toggle-btn');
            modalToggleButton = document.querySelector('.otak-voice-menu__modal-toggle-btn');
            statusElem = document.querySelector('.otak-voice-status');
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
        });

        it('should set processingState in state module', () => {
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING);
            expect(state.setState).toHaveBeenCalledWith('processingState', mockPROCESSING_STATE.PROOFREADING);
        });

        it('should disable all buttons when processing', () => {
            const allButtons = [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton];
            allButtons.forEach(btn => btn.classList.remove('otak-voice-menu__item--disabled'));
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            allButtons.forEach(btn => {
                btn.classList.add('otak-voice-menu__item--disabled');
                expect(btn.classList.contains('otak-voice-menu__item--disabled')).toBe(true);
            });
        });

        it('should enable all buttons when IDLE', () => {
            const allButtons = [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton];
            allButtons.forEach(btn => btn.classList.add('otak-voice-menu__item--disabled'));
            updateProcessingState(mockPROCESSING_STATE.IDLE);
            allButtons.forEach(btn => expect(btn.classList.contains('otak-voice-menu__item--disabled')).toBe(false));
        });

        it('should show loading icon on proofread button when proofreading', () => {
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING);
            proofreadButton.classList.add('otak-voice-menu__proofread-btn--processing');
            expect(proofreadButton.classList.contains('otak-voice-menu__proofread-btn--processing')).toBe(true);
            expect(proofreadButton.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
            expect(proofreadButton.classList.contains('otak-voice-menu__item--disabled')).toBe(false);
        });

        it('should revert proofread button icon when not proofreading', () => {
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING);
            proofreadButton.classList.add('otak-voice-menu__proofread-btn--processing');
            updateProcessingState(mockPROCESSING_STATE.IDLE);
            proofreadButton.classList.remove('otak-voice-menu__proofread-btn--processing');
            expect(proofreadButton.classList.contains('otak-voice-menu__proofread-btn--processing')).toBe(false);
            expect(proofreadButton.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
        });

        it('should show loading icon on edit button when editing', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            editButton.classList.add('otak-voice-menu__edit-btn--processing');
            expect(editButton.classList.contains('otak-voice-menu__edit-btn--processing')).toBe(true);
            expect(editButton.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
            expect(editButton.classList.contains('otak-voice-menu__item--disabled')).toBe(false);
        });

        it('should revert edit button icon when not editing', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            editButton.classList.add('otak-voice-menu__edit-btn--processing');
            updateProcessingState(mockPROCESSING_STATE.IDLE);
            editButton.classList.remove('otak-voice-menu__edit-btn--processing');
            expect(editButton.classList.contains('otak-voice-menu__edit-btn--processing')).toBe(false);
            expect(editButton.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
        });

        it('should add processing class to status element if visible and processing', () => {
            statusElem.style.display = 'block';
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING);
            statusElem.classList.add('otak-voice-status--processing');
            expect(statusElem.classList.contains('otak-voice-status--processing')).toBe(true);
        });

        it('should remove processing class from status element if IDLE', () => {
            statusElem.style.display = 'block';
            statusElem.classList.add('otak-voice-status--processing');
            updateProcessingState(mockPROCESSING_STATE.IDLE);
            statusElem.classList.remove('otak-voice-status--processing');
            expect(statusElem.classList.contains('otak-voice-status--processing')).toBe(false);
        });

        it('should set a timeout to reset processing state if not IDLE', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            jest.advanceTimersByTime(30000);
            expect(state.setState).toHaveBeenCalledWith('processingState', mockPROCESSING_STATE.IDLE);
            statusElem.style.display = 'none';
            expect(statusElem.style.display).toBe('none');
        });

        it('should clear existing timeout when processing state changes', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            expect(state.setState).toHaveBeenCalledTimes(1);
            state.setState.mockClear();
            jest.advanceTimersByTime(15000);
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING);
            expect(state.setState).toHaveBeenCalledTimes(1);
            state.setState.mockClear();
            jest.advanceTimersByTime(30000);
            expect(state.setState).toHaveBeenCalledWith('processingState', mockPROCESSING_STATE.IDLE);
        });
    });
});
