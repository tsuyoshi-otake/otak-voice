/**
 * @jest.environment jsdom
 */

import { 
  ERROR_CATEGORY, 
  ERROR_CODE, 
  ERROR_MESSAGE_KEYS, 
  ERROR_SEVERITY,
  AppError,
  createError,
  handleError,
  tryCatch,
  mapHttpStatusToErrorCode,
  mapSpeechErrorToErrorCode
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

describe('Error Handler Module', () => {
  // Clear mocks before each test
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
      // Check that each category has error codes
      Object.values(ERROR_CATEGORY).forEach(category => {
        expect(ERROR_CODE[category]).toBeDefined();
        expect(Object.keys(ERROR_CODE[category]).length).toBeGreaterThan(0);
      });

      // Check a few specific error codes
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
      // Check a few specific mappings
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

  describe('createError function', () => {
    test('creates an AppError with the specified error code', () => {
      const errorCode = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const error = createError(errorCode);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(errorCode);
      // In our test environment, chrome.i18n.getMessage returns the key itself
      expect(error.message).toBe('errorNetworkFetchFailed');
    });

    test('uses custom message when provided', () => {
      const errorCode = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const customMessage = 'Custom error message';
      const error = createError(errorCode, customMessage);

      expect(error.message).toBe(customMessage);
    });

    test('includes original error when provided', () => {
      const errorCode = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const originalError = new Error('Original error');
      const error = createError(errorCode, null, originalError);

      expect(error.originalError).toBe(originalError);
    });

    test('includes details when provided', () => {
      const errorCode = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const details = { url: 'https://example.com' };
      const error = createError(errorCode, null, null, details);

      expect(error.details).toBe(details);
    });

    test('uses specified severity when provided', () => {
      const errorCode = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const severity = ERROR_SEVERITY.CRITICAL;
      const error = createError(errorCode, null, null, null, severity);

      expect(error.severity).toBe(severity);
    });

    test('handles unknown error codes', () => {
      const unknownErrorCode = 'non_existent_error_code';
      const error = createError(unknownErrorCode);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(unknownErrorCode);
      // Should use the fallback message key 'errorUnknown'
      expect(error.message).toBe('errorUnknown');
    });
  });

  describe('handleError function', () => {
    test('logs the error and publishes an event', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Network fetch failed',
        ERROR_SEVERITY.ERROR
      );

      handleError(error, false);

      expect(consoleSpy).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        code: error.code,
        message: error.message,
        severity: error.severity
      }));
    });

    test('converts regular Error to AppError', () => {
      const regularError = new Error('Regular error');
      
      handleError(regularError, false);

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        code: ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL,
        message: regularError.message
      }));
    });
    
    test('handles non-Error objects gracefully', () => {
      const nonError = { message: 'Not an Error instance' };
      
      // This should not throw
      handleError(nonError, false);
      
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
    
    test('handles objects without message property', () => {
      const objectWithoutMessage = { someProperty: 'value' };
      
      // This should not throw
      handleError(objectWithoutMessage, false);
      
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
    
    // Note: The current implementation of handleError doesn't handle null/undefined errors
    // This would be a good improvement for the error-handler module in the future

    test('shows notification when showNotification is true', () => {
      const error = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Network fetch failed'
      );

      handleError(error, true);

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        messageKey: ERROR_MESSAGE_KEYS[error.code],
        persistent: false
      }));
    });

    test('sets persistent flag in notification when specified', () => {
      const error = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Network fetch failed'
      );

      handleError(error, true, true);

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        persistent: true
      }));
    });

    test('includes source in error event when provided', () => {
      const error = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Network fetch failed'
      );
      const source = 'test-module';

      handleError(error, false, false, source);

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        source: source
      }));
    });

    test('logs with different console methods based on severity', () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const consoleWarnSpy = jest.spyOn(console, 'warn');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      // Info severity
      const infoError = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Info message',
        ERROR_SEVERITY.INFO
      );
      handleError(infoError, false);
      expect(consoleLogSpy).toHaveBeenCalled();

      // Warning severity
      const warningError = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Warning message',
        ERROR_SEVERITY.WARNING
      );
      handleError(warningError, false);
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Critical severity
      const criticalError = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Critical message',
        ERROR_SEVERITY.CRITICAL
      );
      handleError(criticalError, false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('adds source prefix to log message when source is provided', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Network fetch failed',
        ERROR_SEVERITY.ERROR
      );
      const source = 'test-module';

      handleError(error, false, false, source);

      // Check that the console.error was called with a string that includes the source
      expect(consoleSpy.mock.calls[0][0]).toContain('[test-module]');
    });
    
    test('logs without source prefix when source is not provided', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Network fetch failed',
        ERROR_SEVERITY.ERROR
      );

      handleError(error, false);

      // Check that the console.error was called with a string that does not include a source prefix
      expect(consoleSpy.mock.calls[0][0]).not.toMatch(/^\[.*\]/);
    });
  });

  describe('tryCatch function', () => {
    test('returns the result of the function when it succeeds', async () => {
      const result = 'success';
      const fn = jest.fn().mockResolvedValue(result);

      const returnedResult = await tryCatch(fn);

      expect(returnedResult).toBe(result);
      expect(fn).toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test('handles errors and returns null when function throws', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);

      const returnedResult = await tryCatch(fn);

      expect(returnedResult).toBeNull();
      expect(fn).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.any(Object));
    });

    test('uses default error code when none is specified', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);

      await tryCatch(fn);

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        code: ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL
      }));
    });

    test('uses specified error code when function throws', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      const errorCode = ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT;

      await tryCatch(fn, { errorCode });

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        code: errorCode
      }));
    });

    test('shows notification when showNotification is true', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);

      await tryCatch(fn, { showNotification: true });

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.any(Object));
    });

    test('handles unknown error code in notification', () => {
      const unknownErrorCode = 'non_existent_error_code';
      const appError = new AppError(
        unknownErrorCode,
        'Error with unknown code'
      );
      
      handleError(appError, true);
      
      // Should use the fallback message key 'errorUnknown'
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        messageKey: 'errorUnknown'
      }));
    });
    
    test('handles user message details in notification', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      const details = { userMessage: 'User-friendly error message' };
      
      // Create an error with details that include userMessage
      const appError = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        'Network fetch failed',
        ERROR_SEVERITY.ERROR,
        null,
        details
      );
      
      handleError(appError, true);
      
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        substitutions: details.userMessage
      }));
    });

    test('uses error message as substitution when no userMessage in details', () => {
      const message = 'Error message without user details';
      const appError = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        message,
        ERROR_SEVERITY.ERROR
      );
      
      handleError(appError, true);
      
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        substitutions: message
      }));
    });

    test('uses error message as substitution when details exist but no userMessage', () => {
      const message = 'Error message with details but no userMessage';
      const details = { someOtherProperty: 'value' };
      const appError = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
        message,
        ERROR_SEVERITY.ERROR,
        null,
        details
      );
      
      handleError(appError, true);
      
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        substitutions: message
      }));
    });

    test('does not show notification when showNotification is false', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);

      await tryCatch(fn, { showNotification: false });

      expect(eventBus.publish).not.toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.any(Object));
    });

    test('includes source in error event when provided', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      const source = 'test-module';

      await tryCatch(fn, { source });

      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        source
      }));
    });
  });

  describe('mapHttpStatusToErrorCode function', () => {
    test('maps 400 to BAD_REQUEST', () => {
      expect(mapHttpStatusToErrorCode(400)).toBe(ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST);
    });

    test('maps 401 to UNAUTHORIZED', () => {
      expect(mapHttpStatusToErrorCode(401)).toBe(ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED);
    });

    test('maps 403 to UNAUTHORIZED', () => {
      expect(mapHttpStatusToErrorCode(403)).toBe(ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED);
    });

    test('maps 404 to BAD_REQUEST', () => {
      expect(mapHttpStatusToErrorCode(404)).toBe(ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST);
    });

    test('maps 429 to RATE_LIMIT', () => {
      expect(mapHttpStatusToErrorCode(429)).toBe(ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT);
    });

    test('maps 500+ to SERVER_ERROR', () => {
      expect(mapHttpStatusToErrorCode(500)).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR);
      expect(mapHttpStatusToErrorCode(502)).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR);
      expect(mapHttpStatusToErrorCode(503)).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR);
    });

    test('maps other status codes to SERVER_ERROR', () => {
      expect(mapHttpStatusToErrorCode(418)).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR); // I'm a teapot
    });
  });

  describe('mapSpeechErrorToErrorCode function', () => {
    test('maps no-speech to NO_SPEECH', () => {
      expect(mapSpeechErrorToErrorCode('no-speech')).toBe(ERROR_CODE[ERROR_CATEGORY.SPEECH].NO_SPEECH);
    });

    test('maps audio-capture to MIC_UNAVAILABLE', () => {
      expect(mapSpeechErrorToErrorCode('audio-capture')).toBe(ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_UNAVAILABLE);
    });

    test('maps not-allowed to MIC_DENIED', () => {
      expect(mapSpeechErrorToErrorCode('not-allowed')).toBe(ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_DENIED);
    });

    test('maps aborted to ABORTED', () => {
      expect(mapSpeechErrorToErrorCode('aborted')).toBe(ERROR_CODE[ERROR_CATEGORY.SPEECH].ABORTED);
    });

    test('maps network to FETCH_FAILED', () => {
      expect(mapSpeechErrorToErrorCode('network')).toBe(ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED);
    });

    test('maps service-not-allowed to NOT_SUPPORTED', () => {
      expect(mapSpeechErrorToErrorCode('service-not-allowed')).toBe(ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED);
    });

    test('maps unknown error types to START_FAILED', () => {
      expect(mapSpeechErrorToErrorCode('unknown-error')).toBe(ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED);
    });
  });
});