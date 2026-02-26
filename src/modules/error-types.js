/**
 * Error Types Module
 * Provides error definitions, categories, codes, and the AppError class
 */

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
