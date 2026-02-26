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

describe('Error Handler Module - Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createError function', () => {
    test('creates an AppError with the specified error code', () => {
      const errorCode = ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
      const error = createError(errorCode);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe(errorCode);
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
      handleError({ message: 'Not an Error instance' }, false);
      handleError({ someProperty: 'value' }, false);
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.any(Object));
    });

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

      handleError(new AppError(ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED, 'Info', ERROR_SEVERITY.INFO), false);
      expect(consoleLogSpy).toHaveBeenCalled();

      handleError(new AppError(ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED, 'Warning', ERROR_SEVERITY.WARNING), false);
      expect(consoleWarnSpy).toHaveBeenCalled();

      handleError(new AppError(ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED, 'Critical', ERROR_SEVERITY.CRITICAL), false);
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('adds source prefix to log message when source is provided', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      const error = new AppError(ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED, 'msg', ERROR_SEVERITY.ERROR);
      handleError(error, false, false, 'test-module');
      expect(consoleSpy.mock.calls[0][0]).toContain('[test-module]');
    });

    test('handles unknown error code in notification', () => {
      const appError = new AppError('non_existent_error_code', 'Error with unknown code');
      handleError(appError, true);
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        messageKey: 'errorUnknown'
      }));
    });

    test('uses userMessage from details as substitution when present', () => {
      const details = { userMessage: 'User-friendly error message' };
      const appError = new AppError(
        ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED, 'msg', ERROR_SEVERITY.ERROR, null, details
      );
      handleError(appError, true);
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        substitutions: details.userMessage
      }));
    });

    test('uses error message as substitution when no userMessage in details', () => {
      const message = 'Error message without user details';
      const appError = new AppError(ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED, message, ERROR_SEVERITY.ERROR);
      handleError(appError, true);
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.objectContaining({
        substitutions: message
      }));
    });
  });

  describe('tryCatch function', () => {
    test('returns the result of the function when it succeeds', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await tryCatch(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test('handles errors and returns null when function throws', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const result = await tryCatch(fn);
      expect(result).toBeNull();
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.any(Object));
    });

    test('uses specified error code when function throws', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      const errorCode = ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT;
      await tryCatch(fn, { errorCode });
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        code: errorCode
      }));
    });

    test('shows notification when showNotification is true', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      await tryCatch(fn, { showNotification: true });
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.any(Object));
    });

    test('does not show notification when showNotification is false', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      await tryCatch(fn, { showNotification: false });
      expect(eventBus.publish).not.toHaveBeenCalledWith(eventBus.EVENTS.STATUS_UPDATED, expect.any(Object));
    });

    test('includes source in error event when provided', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      await tryCatch(fn, { source: 'test-module' });
      expect(eventBus.publish).toHaveBeenCalledWith(eventBus.EVENTS.ERROR_OCCURRED, expect.objectContaining({
        source: 'test-module'
      }));
    });
  });

  describe('mapHttpStatusToErrorCode function', () => {
    test('maps 400 to BAD_REQUEST', () => {
      expect(mapHttpStatusToErrorCode(400)).toBe(ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST);
    });
    test('maps 401 and 403 to UNAUTHORIZED', () => {
      expect(mapHttpStatusToErrorCode(401)).toBe(ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED);
      expect(mapHttpStatusToErrorCode(403)).toBe(ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED);
    });
    test('maps 429 to RATE_LIMIT', () => {
      expect(mapHttpStatusToErrorCode(429)).toBe(ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT);
    });
    test('maps 500+ to SERVER_ERROR', () => {
      expect(mapHttpStatusToErrorCode(500)).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR);
      expect(mapHttpStatusToErrorCode(503)).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR);
    });
    test('maps other status codes to SERVER_ERROR', () => {
      expect(mapHttpStatusToErrorCode(418)).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR);
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
