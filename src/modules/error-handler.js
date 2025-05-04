/**
 * Error Handler Module
 * Provides unified error handling mechanisms for the application
 */

import { publish, EVENTS } from './event-bus.js';

/**
 * Error categories
 */
export const ERROR_CATEGORY = {
  NETWORK: 'network',       // Network-related errors (fetch failures, timeouts)
  API: 'api',               // API-related errors (OpenAI API errors, status codes)
  INPUT: 'input',           // Input validation errors (missing fields, invalid formats)
  PERMISSION: 'permission', // Permission-related errors (microphone access, etc.)
  SPEECH: 'speech',         // Speech recognition errors
  STORAGE: 'storage',       // Storage-related errors (Chrome storage)
  DOM: 'dom',               // DOM manipulation errors
  UNKNOWN: 'unknown'        // Uncategorized errors
};

/**
 * Error codes for each category
 */
export const ERROR_CODE = {
  // Network errors
  [ERROR_CATEGORY.NETWORK]: {
    FETCH_FAILED: 'network_fetch_failed',
    TIMEOUT: 'network_timeout',
    OFFLINE: 'network_offline'
  },
  
  // API errors
  [ERROR_CATEGORY.API]: {
    INVALID_KEY: 'api_invalid_key',
    UNAUTHORIZED: 'api_unauthorized',
    RATE_LIMIT: 'api_rate_limit',
    BAD_REQUEST: 'api_bad_request',
    SERVER_ERROR: 'api_server_error',
    UNEXPECTED_RESPONSE: 'api_unexpected_response'
  },
  
  // Input errors
  [ERROR_CATEGORY.INPUT]: {
    MISSING_API_KEY: 'input_missing_api_key',
    INVALID_API_KEY_FORMAT: 'input_invalid_api_key_format',
    EMPTY_CONTENT: 'input_empty_content',
    FIELD_NOT_FOUND: 'input_field_not_found'
  },
  
  // Permission errors
  [ERROR_CATEGORY.PERMISSION]: {
    MIC_DENIED: 'permission_mic_denied',
    MIC_UNAVAILABLE: 'permission_mic_unavailable'
  },
  
  // Speech recognition errors
  [ERROR_CATEGORY.SPEECH]: {
    NOT_SUPPORTED: 'speech_not_supported',
    NO_SPEECH: 'speech_no_speech',
    ABORTED: 'speech_aborted',
    START_FAILED: 'speech_start_failed',
    STOP_FAILED: 'speech_stop_failed'
  },
  
  // Storage errors
  [ERROR_CATEGORY.STORAGE]: {
    SAVE_FAILED: 'storage_save_failed',
    LOAD_FAILED: 'storage_load_failed'
  },
  
  // DOM errors
  [ERROR_CATEGORY.DOM]: {
    ELEMENT_NOT_FOUND: 'dom_element_not_found',
    EVENT_DISPATCH_FAILED: 'dom_event_dispatch_failed',
    MANIPULATION_FAILED: 'dom_manipulation_failed'
  },
  
  // Unknown errors
  [ERROR_CATEGORY.UNKNOWN]: {
    GENERAL: 'unknown_error'
  }
};

/**
 * Maps error codes to i18n message keys
 */
export const ERROR_MESSAGE_KEYS = {
  // Network errors
  [ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED]: 'errorNetworkFetchFailed',
  [ERROR_CODE[ERROR_CATEGORY.NETWORK].TIMEOUT]: 'errorNetworkTimeout',
  [ERROR_CODE[ERROR_CATEGORY.NETWORK].OFFLINE]: 'errorNetworkOffline',
  
  // API errors
  [ERROR_CODE[ERROR_CATEGORY.API].INVALID_KEY]: 'errorApiInvalidKey',
  [ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED]: 'errorApiUnauthorized',
  [ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT]: 'errorApiRateLimit',
  [ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST]: 'errorApiBadRequest',
  [ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR]: 'errorApiServerError',
  [ERROR_CODE[ERROR_CATEGORY.API].UNEXPECTED_RESPONSE]: 'errorApiUnexpectedResponse',
  
  // Input errors
  [ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY]: 'statusApiKeyMissing',
  [ERROR_CODE[ERROR_CATEGORY.INPUT].INVALID_API_KEY_FORMAT]: 'statusApiKeyInvalid',
  [ERROR_CODE[ERROR_CATEGORY.INPUT].EMPTY_CONTENT]: 'errorInputEmptyContent',
  [ERROR_CODE[ERROR_CATEGORY.INPUT].FIELD_NOT_FOUND]: 'errorInputFieldNotFound',
  
  // Permission errors
  [ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_DENIED]: 'statusSpeechErrorNotAllowed',
  [ERROR_CODE[ERROR_CATEGORY.PERMISSION].MIC_UNAVAILABLE]: 'statusSpeechErrorAudioCapture',
  
  // Speech recognition errors
  [ERROR_CODE[ERROR_CATEGORY.SPEECH].NOT_SUPPORTED]: 'errorSpeechNotSupported',
  [ERROR_CODE[ERROR_CATEGORY.SPEECH].NO_SPEECH]: 'statusSpeechErrorNoSpeech',
  [ERROR_CODE[ERROR_CATEGORY.SPEECH].ABORTED]: 'errorSpeechAborted',
  [ERROR_CODE[ERROR_CATEGORY.SPEECH].START_FAILED]: 'statusSpeechStartError',
  [ERROR_CODE[ERROR_CATEGORY.SPEECH].STOP_FAILED]: 'errorSpeechStopFailed',
  
  // Storage errors
  [ERROR_CODE[ERROR_CATEGORY.STORAGE].SAVE_FAILED]: 'errorStorageSaveFailed',
  [ERROR_CODE[ERROR_CATEGORY.STORAGE].LOAD_FAILED]: 'errorStorageLoadFailed',
  
  // DOM errors
  [ERROR_CODE[ERROR_CATEGORY.DOM].ELEMENT_NOT_FOUND]: 'errorDomElementNotFound',
  [ERROR_CODE[ERROR_CATEGORY.DOM].EVENT_DISPATCH_FAILED]: 'errorDomEventDispatchFailed',
  [ERROR_CODE[ERROR_CATEGORY.DOM].MANIPULATION_FAILED]: 'errorDomManipulationFailed',
  
  // Unknown errors
  [ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL]: 'errorUnknown'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  INFO: 'info',       // Informational messages, not critical
  WARNING: 'warning', // Warnings that don't prevent core functionality
  ERROR: 'error',     // Errors that affect functionality but don't crash the app
  CRITICAL: 'critical' // Critical errors that prevent core functionality
};

/**
 * Custom Error class with additional properties
 */
export class AppError extends Error {
  /**
   * Create a new AppError
   * @param {string} code - Error code from ERROR_CODE
   * @param {string} message - Error message
   * @param {string} severity - Error severity from ERROR_SEVERITY
   * @param {Error|null} originalError - Original error if this is a wrapper
   * @param {Object|null} details - Additional error details
   */
  constructor(code, message, severity = ERROR_SEVERITY.ERROR, originalError = null, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.originalError = originalError;
    this.details = details;
    this.timestamp = new Date();
  }
}

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