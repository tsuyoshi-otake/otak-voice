/**
 * Settings Theme Module Tests
 * Tests for toggleTheme and applyTheme
 */

jest.mock('../../modules/state');
jest.mock('../../modules/event-bus');
jest.mock('../../modules/error-handler');
jest.mock('../../modules/settings-storage', () => ({
  saveSetting: jest.fn(),
}));

import { toggleTheme, applyTheme } from '../../modules/settings-theme';
import { getState } from '../../modules/state';
import { publish, publishStatus, EVENTS } from '../../modules/event-bus';
import * as errorHandler from '../../modules/error-handler';
import { saveSetting } from '../../modules/settings-storage';
import { THEME_MODES, DEFAULT_SETTINGS } from '../../constants';

describe('Settings Theme Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-otak-theme');

    global.chrome = {
      i18n: { getMessage: jest.fn((key) => key) },
      storage: {
        sync: { get: jest.fn(), set: jest.fn() },
      },
    };

    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();

    // Default: tryCatch calls the function directly
    errorHandler.tryCatch.mockImplementation((fn) => fn());
    errorHandler.createError.mockImplementation(() => new Error('Mock error'));

    getState.mockImplementation((key) => {
      if (key === 'themeMode') return THEME_MODES.DARK;
      return null;
    });

    saveSetting.mockResolvedValue(undefined);
  });

  describe('applyTheme', () => {
    it('should return the theme when skipDomOperations is true', () => {
      expect(applyTheme(THEME_MODES.LIGHT, true)).toBe(THEME_MODES.LIGHT);
      expect(applyTheme(THEME_MODES.DARK, true)).toBe(THEME_MODES.DARK);
    });

    it('should fallback to DEFAULT_SETTINGS.THEME for an invalid theme value', () => {
      const result = applyTheme('invalid-theme', true);
      expect(result).toBe(DEFAULT_SETTINGS.THEME);
      expect(console.warn).toHaveBeenCalled();
    });

    it('should warn with invalid theme message', () => {
      applyTheme('bogus', true);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('bogus'));
    });

    it('should set data-otak-theme attribute on document.documentElement', () => {
      applyTheme(THEME_MODES.LIGHT);
      expect(document.documentElement.getAttribute('data-otak-theme')).toBe(THEME_MODES.LIGHT);
    });

    it('should set data-otak-theme to dark', () => {
      applyTheme(THEME_MODES.DARK);
      expect(document.documentElement.getAttribute('data-otak-theme')).toBe(THEME_MODES.DARK);
    });

    it('should update theme-select element value when present', () => {
      const select = document.createElement('select');
      select.id = 'theme-select';
      const optLight = document.createElement('option');
      optLight.value = THEME_MODES.LIGHT;
      const optDark = document.createElement('option');
      optDark.value = THEME_MODES.DARK;
      select.appendChild(optLight);
      select.appendChild(optDark);
      document.body.appendChild(select);

      applyTheme(THEME_MODES.LIGHT);
      expect(select.value).toBe(THEME_MODES.LIGHT);

      applyTheme(THEME_MODES.DARK);
      expect(select.value).toBe(THEME_MODES.DARK);
    });

    it('should add active class to theme-toggle-btn when theme is LIGHT', () => {
      const btn = document.createElement('div');
      btn.className = 'otak-voice-menu__theme-toggle-btn';
      document.body.appendChild(btn);

      applyTheme(THEME_MODES.LIGHT);
      expect(btn.classList.contains('otak-voice-menu__theme-toggle-btn--active')).toBe(true);
    });

    it('should remove active class from theme-toggle-btn when theme is DARK', () => {
      const btn = document.createElement('div');
      btn.className = 'otak-voice-menu__theme-toggle-btn otak-voice-menu__theme-toggle-btn--active';
      document.body.appendChild(btn);

      applyTheme(THEME_MODES.DARK);
      expect(btn.classList.contains('otak-voice-menu__theme-toggle-btn--active')).toBe(false);
    });

    it('should set title on theme-toggle-btn to "themeToggleToDark" for LIGHT theme', () => {
      const btn = document.createElement('div');
      btn.className = 'otak-voice-menu__theme-toggle-btn';
      document.body.appendChild(btn);

      applyTheme(THEME_MODES.LIGHT);
      expect(btn.title).toBe('themeToggleToDark');
    });

    it('should set title on theme-toggle-btn to "themeToggleToLight" for DARK theme', () => {
      const btn = document.createElement('div');
      btn.className = 'otak-voice-menu__theme-toggle-btn';
      document.body.appendChild(btn);

      applyTheme(THEME_MODES.DARK);
      expect(btn.title).toBe('themeToggleToLight');
    });

    it('should set data-theme attribute on recognition modal when present', () => {
      const modal = document.createElement('div');
      modal.className = 'otak-voice-recognition';
      document.body.appendChild(modal);

      applyTheme(THEME_MODES.LIGHT);
      expect(modal.getAttribute('data-theme')).toBe(THEME_MODES.LIGHT);
    });

    it('should not throw when optional DOM elements are absent', () => {
      expect(() => applyTheme(THEME_MODES.LIGHT)).not.toThrow();
    });

    it('should handle DOM errors gracefully and not throw', () => {
      jest.spyOn(document.documentElement, 'setAttribute').mockImplementationOnce(() => {
        throw new Error('DOM error');
      });
      expect(() => applyTheme(THEME_MODES.LIGHT)).not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('should return the theme even after a DOM error', () => {
      jest.spyOn(document.documentElement, 'setAttribute').mockImplementationOnce(() => {
        throw new Error('DOM error');
      });
      const result = applyTheme(THEME_MODES.DARK);
      expect(result).toBe(THEME_MODES.DARK);
    });
  });

  describe('toggleTheme', () => {
    it('should switch from DARK to LIGHT and save the new theme', async () => {
      getState.mockImplementation((key) => {
        if (key === 'themeMode') return THEME_MODES.DARK;
        return null;
      });

      await toggleTheme();

      expect(saveSetting).toHaveBeenCalledWith('themeMode', THEME_MODES.LIGHT);
    });

    it('should switch from LIGHT to DARK and save the new theme', async () => {
      getState.mockImplementation((key) => {
        if (key === 'themeMode') return THEME_MODES.LIGHT;
        return null;
      });

      await toggleTheme();

      expect(saveSetting).toHaveBeenCalledWith('themeMode', THEME_MODES.DARK);
    });

    it('should publish STATUS_UPDATED with "statusThemeLight" when toggling to LIGHT', async () => {
      getState.mockImplementation((key) => {
        if (key === 'themeMode') return THEME_MODES.DARK;
        return null;
      });

      await toggleTheme();

      expect(publishStatus).toHaveBeenCalledWith('statusThemeLight');
    });

    it('should publish STATUS_UPDATED with "statusThemeDark" when toggling to DARK', async () => {
      getState.mockImplementation((key) => {
        if (key === 'themeMode') return THEME_MODES.LIGHT;
        return null;
      });

      await toggleTheme();

      expect(publishStatus).toHaveBeenCalledWith('statusThemeDark');
    });

    it('should return true on success', async () => {
      const result = await toggleTheme();
      expect(result).toBe(true);
    });

    it('should delegate error handling to tryCatch wrapper', async () => {
      const mockError = new Error('Storage failure');
      errorHandler.tryCatch.mockRejectedValueOnce(mockError);

      await expect(toggleTheme()).rejects.toThrow('Storage failure');
    });

    it('should pass correct errorCode option to tryCatch', async () => {
      await toggleTheme();
      expect(errorHandler.tryCatch).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ source: 'settings' })
      );
    });
  });
});
