/**
 * Tests for constants.js - verify exported values and structure
 */
import {
  API_KEY_STORAGE_KEY,
  RECOGNITION_LANG_STORAGE_KEY,
  MAX_HISTORY,
  SITE_TYPES,
  GPT_MODELS,
  THEME_MODES,
  DEFAULT_SETTINGS,
  PROCESSING_STATE
} from '../constants.js';

describe('Constants', () => {
  describe('Storage keys', () => {
    it('should define string storage keys', () => {
      expect(typeof API_KEY_STORAGE_KEY).toBe('string');
      expect(typeof RECOGNITION_LANG_STORAGE_KEY).toBe('string');
      expect(API_KEY_STORAGE_KEY).toBe('gpt_api_key');
    });
  });

  describe('MAX_HISTORY', () => {
    it('should be a positive number', () => {
      expect(MAX_HISTORY).toBeGreaterThan(0);
      expect(MAX_HISTORY).toBe(10);
    });
  });

  describe('SITE_TYPES', () => {
    it('should define all expected site types', () => {
      expect(SITE_TYPES).toHaveProperty('SYSTEMEXE');
      expect(SITE_TYPES).toHaveProperty('TWITTER');
      expect(SITE_TYPES).toHaveProperty('AI_CHAT');
      expect(SITE_TYPES).toHaveProperty('DEFAULT');
    });

    it('should have unique values', () => {
      const values = Object.values(SITE_TYPES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('GPT_MODELS', () => {
    it('should define correction and proofreading models', () => {
      expect(GPT_MODELS.CORRECTION).toBe('gpt-4.1-mini');
      expect(GPT_MODELS.PROOFREADING).toBe('gpt-5.2');
      expect(GPT_MODELS.EDITING).toBe('gpt-5.2');
    });
  });

  describe('THEME_MODES', () => {
    it('should define dark and light modes', () => {
      expect(THEME_MODES.DARK).toBe('dark');
      expect(THEME_MODES.LIGHT).toBe('light');
    });
  });

  describe('DEFAULT_SETTINGS', () => {
    it('should have required default settings', () => {
      expect(DEFAULT_SETTINGS).toHaveProperty('RECOGNITION_LANG');
      expect(DEFAULT_SETTINGS).toHaveProperty('AUTO_DETECT_INPUT_FIELDS');
      expect(DEFAULT_SETTINGS).toHaveProperty('AUTO_CORRECTION');
      expect(DEFAULT_SETTINGS).toHaveProperty('THEME');
      expect(DEFAULT_SETTINGS).toHaveProperty('SILENCE_TIMEOUT');
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_SETTINGS.RECOGNITION_LANG).toBe('ja-JP');
      expect(DEFAULT_SETTINGS.AUTO_CORRECTION).toBe(false);
      expect(DEFAULT_SETTINGS.SILENCE_TIMEOUT).toBeGreaterThanOrEqual(500);
      expect(DEFAULT_SETTINGS.SILENCE_TIMEOUT).toBeLessThanOrEqual(10000);
    });

    it('should have default theme matching THEME_MODES', () => {
      expect([THEME_MODES.DARK, THEME_MODES.LIGHT]).toContain(DEFAULT_SETTINGS.THEME);
    });
  });

  describe('PROCESSING_STATE', () => {
    it('should define all processing states', () => {
      expect(PROCESSING_STATE).toHaveProperty('IDLE');
      expect(PROCESSING_STATE).toHaveProperty('PROOFREADING');
      expect(PROCESSING_STATE).toHaveProperty('EDITING');
      expect(PROCESSING_STATE).toHaveProperty('CORRECTING');
    });

    it('should have unique values', () => {
      const values = Object.values(PROCESSING_STATE);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });
});
