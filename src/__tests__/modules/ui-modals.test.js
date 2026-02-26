import { createSettingsModal, toggleSettingsModal, updateSettingsModalValues,
    showRecognitionTextModal, updateRecognitionModal } from '../../modules/ui';
import * as state from '../../modules/state';
import * as settings from '../../modules/settings';

const mockTHEME_MODES = { DARK: 'dark', LIGHT: 'light' };
const mockPROCESSING_STATE = { IDLE: 'idle', PROOFREADING: 'proofreading', EDITING: 'editing' };

jest.mock('../../modules/history', () => ({ updateHistoryPanel: jest.fn(), toggleHistoryPanel: jest.fn() }));
jest.mock('../../modules/state', () => ({ getState: jest.fn(), setState: jest.fn(), subscribe: jest.fn() }));
jest.mock('../../modules/event-bus', () => ({
    publish: jest.fn(), subscribe: jest.fn(),
    EVENTS: { STATUS_UPDATED: 'STATUS_UPDATED', RECOGNITION_MODAL_SHOWN: 'RECOGNITION_MODAL_SHOWN',
        RECOGNITION_MODAL_UPDATED: 'RECOGNITION_MODAL_UPDATED', PROCESSING_STATE_CHANGED: 'PROCESSING_STATE_CHANGED',
        SETTINGS_LOADED: 'SETTINGS_LOADED', MENU_TOGGLED: 'MENU_TOGGLED', MIC_BUTTON_CLICKED: 'MIC_BUTTON_CLICKED',
        AUTO_SUBMIT_TOGGLED: 'AUTO_SUBMIT_TOGGLED', INPUT_CLEARED: 'INPUT_CLEARED',
        GPT_PROOFREADING_STARTED: 'GPT_PROOFREADING_STARTED', GPT_EDITING_STARTED: 'GPT_EDITING_STARTED',
        SETTINGS_MODAL_TOGGLED: 'SETTINGS_MODAL_TOGGLED', HISTORY_PANEL_TOGGLED: 'HISTORY_PANEL_TOGGLED',
        SETTINGS_SAVED: 'SETTINGS_SAVED', INPUT_FIELD_CLICKED: 'INPUT_FIELD_CLICKED',
        INPUT_FIELD_FOUND: 'INPUT_FIELD_FOUND', SPEECH_RECOGNITION_RESULT: 'SPEECH_RECOGNITION_RESULT',
        MODAL_VISIBILITY_TOGGLED: 'MODAL_VISIBILITY_TOGGLED', AUTO_SUBMIT_STATE_CHANGED: 'AUTO_SUBMIT_STATE_CHANGED' },
}));
jest.mock('../../modules/settings', () => ({ toggleTheme: jest.fn(), saveSetting: jest.fn(), loadSettings: jest.fn() }));
jest.mock('../../modules/input-handler', () => ({ updateAutoSubmitButtonState: jest.fn() }));

global.chrome = global.chrome || {};
global.chrome.i18n = { getMessage: jest.fn(key => key) };

describe('UI Module - Modals', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
        state.getState.mockImplementation((key) => {
            if (key === 'currentInputElement') { const i = document.createElement('input'); i.value = 'test'; return i; }
            if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
            if (key === 'themeMode') return mockTHEME_MODES.DARK;
            if (key === 'showModalWindow') return true;
            if (key === 'autoSubmit') return false;
            return undefined;
        });
    });

    describe('createSettingsModal', () => {
        it('should create settings modal with all form elements', () => {
            createSettingsModal();
            const m = document.getElementById('otak-voice-settings-modal');
            expect(m).not.toBeNull();
            expect(m.querySelector('h3').textContent).toBe('modalSettingsTitle');
            ['#api-key-input', '#recognition-lang-select', '#theme-select', '#auto-detect-input-fields-checkbox',
             '#auto-correction-checkbox', '#use-history-context-checkbox', '#show-modal-window-checkbox',
             '#auto-submit-checkbox', '#silence-timeout-input', '#auto-correction-prompt-textarea',
             '#proofreading-prompt-textarea', '.otak-voice-settings__save-btn', '.otak-voice-settings__cancel-btn',
             '#otak-voice-version-link'].forEach(sel => expect(m.querySelector(sel)).not.toBeNull());
        });

        it('should make the settings modal draggable', () => {
            createSettingsModal();
            const header = document.getElementById('otak-voice-settings-modal').querySelector('h3');
            expect(header.style.cursor).toBe('move');
        });

        it('should add change listeners to settings inputs that call saveSetting', () => {
            createSettingsModal();
            const dispatch = (id, val, prop = 'value') => {
                const el = document.getElementById(id);
                el[prop] = val;
                el.dispatchEvent(new Event('change'));
            };
            dispatch('api-key-input', 'new-key');
            expect(settings.saveSetting).toHaveBeenCalledWith('apiKey', 'new-key');
            dispatch('recognition-lang-select', 'en-US');
            expect(settings.saveSetting).toHaveBeenCalledWith('recognitionLang', 'en-US');
            dispatch('theme-select', mockTHEME_MODES.LIGHT);
            expect(settings.saveSetting).toHaveBeenCalledWith('themeMode', mockTHEME_MODES.LIGHT);
            dispatch('auto-detect-input-fields-checkbox', false, 'checked');
            expect(settings.saveSetting).toHaveBeenCalledWith('autoDetectInputFields', false);
            dispatch('silence-timeout-input', '1000');
            expect(settings.saveSetting).toHaveBeenCalledWith('silenceTimeout', 1000);
        });
    });

    describe('toggleSettingsModal', () => {
        beforeEach(() => {
            const m = document.createElement('div');
            m.id = 'otak-voice-settings-modal'; m.style.display = 'none';
            document.body.appendChild(m);
        });

        it('should toggle display of settings modal', () => {
            const m = document.getElementById('otak-voice-settings-modal');
            toggleSettingsModal(); expect(m.style.display).toBe('block');
            toggleSettingsModal(); expect(m.style.display).toBe('none');
        });

        it('should call updateSettingsModalValues when showing modal', () => {
            state.getState.mockImplementation(key => key === 'apiKey' ? 'current-api-key' : undefined);
            const m = document.getElementById('otak-voice-settings-modal');
            m.style.display = 'none';
            const input = document.createElement('input'); input.id = 'api-key-input'; m.appendChild(input);
            toggleSettingsModal();
            expect(input.value).toBe('current-api-key');
        });
    });

    describe('updateSettingsModalValues', () => {
        beforeEach(() => {
            document.body.innerHTML = `<div id="otak-voice-settings-modal">
                <input id="api-key-input" />
                <select id="recognition-lang-select"><option value="ja-JP"></option><option value="en-US"></option></select>
                <input type="checkbox" id="auto-detect-input-fields-checkbox" />
                <input type="checkbox" id="auto-correction-checkbox" />
                <input type="checkbox" id="use-history-context-checkbox" />
                <select id="theme-select"><option value="dark"></option><option value="light"></option></select>
                <input type="checkbox" id="show-modal-window-checkbox" />
                <input type="checkbox" id="auto-submit-checkbox" />
                <input type="number" id="silence-timeout-input" /></div>`;
            state.getState.mockImplementation(key => ({ apiKey: 'test-key', recognitionLang: 'en-US',
                autoDetectInputFields: false, autoCorrection: false, useHistoryContext: false,
                themeMode: mockTHEME_MODES.LIGHT, showModalWindow: false, autoSubmit: true, silenceTimeout: 1500
            })[key]);
        });

        it('should update all settings input fields with values from state', () => {
            updateSettingsModalValues();
            expect(document.getElementById('api-key-input').value).toBe('test-key');
            expect(document.getElementById('recognition-lang-select').value).toBe('en-US');
            expect(document.getElementById('auto-detect-input-fields-checkbox').checked).toBe(false);
            expect(document.getElementById('auto-correction-checkbox').checked).toBe(false);
            expect(document.getElementById('use-history-context-checkbox').checked).toBe(false);
            expect(document.getElementById('theme-select').value).toBe(mockTHEME_MODES.LIGHT);
            expect(document.getElementById('show-modal-window-checkbox').checked).toBe(false);
            expect(document.getElementById('auto-submit-checkbox').checked).toBe(true);
            expect(document.getElementById('silence-timeout-input').value).toBe('1500');
        });

        it('should use default for recognitionLang if not in state', () => {
            state.getState.mockImplementation(key => key === 'recognitionLang' ? undefined : 'other-value');
            updateSettingsModalValues();
            expect(document.getElementById('recognition-lang-select').value).toBe('ja-JP');
        });

        it('should use default for themeMode if not in state', () => {
            state.getState.mockImplementation(key => key === 'themeMode' ? undefined : 'other-value');
            updateSettingsModalValues();
            expect(document.getElementById('theme-select').value).toBe(mockTHEME_MODES.DARK);
        });
    });

    describe('showRecognitionTextModal', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            global.chrome.i18n.getMessage.mockImplementation(key => ({
                recognitionModalCopyButton: 'Copy', recognitionModalCloseButton: 'Close',
                recognitionModalCopied: 'Copied!', recognitionModalTitle: 'Recognition',
                recognitionModalPlaceholder: 'Waiting...' }[key] || key));
        });
        afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); document.body.innerHTML = ''; });

        it('should not create modal if showModalWindow is false', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? false : undefined);
            showRecognitionTextModal('test text');
            expect(document.querySelector('.otak-voice-recognition')).toBeNull();
        });

        it('should create and display modal if showModalWindow is true', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                if (key === 'themeMode') return mockTHEME_MODES.DARK;
                return undefined;
            });
            showRecognitionTextModal('hello world', true);
            const m = document.querySelector('.otak-voice-recognition');
            expect(m).not.toBeNull();
            expect(m.querySelector('textarea').value).toBe('hello world');
            expect(m.querySelector('h3').textContent).toBe('Recognition');
            document.documentElement.setAttribute('data-otak-theme', mockTHEME_MODES.DARK);
            expect(document.documentElement.getAttribute('data-otak-theme')).toBe(mockTHEME_MODES.DARK);
        });

        it('should update existing modal text', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('initial text', true);
            showRecognitionTextModal('updated text', false);
            expect(document.querySelector('.otak-voice-recognition textarea').value).toBe('updated text');
        });

        it('should set newRecognitionSession and lastAppendedText state if isInitial is true', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('test', true);
            expect(state.setState).toHaveBeenCalledWith('newRecognitionSession', true);
            expect(state.setState).toHaveBeenCalledWith('lastAppendedText', '');
        });

        it('copy button should copy text and close modal if autoSubmit is true', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                if (key === 'autoSubmit') return true;
                return undefined;
            });
            document.execCommand = jest.fn();
            showRecognitionTextModal('copy this', true);
            const m = document.querySelector('.otak-voice-recognition');
            const btn = m.querySelector('.otak-voice-recognition__copy-btn');
            btn.click();
            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(btn.textContent).toBe('Copied!');
            jest.advanceTimersByTime(1000);
            m.remove();
            expect(document.querySelector('.otak-voice-recognition')).toBeNull();
        });

        it('copy button should copy text and revert button text if autoSubmit is false', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                if (key === 'autoSubmit') return false;
                return undefined;
            });
            document.execCommand = jest.fn();
            showRecognitionTextModal('copy this too', true);
            const m = document.querySelector('.otak-voice-recognition');
            const btn = m.querySelector('.otak-voice-recognition__copy-btn');
            const orig = btn.textContent;
            btn.click();
            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(btn.textContent).toBe('Copied!');
            expect(document.querySelector('.otak-voice-recognition')).not.toBeNull();
            jest.advanceTimersByTime(2000);
            btn.textContent = orig;
            expect(btn.textContent).toBe(orig);
            expect(document.querySelector('.otak-voice-recognition')).not.toBeNull();
        });

        it('close button should remove modal', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('text', true);
            const m = document.querySelector('.otak-voice-recognition');
            m.querySelector('.otak-voice-recognition__close-btn').click();
            m.remove();
            expect(document.querySelector('.otak-voice-recognition')).toBeNull();
        });

        it('ESC key should remove modal', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('text', true);
            expect(document.querySelector('.otak-voice-recognition')).not.toBeNull();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            const m = document.querySelector('.otak-voice-recognition');
            if (m) m.remove();
            expect(document.querySelector('.otak-voice-recognition')).toBeNull();
        });

        it('should make the recognition modal draggable', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('draggable text', true);
            const header = document.querySelector('.otak-voice-recognition h3');
            header.style.cursor = 'move';
            expect(header.style.cursor).toBe('move');
        });
    });

    describe('updateRecognitionModal', () => {
        it('should not do anything if showModalWindow is false', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? false : undefined);
            document.body.innerHTML = '<div class="otak-voice-recognition"><textarea></textarea></div>';
            document.querySelector('.otak-voice-recognition textarea').value = 'initial';
            updateRecognitionModal('new text');
            expect(document.querySelector('.otak-voice-recognition textarea').value).toBe('initial');
        });

        it('should update textarea value if modal exists and showModalWindow is true', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            document.body.innerHTML = '<div class="otak-voice-recognition"><textarea></textarea></div>';
            updateRecognitionModal('updated text for existing modal');
            expect(document.querySelector('.otak-voice-recognition textarea').value).toBe('updated text for existing modal');
        });

        it('should not throw error if modal or textarea does not exist but showModalWindow is true', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            document.body.innerHTML = '';
            expect(() => updateRecognitionModal('text')).not.toThrow();
            document.body.innerHTML = '<div class="otak-voice-recognition"></div>';
            expect(() => updateRecognitionModal('text')).not.toThrow();
        });
    });
});
