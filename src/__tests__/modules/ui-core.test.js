import {
    createUI,
    createMenuItem,
    removeExistingElements,
    createHistoryPanel,
} from '../../modules/ui';
import * as history from '../../modules/history';
import * as state from '../../modules/state';
import * as eventBus from '../../modules/event-bus';
import * as settings from '../../modules/settings';
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

describe('UI Module - Core', () => {
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
            expect(menuContainer.querySelector('.otak-voice-menu__clear-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__proofread-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__edit-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__settings-btn')).not.toBeNull();
            expect(menuContainer.querySelector('.otak-voice-menu__history-btn')).not.toBeNull();
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
            state.getState.mockImplementation(key => {
                if (key === 'showModalWindow') return true;
                return undefined;
            });
            modalToggleBtn.click();
            expect(settings.saveSetting).toHaveBeenCalledWith('showModalWindow', false);
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

            mockInput.value = '';
             state.getState.mockImplementation((key) => {
                if (key === 'currentInputElement') return mockInput;
                if (key === 'processingState') return mockPROCESSING_STATE.IDLE;
                return undefined;
            });
            document.body.innerHTML = '';
            createUI();
            const proofreadButtonEmpty = document.querySelector('.otak-voice-menu__proofread-btn');
            const editButtonEmpty = document.querySelector('.otak-voice-menu__edit-btn');
            expect(proofreadButtonEmpty.classList.contains('otak-voice-menu__item--disabled')).toBe(true);
            expect(editButtonEmpty.classList.contains('otak-voice-menu__item--disabled')).toBe(true);
        });
    });

    describe('createMenuItem', () => {
        it('should create a menu item with correct class, icon, and label', () => {
            const item = createMenuItem('test-item', Icons.MIC_ICON, 'Test Tooltip');
            expect(item.classList.contains('otak-voice-menu__test-item')).toBe(true);
            expect(item.classList.contains('otak-voice-menu__item')).toBe(true);
            expect(item.querySelector('.otak-voice-menu__icon-container').innerHTML).toContain('svg');
            expect(item.querySelector('.otak-voice-menu__label').textContent).toBe('Test Tooltip');
            expect(item.hasAttribute('title')).toBe(false);
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
            expect(document.querySelector('span')).not.toBeNull();
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
});
