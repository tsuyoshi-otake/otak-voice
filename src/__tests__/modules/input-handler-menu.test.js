/**
 * Input Handler Menu Module テスト
 * Tests for: toggleMenu, updateMenuState, toggleSettingsModal,
 *            updateAutoSubmitButtonState, toggleAutoSubmit
 */

jest.mock('../../site-handlers/site-detector.js', () => ({
  getSiteHandler: jest.fn(() => ({
    findBestInputField: jest.fn(() => null),
    submitAfterVoiceInput: jest.fn(() => true)
  }))
}));

jest.mock('../../modules/gpt-service.js', () => ({
  proofreadWithGPT: jest.fn(() => Promise.resolve('corrected text'))
}));

jest.mock('../../modules/state.js', () => ({
  getState: jest.fn(key => null),
  setState: jest.fn(() => true),
  subscribe: jest.fn(() => jest.fn()),
  initializeState: jest.fn()
}));

jest.mock('../../modules/event-bus.js', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
  EVENTS: {
    STATUS_UPDATED: 'status:updated',
    AUTO_SUBMIT_STATE_CHANGED: 'autoSubmit:changed',
    MENU_TOGGLED: 'menu:toggled',
    SETTINGS_MODAL_TOGGLED: 'settings:modal:toggled',
    AUTO_SUBMIT_TOGGLED: 'auto:submit:toggled',
    INPUT_CLEARED: 'input:cleared',
    GPT_PROOFREADING_STARTED: 'gpt:proofreading:started',
    INPUT_FIELD_FOUND: 'input:field:found',
    SPEECH_RECOGNITION_RESULT: 'speech:recognition:result',
    MENU_STATE_UPDATE_NEEDED: 'menu:state:update:needed',
    INPUT_HANDLERS_UPDATE_NEEDED: 'input:handlers:update:needed',
    ERROR_OCCURRED: 'error:occurred'
  }
}));

jest.mock('../../modules/ui.js', () => ({
  updateSettingsModalValues: jest.fn()
}));

jest.mock('../../modules/error-handler.js', () => ({
  createError: jest.fn(),
  handleError: jest.fn(),
  tryCatch: jest.fn((fn) => {
    try {
      return fn();
    } catch (e) {
      return null;
    }
  }),
  ERROR_CODE: {
    DOM_ERROR: { INPUT_OPERATION_FAILED: 'DOM_INPUT_OPERATION_FAILED' },
    STORAGE: { LOAD_FAILED: 'STORAGE_LOAD_FAILED', SAVE_FAILED: 'STORAGE_SAVE_FAILED' },
    INPUT: { MISSING_API_KEY: 'INPUT_MISSING_API_KEY' },
    API: { SERVER_ERROR: 'API_SERVER_ERROR' }
  },
  ERROR_CATEGORY: { DOM: 'DOM_ERROR', STORAGE: 'STORAGE', INPUT: 'INPUT', API: 'API' },
  ERROR_SEVERITY: { WARNING: 'WARNING', ERROR: 'ERROR' }
}));

jest.mock('../../modules/dom-utils.js', () => ({
  isInputElement: jest.fn(() => true),
  writeToInputField: jest.fn(() => true),
  clearInputField: jest.fn(() => true),
  findBestInputField: jest.fn(() => null),
  dispatchEvent: jest.fn(() => true)
}));

import * as inputHandler from '../../modules/input-handler.js';
import { THEME_MODES } from '../../constants.js';
import * as stateModule from '../../modules/state.js';
import * as eventBus from '../../modules/event-bus.js';
import { resetDOM } from '../../utils/dom-helpers.js';

global.chrome = {
  storage: {
    sync: {
      get: jest.fn(() => Promise.resolve({})),
      set: jest.fn(() => Promise.resolve())
    }
  },
  i18n: {
    getMessage: jest.fn(key => key)
  }
};

describe('Input Handler Menu Module', () => {
  beforeEach(() => {
    resetDOM();
    jest.clearAllMocks();

    stateModule.getState.mockImplementation(key => {
      const stateValues = {
        menuExpanded: false,
        autoSubmit: false,
        apiKey: 'test-key',
        recognitionLang: 'ja-JP',
        autoDetectInputFields: true,
        autoCorrection: false,
        useHistoryContext: false,
        themeMode: THEME_MODES.DARK,
        processingState: 'idle',
        isListening: false,
        lastClickedInput: null,
        currentInputElement: null,
        originalText: '',
        useRecognitionModal: false
      };
      return key ? stateValues[key] : { ...stateValues };
    });

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('toggleMenu', () => {
    test('要素がない場合', () => {
      inputHandler.toggleMenu();
      expect(stateModule.setState).not.toHaveBeenCalled();
    });

    test('false -> true', () => {
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);

      stateModule.getState.mockReturnValueOnce(false);
      inputHandler.toggleMenu();
      expect(stateModule.setState).toHaveBeenCalledWith('menuExpanded', true);
    });

    test('true -> false', () => {
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);

      stateModule.getState.mockReturnValueOnce(true);
      inputHandler.toggleMenu();
      expect(stateModule.setState).toHaveBeenCalledWith('menuExpanded', false);
    });
  });

  describe('updateMenuState', () => {
    test('expanded', () => {
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);

      stateModule.getState.mockReturnValueOnce(true);
      inputHandler.updateMenuState();
      expect(menuContainer.classList.contains('otak-voice-menu__container--expanded')).toBe(true);
    });

    test('collapsed', () => {
      const menuContainer = document.createElement('div');
      menuContainer.id = 'otak-voice-menu-container';
      menuContainer.classList.add('otak-voice-menu__container--expanded');
      const menuButton = document.createElement('button');
      menuButton.id = 'otak-voice-menu-btn';
      menuButton.classList.add('otak-voice-menu__btn--expanded');
      const historyPanel = document.createElement('div');
      historyPanel.id = 'otak-voice-history-panel';
      historyPanel.style.display = 'block';
      const settingsModal = document.createElement('div');
      settingsModal.id = 'otak-voice-settings-modal';
      settingsModal.style.display = 'block';
      document.body.appendChild(menuContainer);
      document.body.appendChild(menuButton);
      document.body.appendChild(historyPanel);
      document.body.appendChild(settingsModal);

      stateModule.getState.mockReturnValueOnce(false);
      inputHandler.updateMenuState();
      expect(menuContainer.classList.contains('otak-voice-menu__container--expanded')).toBe(false);
      expect(historyPanel.style.display).toBe('none');
    });

    test('要素がない場合', () => {
      inputHandler.updateMenuState();
      expect(console.log).toHaveBeenCalledWith('Menu elements not found');
    });
  });

  describe('toggleSettingsModal', () => {
    test('表示切り替え', () => {
      const modal = document.createElement('div');
      modal.id = 'otak-voice-settings-modal';
      modal.style.display = 'none';
      document.body.appendChild(modal);

      expect(modal.style.display).toBe('none');
      inputHandler.toggleSettingsModal();
      expect(modal.style.display).toBe('block');
      inputHandler.toggleSettingsModal();
      expect(modal.style.display).toBe('none');
    });

    test('モーダルがない場合', () => {
      inputHandler.toggleSettingsModal();
      expect(true).toBe(true);
    });
  });

  describe('updateAutoSubmitButtonState', () => {
    test('enabled', () => {
      const autoSubmitButton = document.createElement('button');
      autoSubmitButton.className = 'otak-voice-menu__append-btn otak-voice-menu__append-btn--active';
      const statusElem = document.createElement('div');
      statusElem.className = 'otak-voice-status';
      document.body.appendChild(autoSubmitButton);
      document.body.appendChild(statusElem);

      inputHandler.updateAutoSubmitButtonState(true);
      expect(autoSubmitButton.classList.contains('otak-voice-menu__append-btn--active')).toBe(false);
      expect(eventBus.publish).toHaveBeenCalledWith(
        eventBus.EVENTS.STATUS_UPDATED,
        expect.objectContaining({ messageKey: 'statusAutoSubmitOn' })
      );
    });

    test('disabled', () => {
      const autoSubmitButton = document.createElement('button');
      autoSubmitButton.className = 'otak-voice-menu__append-btn';
      const statusElem = document.createElement('div');
      statusElem.className = 'otak-voice-status';
      document.body.appendChild(autoSubmitButton);
      document.body.appendChild(statusElem);

      inputHandler.updateAutoSubmitButtonState(false);
      expect(autoSubmitButton.classList.contains('otak-voice-menu__append-btn--active')).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith(
        eventBus.EVENTS.STATUS_UPDATED,
        expect.objectContaining({ messageKey: 'statusAutoSubmitOff' })
      );
    });

    test('ボタンがない場合', () => {
      inputHandler.updateAutoSubmitButtonState(true);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('toggleAutoSubmit', () => {
    test('menu button', () => {
      stateModule.getState.mockReturnValueOnce(false);
      inputHandler.toggleAutoSubmit(true);
      expect(stateModule.setState).toHaveBeenCalledWith('autoSubmit', true);
    });

    test('settings modal', () => {
      const autoSubmitCheckbox = document.createElement('input');
      autoSubmitCheckbox.id = 'auto-submit-checkbox';
      autoSubmitCheckbox.type = 'checkbox';
      document.body.appendChild(autoSubmitCheckbox);

      inputHandler.toggleAutoSubmit(false);
      expect(console.log).toHaveBeenCalledWith('Auto submit checkbox changed, will be applied when Save is clicked');
    });
  });
});
