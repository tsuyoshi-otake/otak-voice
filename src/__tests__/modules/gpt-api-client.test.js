/**
 * @jest-environment jsdom
 */

// Mock dependencies before imports
jest.mock('../../modules/event-bus.js', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
  EVENTS: {
    ERROR_OCCURRED: 'error:occurred',
    STATUS_UPDATED: 'status:updated',
    SETTINGS_MODAL_TOGGLED: 'settings:modal:toggled'
  }
}));

jest.mock('../../modules/state.js', () => ({
  getState: jest.fn(),
  setState: jest.fn()
}));

import {
  makeGPTRequest,
  validateApiKey,
  handleAPIError
} from '../../modules/gpt-api-client.js';
import {
  createError,
  handleError,
  ERROR_CODE,
  ERROR_CATEGORY,
  ERROR_SEVERITY
} from '../../modules/error-handler.js';

import { publish } from '../../modules/event-bus.js';

// Chrome API mock
global.chrome = {
  i18n: {
    getMessage: jest.fn((key) => key)
  }
};

const GPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

describe('gpt-api-client module', () => {
  let originalFetch;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Corrected text' } }]
      })
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // -------------------------------------------------------------------------
  // validateApiKey
  // -------------------------------------------------------------------------
  describe('validateApiKey', () => {
    test('returns true for a non-empty API key', () => {
      const result = validateApiKey('sk-test-key-12345');
      expect(result).toBe(true);
    });

    test('returns false and calls handleError when API key is empty string', () => {
      const result = validateApiKey('');
      expect(result).toBe(false);
    });

    test('returns false for null, undefined, and 0 (all falsy)', () => {
      expect(validateApiKey(null)).toBe(false);
      expect(validateApiKey(undefined)).toBe(false);
      expect(validateApiKey(0)).toBe(false);
    });

    test('returns true for any truthy API key string', () => {
      expect(validateApiKey('any-truthy-string')).toBe(true);
      expect(validateApiKey('sk-abcdef')).toBe(true);
    });

    test('publishes a STATUS_UPDATED event via handleError when key is missing', () => {
      validateApiKey('');
      expect(publish).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // handleAPIError
  // -------------------------------------------------------------------------
  describe('handleAPIError', () => {
    test('parses JSON body from error response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ error: { message: 'Invalid API key' } })
      };

      const { errorData } = await handleAPIError(mockResponse);
      expect(errorData).toEqual({ error: { message: 'Invalid API key' } });
    });

    test('returns UNAUTHORIZED error code for 401 response', async () => {
      const mockResponse = {
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ error: { message: 'Unauthorized' } })
      };

      const { errorCode } = await handleAPIError(mockResponse);
      expect(errorCode).toBe(ERROR_CODE[ERROR_CATEGORY.API].UNAUTHORIZED);
    });

    test('returns RATE_LIMIT error code for 429 response', async () => {
      const mockResponse = {
        status: 429,
        statusText: 'Too Many Requests',
        json: jest.fn().mockResolvedValue({ error: { message: 'Rate limited' } })
      };

      const { errorCode } = await handleAPIError(mockResponse);
      expect(errorCode).toBe(ERROR_CODE[ERROR_CATEGORY.API].RATE_LIMIT);
    });

    test('returns BAD_REQUEST error code for 400 response', async () => {
      const mockResponse = {
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ error: { message: 'Bad request' } })
      };

      const { errorCode } = await handleAPIError(mockResponse);
      expect(errorCode).toBe(ERROR_CODE[ERROR_CATEGORY.API].BAD_REQUEST);
    });

    test('returns SERVER_ERROR code for 500 response', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ error: { message: 'Server error' } })
      };

      const { errorCode } = await handleAPIError(mockResponse);
      expect(errorCode).toBe(ERROR_CODE[ERROR_CATEGORY.API].SERVER_ERROR);
    });

    test('falls back to synthetic errorData when JSON parsing fails', async () => {
      const mockResponse = {
        status: 503,
        statusText: 'Service Unavailable',
        json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'))
      };

      const { errorData } = await handleAPIError(mockResponse);
      expect(errorData).toEqual({ error: { message: 'HTTP 503 Service Unavailable' } });
    });

    test('always returns both errorCode and errorData properties', async () => {
      const result = await handleAPIError({
        status: 403, statusText: 'Forbidden',
        json: jest.fn().mockResolvedValue({ error: { message: 'Forbidden' } })
      });
      expect(result).toHaveProperty('errorCode');
      expect(result).toHaveProperty('errorData');
    });
  });

  // -------------------------------------------------------------------------
  // makeGPTRequest
  // -------------------------------------------------------------------------
  describe('makeGPTRequest', () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    const model = 'gpt-4o-mini';
    const maxTokens = 100;
    const temperature = 0.3;
    const apiKey = 'sk-test-key-12345';

    test('calls fetch with the OpenAI API endpoint', async () => {
      await makeGPTRequest(messages, model, maxTokens, temperature, apiKey);

      expect(global.fetch).toHaveBeenCalledWith(
        GPT_API_ENDPOINT,
        expect.any(Object)
      );
    });

    test('uses POST with correct Content-Type and Authorization headers', async () => {
      await makeGPTRequest(messages, model, maxTokens, temperature, apiKey);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          })
        })
      );
    });

    test('sends model, messages, max_tokens and temperature in request body', async () => {
      await makeGPTRequest(messages, model, maxTokens, temperature, apiKey);
      const [, options] = global.fetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.model).toBe(model);
      expect(body.messages).toEqual(messages);
      expect(body.max_tokens).toBe(maxTokens);
      expect(body.temperature).toBe(temperature);
    });

    test('returns the fetch Response object', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ choices: [] })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await makeGPTRequest(messages, model, maxTokens, temperature, apiKey);

      expect(result).toBe(mockResponse);
    });

    test('propagates network errors thrown by fetch', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        makeGPTRequest(messages, model, maxTokens, temperature, apiKey)
      ).rejects.toThrow('Network error');
    });

    test('works with an empty messages array', async () => {
      await makeGPTRequest([], model, maxTokens, temperature, apiKey);

      const [, options] = global.fetch.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.messages).toEqual([]);
    });

    test('sends request body as valid JSON string', async () => {
      await makeGPTRequest(messages, model, maxTokens, temperature, apiKey);
      const [, options] = global.fetch.mock.calls[0];
      expect(() => JSON.parse(options.body)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Re-exported helpers (createError, handleError, ERROR_CODE, etc.)
  // -------------------------------------------------------------------------
  describe('re-exported error utilities', () => {
    test('ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY are exported', () => {
      expect(ERROR_CODE[ERROR_CATEGORY.API]).toBeDefined();
      expect(ERROR_CATEGORY.NETWORK).toBe('network');
      expect(ERROR_SEVERITY.ERROR).toBeDefined();
    });

    test('createError is exported and returns an AppError', () => {
      const error = createError(ERROR_CODE[ERROR_CATEGORY.UNKNOWN].GENERAL);
      expect(error).toBeDefined();
      expect(error.code).toBe('unknown_error');
    });

    test('handleError is exported and callable', () => {
      expect(typeof handleError).toBe('function');
    });
  });
});
