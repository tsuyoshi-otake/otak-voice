/**
 * @jest.environment jsdom
 */

import {
  ERROR_CATEGORY,
  ERROR_CODE,
  ERROR_MESSAGE_KEYS,
  ERROR_SEVERITY,
  AppError
} from '../../modules/error-handler.js';

// Mock the event-bus module
import * as eventBus from '../../modules/event-bus.js';
jest.mock('../../modules/event-bus.js', () => ({
  publish: jest.fn(),
  EVENTS: {
    ERROR_OCCURRED: 'error:occurred',
    STATUS_UPDATED: 'status:updated'
  }
}));

describe('Error Handler Module - Types & Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constants', () => {
    test('ERROR_CATEGORY contains all expected categories', () => {
      expect(ERROR_CATEGORY.NETWORK).toBe('network');
      expect(ERROR_CATEGORY.API).toBe('api');
      expect(ERROR_CATEGORY.INPUT).toBe('input');
      expect(ERROR_CATEGORY.PERMISSION).toBe('permission');
      expect(ERROR_CATEGORY.SPEECH).toBe('speech');
      expect(ERROR_CATEGORY.STORAGE).toBe('storage');
      expect(ERROR_CATEGORY.DOM).toBe('dom');
      expect(ERROR_CATEGORY.UNKNOWN).toBe('unknown');
    });

    test('ERROR_CODE contains codes for all categories', () => {
      Object.values(ERROR_CATEGORY).forEach(category => {
        expect(ERROR_CODE[category]).toBeDefined();
        expect(Object.keys(ERROR_CODE[category]).length).toBeGreaterThan(0);
      });

      expect(ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED).toBe('network_fetch_failed');
      expect(ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT).toBe('api_rate_limit');
      expect(ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY).toBe('input_missing_api_key');
      expect(ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_DENIED).toBe('permission_mic_denied');
      expect(ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED).toBe('speech_not_supported');
      expect(ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED).toBe('storage_save_failed');
      expect(ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND).toBe('dom_element_not_found');
      expect(ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL).toBe('unknown_error');
    });

    test('ERROR_MESSAGE_KEYS maps error codes to i18n message keys', () => {
      expect(ERROR_MESSAGE_KEYS[ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED]).toBe('errorNetworkFetchFailed');
      expect(ERROR_MESSAGE_KEYS[ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT]).toBe('errorApiRateLimit');
      expect(ERROR_MESSAGE_KEYS[ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY]).toBe('statusApiKeyMissing');
      expect(ERROR_MESSAGE_KEYS[ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_DENIED]).toBe('statusSpeechErrorNotAllowed');
    });

    test('ERROR_SEVERITY contains all expected severity levels', () => {
      expect(ERROR_SEVERITY.INFO).toBe('info');
      expect(ERROR_SEVERITY.WARNING).toBe('warning');
      expect(ERROR_SEVERITY.ERROR).toBe('error');
      expect(ERROR_SEVERITY.CRITICAL).toBe('critical');
    });
  });

  describe('AppError class', () => {
    test('creates an error with the correct properties', () => {
      const code = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const message = 'Network fetch failed';
      const severity = ERROR_SEVERITY.ERROR;
      const originalError = new Error('Original error');
      const details = { url: 'https://example.com' };

      const error = new AppError(code, message, severity, originalError, details);

      expect(error.name).toBe('AppError');
      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
      expect(error.severity).toBe(severity);
      expect(error.originalError).toBe(originalError);
      expect(error.details).toBe(details);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    test('uses default values when optional parameters are not provided', () => {
      const code = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const message = 'Network fetch failed';

      const error = new AppError(code, message);

      expect(error.severity).toBe(ERROR_SEVERITY.ERROR);
      expect(error.originalError).toBeNull();
      expect(error.details).toBeNull();
    });
  });
});
