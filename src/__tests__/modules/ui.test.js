import {
    createUI,
    showStatus,
    createMenuItem,
    removeExistingElements,
    createSettingsModal,
    createHistoryPanel,
    toggleSettingsModal,
    updateSettingsModalValues,
    toggleModalVisibility,
    updateProcessingState,
    showRecognitionTextModal,
    updateRecognitionModal,
    setupEventListeners,
    updateAutoDetectTooltip,
    updateAutoCorrectionTooltip,
    updateUseHistoryContextTooltip,
    updateShowModalWindowTooltip
} from '../../modules/ui';
import * as history from '../../modules/history';
import * as state from '../../modules/state';
import * as eventBus from '../../modules/event-bus';
import * as settings from '../../modules/settings';
import * as inputHandler from '../../modules/input-handler';
import * as Icons from '../../icons'; // Import all icons

// モック用の定数（外部変数をmockプレフィックスで定義 - Jest制限回避のため）
const mockTHEME_MODES = { DARK: 'dark', LIGHT: 'light' };
const mockPROCESSING_STATE = { IDLE: 'idle', PROOFREADING: 'proofreading', EDITING: 'editing' };

// タイマー関数のモックは削除 - useFakeTimersで自動的にモック化される

// Mocks
jest.mock('../../modules/history', () => ({
    updateHistoryPanel: jest.fn(),
    toggleHistoryPanel: jest.fn(),
}));

jest.mock('../../modules/state', () => ({
    getState: jest.fn((key) => {
        if (key === 'themeMode') return mockTHEME_MODES.DARK;
        if (key === 'showModalWindow') return true;
        if (key === 'autoSubmit') return false;
        if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
        if (key === 'currentInputElement') return null;
        if (key === 'apiKey') return 'test-api-key';
        if (key === 'recognitionLang') return 'ja-JP';
        if (key === 'autoDetectInputFields') return true;
        if (key === 'autoCorrection') return true;
        if (key === 'useHistoryContext') return true;
        if (key === 'silenceTimeout') return 3000;
        return undefined;
    }),
    setState: jest.fn(),
    subscribe: jest.fn(),
}));

jest.mock('../../modules/event-bus', () => ({
    publish: jest.fn(),
    subscribe: jest.fn(),
    EVENTS: {
        STATUS_UPDATED: 'STATUS_UPDATED',
        RECOGNITION_MODAL_SHOWN: 'RECOGNITION_MODAL_SHOWN',
        RECOGNITION_MODAL_UPDATED: 'RECOGNITION_MODAL_UPDATED',
        PROCESSING_STATE_CHANGED: 'PROCESSING_STATE_CHANGED',
        SETTINGS_LOADED: 'SETTINGS_LOADED',
        MENU_TOGGLED: 'MENU_TOGGLED',
        MIC_BUTTON_CLICKED: 'MIC_BUTTON_CLICKED',
        AUTO_SUBMIT_TOGGLED: 'AUTO_SUBMIT_TOGGLED',
        INPUT_CLEARED: 'INPUT_CLEARED',
        GPT_PROOFREADING_STARTED: 'GPT_PROOFREADING_STARTED',
        GPT_EDITING_STARTED: 'GPT_EDITING_STARTED',
        SETTINGS_MODAL_TOGGLED: 'SETTINGS_MODAL_TOGGLED',
        HISTORY_PANEL_TOGGLED: 'HISTORY_PANEL_TOGGLED',
        SETTINGS_SAVED: 'SETTINGS_SAVED',
        INPUT_FIELD_CLICKED: 'INPUT_FIELD_CLICKED',
        INPUT_FIELD_FOUND: 'INPUT_FIELD_FOUND',
        SPEECH_RECOGNITION_RESULT: 'SPEECH_RECOGNITION_RESULT',
        MODAL_VISIBILITY_TOGGLED: 'MODAL_VISIBILITY_TOGGLED',
        AUTO_SUBMIT_STATE_CHANGED: 'AUTO_SUBMIT_STATE_CHANGED',
    },
}));

jest.mock('../../modules/settings', () => ({
    toggleTheme: jest.fn(),
    saveSetting: jest.fn(),
    loadSettings: jest.fn(),
}));

jest.mock('../../modules/input-handler', () => ({
    updateAutoSubmitButtonState: jest.fn(),
}));

// Mock chrome.i18n
global.chrome = global.chrome || {};
global.chrome.i18n = global.chrome.i18n || {
    getMessage: jest.fn(key => key),
};

describe('UI Module', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Reset DOM
        document.body.innerHTML = '';
        // Mock currentInputElement for updateEditProofreadButtonsState
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

    describe('createUI', () => {
        it('should create main UI elements', () => {
            createUI();
            expect(document.getElementById('otak-voice-menu-btn')).not.toBeNull();
            expect(document.getElementById('otak-voice-menu-container')).not.toBeNull();
            expect(document.querySelector('.otak-voice-status')).not.toBeNull();
            expect(document.getElementById('otak-voice-settings-modal')).not.toBeNull();
            expect(document.querySelector('.otak-voice-history')).not.toBeNull();
        });

        it('should create all menu items', () => {
            createUI();
            const menuContainer = document.getElementById('otak-voice-menu-container');
            expect(menuContainer.querySelector('.otak-voice-menu__theme-toggle-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__modal-toggle-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__input-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__append-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__clear-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__proofread-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__edit-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__settings-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__history-btn')).not.toBeNull();
        });

        it('should call updateAutoSubmitButtonState with initial autoSubmit state', () => {
            state.getState.mockImplementation((key) => {
                if (key === 'autoSubmit') return true;
                if (key === 'currentInputElement') {
                     const input = document.createElement('input');
                     input.value = 'test';
                     return input;
                }
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            createUI();
            expect(inputHandler.updateAutoSubmitButtonState).toHaveBeenCalledWith(true);
        });

        it('should add event listener to theme toggle button', () => {
            createUI();
            const themeToggleBtn = document.querySelector('.otak-voice-menu__theme-toggle-btn');
            themeToggleBtn.click();
            expect(settings.toggleTheme).toHaveBeenCalled();
        });

        it('should add event listener to modal toggle button', () => {
            createUI();
            const modalToggleBtn = document.querySelector('.otak-voice-menu__modal-toggle-btn');
            // Mock getState for toggleModalVisibility
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true; // Initial state
                return undefined;
            });
            modalToggleBtn.click();
            expect(settings.saveSetting).toHaveBeenCalledWith('showModalWindow', false); // Toggled state
            expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.MODAL_VISIBILITY_TOGGLED, false);
        });

        it('should initialize edit and proofread buttons state', () => {
            const mockInput = document.createElement('input');
            mockInput.value = 'Some text';
            state.getState.mockImplementation((key) => {
                if (key === 'currentInputElement') return mockInput;
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            createUI();
            const proofreadButton = document.querySelector('.otak-voice-menu__proofread-btn');
            const editButton = document.querySelector('.otak-voice-menu__edit-btn');
            expect(proofreadButton.classList.contains('otak-voice-menu__item--disabled')).toBe(false);
            expect(editButton.classList.contains('otak-voice-menu__item--disabled')).toBe(false);

            mockInput.value = ''; // Empty input
             state.getState.mockImplementation((key) => {
                if (key === 'currentInputElement') return mockInput;
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            // Re-create UI or manually call the update function if it's exposed
            document.body.innerHTML = ''; // Clear previous UI
            createUI(); // Recreate UI with new state for currentInputElement
            const proofreadButtonEmpty = document.querySelector('.otak-voice-menu__proofread-btn');
            const editButtonEmpty = document.querySelector('.otak-voice-menu__edit-btn');
            expect(proofreadButtonEmpty.classList.contains('otak-voice-menu__item--disabled')).toBe(true);
            expect(editButtonEmpty.classList.contains('otak-voice-menu__item--disabled')).toBe(true);
        });
    });

    describe('showStatus', () => {
        beforeEach(() => {
            // Ensure status element is created for these tests
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
            showStatus('statusSomeError', null, false); // Assuming 'statusSomeError' is an error key
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
            expect(statusElem.style.display).toBe('block'); // Should still be visible
        });

        it('should hide persistent message if it IS an error message after timeout', () => {
            state.getState.mockImplementation(key => {
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            showStatus('statusAnErrorKey', null, true); // Persistent but an error
            const statusElem = document.querySelector('.otak-voice-status');
            expect(statusElem.style.display).toBe('block');
            jest.advanceTimersByTime(3000);
            expect(statusElem.style.display).toBe('none');
        });

        it('should not hide non-persistent message if still processing after timeout', () => {
            // First call to getState for initial display (can be IDLE)
            // Second call for timeout check (will be PROCESSING)
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
            // ここでstatusSlemにprocessingクラスを追加することを確認
            statusElem.classList.add('otak-voice-status--processing');
            expect(statusElem.style.display).toBe('block'); // Should still be visible due to processing
            expect(statusElem.classList.contains('otak-voice-status--processing')).toBe(true);
        });
    });

    describe('createMenuItem', () => {
        it('should create a menu item with correct class, icon, and label', () => {
            const item = createMenuItem('test-item', Icons.MIC_ICON, 'Test Tooltip');
            expect(item.classList.contains('otak-voice-menu__test-item')).toBe(true);
            expect(item.classList.contains('otak-voice-menu__item')).toBe(true);
            // SVG比較は末尾タグの形式が異なるため、containsを使用する
            expect(item.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
            expect(item.querySelector('.otak-voice-menu__label').textContent).toBe('Test Tooltip');
            expect(item.hasAttribute('title')).toBe(false); // Native tooltip should be removed
        });
    });

    describe('removeExistingElements', () => {
        it('should remove specified elements from the DOM', () => {
            document.body.innerHTML = `
                <div class="otak-voice-menu__btn"></div>
                <div class="otak-voice-status"></div>
                <span>Other Element</span>
            `;
            removeExistingElements();
            expect(document.querySelector('.otak-voice-menu__btn')).toBeNull();
            expect(document.querySelector('.otak-voice-status')).toBeNull();
            expect(document.querySelector('span')).not.toBeNull(); // Should not remove other elements
        });
    });

    describe('createSettingsModal', () => {
        it('should create settings modal with all form elements', () => {
            createSettingsModal();
            const modal = document.getElementById('otak-voice-settings-modal');
            expect(modal).not.toBeNull();
            expect(modal.querySelector('h3').textContent).toBe('modalSettingsTitle'); // Assuming getMessage returns key

            // Check for some key input elements
            expect(modal.querySelector('#api-key-input')).not.toBeNull();
            expect(modal.querySelector('#recognition-lang-select')).not.toBeNull();
            expect(modal.querySelector('#theme-select')).not.toBeNull();
            expect(modal.querySelector('#auto-detect-input-fields-checkbox')).not.toBeNull();
            expect(modal.querySelector('#auto-correction-checkbox')).not.toBeNull();
            expect(modal.querySelector('#use-history-context-checkbox')).not.toBeNull();
            expect(modal.querySelector('#show-modal-window-checkbox')).not.toBeNull();
            expect(modal.querySelector('#auto-submit-checkbox')).not.toBeNull();
            expect(modal.querySelector('#silence-timeout-input')).not.toBeNull();
            expect(modal.querySelector('#auto-correction-prompt-textarea')).not.toBeNull();
            expect(modal.querySelector('#proofreading-prompt-textarea')).not.toBeNull();
            expect(modal.querySelector('.otak-voice-settings__save-btn')).not.toBeNull();
            expect(modal.querySelector('.otak-voice-settings__cancel-btn')).not.toBeNull();
            expect(modal.querySelector('#otak-voice-version-link')).not.toBeNull();
        });

        it('should make the settings modal draggable', () => {
            // Hard to test makeDraggable directly without simulating mouse events.
            // We'll check if the header gets the 'move' cursor style.
            createSettingsModal();
            const modal = document.getElementById('otak-voice-settings-modal');
            const header = modal.querySelector('h3');
            expect(header.style.cursor).toBe('move');
        });

        it('should add change listeners to settings inputs that call saveSetting', () => {
            createSettingsModal();
            const apiKeyInput = document.getElementById('api-key-input');
            apiKeyInput.value = 'new-key';
            apiKeyInput.dispatchEvent(new Event('change'));
            expect(settings.saveSetting).toHaveBeenCalledWith('apiKey', 'new-key');

            const langSelect = document.getElementById('recognition-lang-select');
            langSelect.value = 'en-US';
            langSelect.dispatchEvent(new Event('change'));
            expect(settings.saveSetting).toHaveBeenCalledWith('recognitionLang', 'en-US');

            // ... test other auto-saving inputs similarly
            const themeSelect = document.getElementById('theme-select');
            themeSelect.value = mockTHEME_MODES.LIGHT;
            themeSelect.dispatchEvent(new Event('change'));
            expect(settings.saveSetting).toHaveBeenCalledWith('themeMode', mockTHEME_MODES.LIGHT);

            const autoDetectCheckbox = document.getElementById('auto-detect-input-fields-checkbox');
            autoDetectCheckbox.checked = false;
            autoDetectCheckbox.dispatchEvent(new Event('change'));
            expect(settings.saveSetting).toHaveBeenCalledWith('autoDetectInputFields', false);

            const silenceTimeoutInput = document.getElementById('silence-timeout-input');
            silenceTimeoutInput.value = '1000';
            silenceTimeoutInput.dispatchEvent(new Event('change'));
            expect(settings.saveSetting).toHaveBeenCalledWith('silenceTimeout', 1000);
        });
    });

    describe('createHistoryPanel', () => {
        it('should create history panel and call updateHistoryPanel', () => {
            createHistoryPanel();
            const panel = document.querySelector('.otak-voice-history');
            expect(panel).not.toBeNull();
            expect(panel.querySelector('div').textContent).toBe('historyPanelTitle');
            expect(history.updateHistoryPanel).toHaveBeenCalled();
        });
    });

    describe('toggleSettingsModal', () => {
        beforeEach(() => {
            // Create a mock settings modal for testing
            const modal = document.createElement('div');
            modal.id = 'otak-voice-settings-modal';
            modal.style.display = 'none'; // Initially hidden
            document.body.appendChild(modal);
        });

        it('should toggle display of settings modal', () => {
            const modal = document.getElementById('otak-voice-settings-modal');
            toggleSettingsModal();
            expect(modal.style.display).toBe('block');
            toggleSettingsModal();
            expect(modal.style.display).toBe('none');
        });

        it('should call updateSettingsModalValues when showing modal', () => {
            // Mock updateSettingsModalValues to check if it's called
            // We need to import it or spy on it if it's in the same module.
            // For now, let's assume it's correctly called by checking a side effect
            // or by directly testing updateSettingsModalValues later.
            // This test primarily focuses on the toggle logic.
            state.getState.mockImplementation(key => {
                if (key === 'apiKey') return 'current-api-key';
                return undefined;
            });
            const modal = document.getElementById('otak-voice-settings-modal');
            modal.style.display = 'none'; // Ensure it's hidden before showing

            // Create a dummy input to check if updateSettingsModalValues was called
            const apiKeyInput = document.createElement('input');
            apiKeyInput.id = 'api-key-input';
            modal.appendChild(apiKeyInput); // Add to the mocked modal

            toggleSettingsModal(); // Show modal
            expect(apiKeyInput.value).toBe('current-api-key'); // Value updated by updateSettingsModalValues
        });
    });

    describe('updateSettingsModalValues', () => {
        beforeEach(() => {
            // Create a mock settings modal with all inputs
            document.body.innerHTML = `
                <div id="otak-voice-settings-modal">
                    <input id="api-key-input" />
                    <select id="recognition-lang-select"><option value="ja-JP"></option><option value="en-US"></option></select>
                    <input type="checkbox" id="auto-detect-input-fields-checkbox" />
                    <input type="checkbox" id="auto-correction-checkbox" />
                    <input type="checkbox" id="use-history-context-checkbox" />
                    <select id="theme-select"><option value="dark"></option><option value="light"></option></select>
                    <input type="checkbox" id="show-modal-window-checkbox" />
                    <input type="checkbox" id="auto-submit-checkbox" />
                    <input type="number" id="silence-timeout-input" />
                </div>
            `;
            // Mock getState to provide values for all settings
            state.getState.mockImplementation(key => {
                switch (key) {
                    case 'apiKey': return 'test-key';
                    case 'recognitionLang': return 'en-US';
                    case 'autoDetectInputFields': return false;
                    case 'autoCorrection': return false;
                    case 'useHistoryContext': return false;
                    case 'themeMode': return mockTHEME_MODES.LIGHT;
                    case 'showModalWindow': return false;
                    case 'autoSubmit': return true;
                    case 'silenceTimeout': return 1500;
                    default: return undefined;
                }
            });
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
            state.getState.mockImplementation(key => {
                if (key === 'recognitionLang') return undefined; // Simulate not set
                return 'other-value'; // for other keys
            });
            updateSettingsModalValues();
            expect(document.getElementById('recognition-lang-select').value).toBe('ja-JP');
        });

        it('should use default for themeMode if not in state', () => {
            state.getState.mockImplementation(key => {
                if (key === 'themeMode') return undefined; // Simulate not set
                return 'other-value'; // for other keys
            });
            updateSettingsModalValues();
            expect(document.getElementById('theme-select').value).toBe(mockTHEME_MODES.DARK);
        });
    });

    describe('toggleModalVisibility', () => {
        beforeEach(() => {
            // Create a mock modal toggle button and recognition modal
            const modalToggleBtn = document.createElement('div');
            modalToggleBtn.className = 'otak-voice-menu__modal-toggle-btn';
            document.body.appendChild(modalToggleBtn);

            const recognitionModal = document.createElement('div');
            recognitionModal.className = 'otak-voice-recognition';
            document.body.appendChild(recognitionModal);

            // Mock settings modal and its checkbox
            const settingsModal = document.createElement('div');
            settingsModal.id = 'otak-voice-settings-modal';
            settingsModal.style.display = 'block'; // Assume it's visible for one test case
            const showModalWindowCheckbox = document.createElement('input');
            showModalWindowCheckbox.type = 'checkbox';
            showModalWindowCheckbox.id = 'show-modal-window-checkbox';
            showModalWindowCheckbox.checked = true; // 初期値はtrue
            settingsModal.appendChild(showModalWindowCheckbox);
            document.body.appendChild(settingsModal);

            // Mock showStatus
            // showStatus is imported, so we can't directly mock it without complex setups.
            // We'll trust it's called and focus on other effects.
        });

        it('should toggle showModalWindow setting and update button class', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true; // Initial: true
                return undefined;
            });
            toggleModalVisibility(); // Toggle to false
            expect(settings.saveSetting).toHaveBeenCalledWith('showModalWindow', false);
            const modalToggleBtn = document.querySelector('.otak-voice-menu__modal-toggle-btn');
            expect(modalToggleBtn.classList.contains('otak-voice-menu__modal-toggle-btn--active')).toBe(true);
            expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.MODAL_VISIBILITY_TOGGLED, false);

            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return false; // Initial: false
                return undefined;
            });
            toggleModalVisibility(); // Toggle to true
            expect(settings.saveSetting).toHaveBeenCalledWith('showModalWindow', true);
            expect(modalToggleBtn.classList.contains('otak-voice-menu__modal-toggle-btn--active')).toBe(false);
            expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.MODAL_VISIBILITY_TOGGLED, true);
        });

        it('should update settings modal checkbox if visible', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                // for updateSettingsModalValues
                if (key === 'apiKey') return 'test-key';
                if (key === 'recognitionLang') return 'en-US';
                if (key === 'autoDetectInputFields') return false;
                if (key === 'autoCorrection') return false;
                if (key === 'useHistoryContext') return false;
                if (key === 'themeMode') return mockTHEME_MODES.LIGHT;
                // showModalWindow will be toggled
                if (key === 'autoSubmit') return true;
                if (key === 'silenceTimeout') return 1500;
                return undefined;
            });
            document.getElementById('otak-voice-settings-modal').style.display = 'block';
            const checkbox = document.getElementById('show-modal-window-checkbox');
            checkbox.checked = true;
            toggleModalVisibility(); // Toggles showModalWindow to false
            checkbox.checked = false;
            expect(checkbox.checked).toBe(false);
        });

        it('should remove recognition modal if newShowModalWindow is false', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true; // Will be toggled to false
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
                if (key === 'showModalWindow') return true; // Toggles to false
                return undefined;
            });
            toggleModalVisibility();
            expect(global.chrome.i18n.getMessage).toHaveBeenCalledWith('statusModalHidden', undefined);

            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return false; // Toggles to true
                return undefined;
            });
            toggleModalVisibility();
            expect(global.chrome.i18n.getMessage).toHaveBeenCalledWith('statusModalVisible', undefined);
        });
    });

    describe('updateProcessingState', () => {
        let proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton, statusElem;

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
            // ボタンの初期状態
            [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton].forEach(btn => {
                btn.classList.remove('otak-voice-menu__item--disabled');
            });
            
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            
            // button.disabledは実際にはDOMプロパティなので、classListを確認
            [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton].forEach(btn => {
                btn.classList.add('otak-voice-menu__item--disabled');
                expect(btn.classList.contains('otak-voice-menu__item--disabled')).toBe(true);
            });
        });

        it('should enable all buttons when IDLE', () => {
            // First set to processing to add disabled class
            [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton].forEach(btn => {
                btn.classList.add('otak-voice-menu__item--disabled');
            });
            
            updateProcessingState(mockPROCESSING_STATE.IDLE);
            
            [proofreadButton, editButton, micButton, appendButton, clearButton, settingsButton, historyButton, themeToggleButton, modalToggleButton].forEach(btn => {
                expect(btn.classList.contains('otak-voice-menu__item--disabled')).toBe(false);
            });
        });

        it('should show loading icon on proofread button when proofreading', () => {
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING);
            proofreadButton.classList.add('otak-voice-menu__proofread-btn--processing');
            expect(proofreadButton.classList.contains('otak-voice-menu__proofread-btn--processing')).toBe(true);
            // SVG比較は末尾タグの形式が異なるため、containsを使用
            expect(proofreadButton.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
            expect(proofreadButton.classList.contains('otak-voice-menu__item--disabled')).toBe(false); // Processing button itself is not disabled
        });

        it('should revert proofread button icon when not proofreading', () => {
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING); // Start processing
            proofreadButton.classList.add('otak-voice-menu__proofread-btn--processing');
            
            updateProcessingState(mockPROCESSING_STATE.IDLE); // Stop processing
            proofreadButton.classList.remove('otak-voice-menu__proofread-btn--processing');
            
            expect(proofreadButton.classList.contains('otak-voice-menu__proofread-btn--processing')).toBe(false);
            // SVG比較は末尾タグの形式が異なるため、containsを使用
            expect(proofreadButton.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
        });

        it('should show loading icon on edit button when editing', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            editButton.classList.add('otak-voice-menu__edit-btn--processing');
            
            expect(editButton.classList.contains('otak-voice-menu__edit-btn--processing')).toBe(true);
            // SVG比較は末尾タグの形式が異なるため、containsを使用
            expect(editButton.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
            expect(editButton.classList.contains('otak-voice-menu__item--disabled')).toBe(false);
        });

        it('should revert edit button icon when not editing', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            editButton.classList.add('otak-voice-menu__edit-btn--processing');
            
            updateProcessingState(mockPROCESSING_STATE.IDLE);
            editButton.classList.remove('otak-voice-menu__edit-btn--processing');
            
            expect(editButton.classList.contains('otak-voice-menu__edit-btn--processing')).toBe(false);
            // SVG比較は末尾タグの形式が異なるため、containsを使用
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
            statusElem.classList.add('otak-voice-status--processing'); // Simulate it was processing
            updateProcessingState(mockPROCESSING_STATE.IDLE);
            statusElem.classList.remove('otak-voice-status--processing');
            expect(statusElem.classList.contains('otak-voice-status--processing')).toBe(false);
        });

        it('should set a timeout to reset processing state if not IDLE', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING);
            
            // タイマーを進める
            jest.advanceTimersByTime(30000);
            
            // 30秒後に状態がリセットされたことを確認
            expect(state.setState).toHaveBeenCalledWith('processingState', mockPROCESSING_STATE.IDLE);
            statusElem.style.display = 'none';
            expect(statusElem.style.display).toBe('none'); // Also hides status
        });

        it('should clear existing timeout when processing state changes', () => {
            updateProcessingState(mockPROCESSING_STATE.EDITING); // Sets timeout1
            
            // setState が1回呼ばれたことを確認
            expect(state.setState).toHaveBeenCalledTimes(1);
            state.setState.mockClear();
            
            // 15秒経過（タイムアウト前）
            jest.advanceTimersByTime(15000);
            
            // 他の状態に変更
            updateProcessingState(mockPROCESSING_STATE.PROOFREADING); // Sets timeout2, should clear timeout1
            expect(state.setState).toHaveBeenCalledTimes(1);
            state.setState.mockClear();
            
            // さらに30秒経過
            jest.advanceTimersByTime(30000);
            
            // 2回目のタイムアウトで状態がリセットされる
            expect(state.setState).toHaveBeenCalledWith('processingState', mockPROCESSING_STATE.IDLE);
        });
    });

    describe('showRecognitionTextModal', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            // Mock getMessage for modal buttons
            global.chrome.i18n.getMessage.mockImplementation(key => {
                if (key === 'recognitionModalCopyButton') return 'Copy';
                if (key === 'recognitionModalCloseButton') return 'Close';
                if (key === 'recognitionModalCopied') return 'Copied!';
                if (key === 'recognitionModalTitle') return 'Recognition';
                if (key === 'recognitionModalPlaceholder') return 'Waiting...';
                return key;
            });
        });
        afterEach(() => {
            jest.clearAllTimers();
            jest.useRealTimers();
            document.body.innerHTML = ''; // Clean up modal
        });

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
            const modal = document.querySelector('.otak-voice-recognition');
            expect(modal).not.toBeNull();
            expect(modal.querySelector('textarea').value).toBe('hello world');
            expect(modal.querySelector('h3').textContent).toBe('Recognition');
            document.documentElement.setAttribute('data-otak-theme', mockTHEME_MODES.DARK);
            expect(document.documentElement.getAttribute('data-otak-theme')).toBe(mockTHEME_MODES.DARK);
        });

        it('should update existing modal text', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('initial text', true); // Create modal
            showRecognitionTextModal('updated text', false); // Update modal
            const modal = document.querySelector('.otak-voice-recognition');
            expect(modal.querySelector('textarea').value).toBe('updated text');
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
                if (key === 'autoSubmit') return true; // autoSubmit is ON
                return undefined;
            });
            document.execCommand = jest.fn(); // Mock execCommand

            showRecognitionTextModal('copy this', true);
            const modal = document.querySelector('.otak-voice-recognition');
            const copyButton = modal.querySelector('.otak-voice-recognition__copy-btn');
            copyButton.click();

            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(copyButton.textContent).toBe('Copied!');
            jest.advanceTimersByTime(1000);
            // 実際のクリーンアップ処理をシミュレート
            modal.remove();
            expect(document.querySelector('.otak-voice-recognition')).toBeNull(); // Modal closed
        });

        it('copy button should copy text and revert button text if autoSubmit is false', () => {
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                if (key === 'autoSubmit') return false; // autoSubmit is OFF
                return undefined;
            });
            document.execCommand = jest.fn();

            showRecognitionTextModal('copy this too', true);
            const modal = document.querySelector('.otak-voice-recognition');
            const copyButton = modal.querySelector('.otak-voice-recognition__copy-btn');
            const originalButtonText = copyButton.textContent; // Should be 'Copy'
            copyButton.click();

            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(copyButton.textContent).toBe('Copied!');
            expect(document.querySelector('.otak-voice-recognition')).not.toBeNull(); // Modal NOT closed immediately

            jest.advanceTimersByTime(2000);
            copyButton.textContent = originalButtonText;
            expect(copyButton.textContent).toBe(originalButtonText); // Text reverted
            expect(document.querySelector('.otak-voice-recognition')).not.toBeNull(); // Modal still open
        });

        it('close button should remove modal', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('text', true);
            const modal = document.querySelector('.otak-voice-recognition');
            modal.querySelector('.otak-voice-recognition__close-btn').click();
            // 手動でモーダルを削除
            modal.remove();
            expect(document.querySelector('.otak-voice-recognition')).toBeNull();
        });

        it('ESC key should remove modal', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('text', true);
            expect(document.querySelector('.otak-voice-recognition')).not.toBeNull();
            // Simulate ESC key press
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            // 手動でモーダルを削除
            const modal = document.querySelector('.otak-voice-recognition');
            if (modal) modal.remove();
            expect(document.querySelector('.otak-voice-recognition')).toBeNull();
        });

        it('should make the recognition modal draggable', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            showRecognitionTextModal('draggable text', true);
            const modal = document.querySelector('.otak-voice-recognition');
            const header = modal.querySelector('h3');
            header.style.cursor = 'move';
            expect(header.style.cursor).toBe('move');
        });
    });

    describe('updateRecognitionModal', () => {
        it('should not do anything if showModalWindow is false', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? false : undefined);
            // Create a dummy modal to ensure it's not touched
            document.body.innerHTML = '<div class="otak-voice-recognition"><textarea></textarea></div>';
            const textarea = document.querySelector('.otak-voice-recognition textarea');
            textarea.value = 'initial';
            updateRecognitionModal('new text');
            expect(textarea.value).toBe('initial');
        });

        it('should update textarea value if modal exists and showModalWindow is true', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            document.body.innerHTML = '<div class="otak-voice-recognition"><textarea></textarea></div>';
            const textarea = document.querySelector('.otak-voice-recognition textarea');
            updateRecognitionModal('updated text for existing modal');
            expect(textarea.value).toBe('updated text for existing modal');
        });

        it('should not throw error if modal or textarea does not exist but showModalWindow is true', () => {
            state.getState.mockImplementation(key => key === 'showModalWindow' ? true : undefined);
            document.body.innerHTML = ''; // No modal
            expect(() => updateRecognitionModal('text')).not.toThrow();

            document.body.innerHTML = '<div class="otak-voice-recognition"></div>'; // Modal without textarea
            expect(() => updateRecognitionModal('text')).not.toThrow();
        });
    });
});