/**
 * Error Handler Module
 * Provides unified error handling mechanisms for the application
 */

// Re-export types for backward compatibility
export { ERROR_CATEGORY, ERROR_CODE, ERROR_MESSAGE_KEYS, ERROR_SEVERITY, AppError } from './error-types.js';

import { publish, EVENTS } from './event-bus.js';
import { ERROR_CATEGORY, ERROR_CODE, ERROR_MESSAGE_KEYS, ERROR_SEVERITY, AppError } from './error-types.js';

/**
 * Create an error object with the specified code
 * @param {string} errorCode - Error code from ERROR_CODE
 * @param {string|null} customMessage - Optional custom message
 * @param {Error|null} originalError - Original error if this is a wrapper
 * @param {Object|null} details - Additional error details
 * @param {string} severity - Error severity from ERROR_SEVERITY
 * @returns {AppError} - New AppError instance
 */
export function createError(
  errorCode,
  customMessage = null,
  originalError = null,
  details = null,
  severity = ERROR_SEVERITY.ERROR
) {
  const messageKey = ERROR_MESSAGE_KEYS[errorCode] || 'errorUnknown';
  const message = customMessage || chrome.i18n.getMessage(messageKey);
  return new AppError(errorCode, message, severity, originalError, details);
}

/**
 * Handle an error by logging it and optionally showing a user notification
 * @param {AppError|Error} error - Error to handle
 * @param {boolean} showNotification - Whether to show a notification to the user
 * @param {boolean} persistent - Whether the notification should persist
 * @param {string|null} source - Source module/component where the error occurred
 * @returns {void}
 */
export function handleError(error, showNotification = true, persistent = false, source = null) {
  // Convert regular Error to AppError if needed
  const appError = error instanceof AppError
    ? error
    : createError(
        ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL,
        error.message,
        error,
        null,
        ERROR_SEVERITY.ERROR
      );

  // Log the error with appropriate level based on severity
  logError(appError, source);

  // Show notification to user if requested
  if (showNotification) {
    notifyUser(appError, persistent);
  }

  // Publish error event for other modules to react
  publish(EVENTS.ERROR_OCCURRED, {
    code: appError.code,
    message: appError.message,
    severity: appError.severity,
    source: source,
    timestamp: appError.timestamp
  });
}

/**
 * Log an error to the console with appropriate level
 * @param {AppError} error - Error to log
 * @param {string|null} source - Source module/component where the error occurred
 * @returns {void}
 */
function logError(error, source = null) {
  const sourcePrefix = source ? `[${source}] ` : '';
  const errorInfo = {
    code: error.code,
    message: error.message,
    details: error.details,
    originalError: error.originalError
  };

  switch (error.severity) {
    case ERROR_SEVERITY.INFO:
      console.log(`${sourcePrefix}Info:`, errorInfo);
      break;
    case ERROR_SEVERITY.WARNING:
      console.warn(`${sourcePrefix}Warning:`, errorInfo);
      break;
    case ERROR_SEVERITY.CRITICAL:
      console.error(`${sourcePrefix}CRITICAL ERROR:`, errorInfo);
      break;
    case ERROR_SEVERITY.ERROR:
    default:
      console.error(`${sourcePrefix}Error:`, errorInfo);
      break;
  }
}

/**
 * Show a notification to the user
 * @param {AppError} error - Error to notify about
 * @param {boolean} persistent - Whether the notification should persist
 * @returns {void}
 */
function notifyUser(error, persistent = false) {
  // Get the appropriate message key based on error code
  const messageKey = ERROR_MESSAGE_KEYS[error.code] || 'errorUnknown';

  // Get any details to include in the message
  const substitutions = error.details?.userMessage || error.message;

  // Show status message via event bus
  publish(EVENTS.STATUS_UPDATED, {
    messageKey: messageKey,
    substitutions: substitutions,
    persistent: persistent
  });
}

/**
 * Try to execute a function and handle any errors
 * @param {Function} fn - Function to execute
 * @param {Object} options - Options for error handling
 * @param {string} options.errorCode - Error code to use if the function throws
 * @param {boolean} options.showNotification - Whether to show a notification on error
 * @param {boolean} options.persistent - Whether the notification should persist
 * @param {string|null} options.source - Source module/component
 * @returns {Promise<any>} - Result of the function or null if it threw
 */
export async function tryCatch(fn, options = {}) {
  const {
    errorCode = ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL,
    showNotification = true,
    persistent = false,
    source = null
  } = options;

  try {
    return await fn();
  } catch (error) {
    const appError = createError(errorCode, null, error, null, ERROR_SEVERITY.ERROR);
    handleError(appError, showNotification, persistent, source);
    return null;
  }
}

/**
 * Map HTTP status codes to appropriate error codes
 * @param {number} statusCode - HTTP status code
 * @returns {string} - Appropriate error code
 */
export function mapHttpStatusToErrorCode(statusCode) {
  if (statusCode >= 500) {
    return ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR;
  }

  switch (statusCode) {
    case 400:
      return ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST;
    case 401:
      return ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED;
    case 403:
      return ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED;
    case 404:
      return ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST;
    case 429:
      return ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT;
    default:
      return ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR;
  }
}

/**
 * Map speech recognition error to appropriate error code
 * @param {string} speechErrorType - Speech recognition error type
 * @returns {string} - Appropriate error code
 */
export function mapSpeechErrorToErrorCode(speechErrorType) {
  switch (speechErrorType) {
    case 'no-speech':
      return ERROR_CODE[ERROR_CATEGORY.SPEECH].NO_SPEECH;
    case 'audio-capture':
      return ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_UNAVAILABLE;
    case 'not-allowed':
      return ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_DENIED;
    case 'aborted':
      return ERROR_CODE[ERROR_CATEGORY.SPEECH].ABORTED;
    case 'network':
      return ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED;
    case 'service-not-allowed':
      return ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED;
    default:
      return ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED;
  }
}
