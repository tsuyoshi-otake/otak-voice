
/**
 * GPT API Client Module
 * Provides shared API request logic for GPT service functions
 */

import {
    createError,
    handleError,
    mapHttpStatusToErrorCode,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './error-handler.js';
import { publish, EVENTS } from './event-bus.js';
import { getState } from './state.js';

const GPT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/**
 * Validate API key existence
 * @param {string} apiKey - The API key to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateApiKey(apiKey) {
    if (!apiKey) {
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY,
            null,
            null,
            null,
            ERROR_SEVERITY.INFO
        );
        handleError(error, true, false, 'gpt-service');
        return false;
    }
    return true;
}

/**
 * Handle API error response
 * @param {Response} response - The fetch response object
 * @returns {Promise<{errorCode: string, errorData: object}>} Parsed error information
 */
export async function handleAPIError(response) {
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        errorData = { error: { message: `HTTP ${response.status} ${response.statusText}` } };
    }

    const errorCode = mapHttpStatusToErrorCode(response.status);

    return { errorCode, errorData };
}

/**
 * Make a request to the GPT API
 * @param {Array} messages - Array of message objects for the chat API
 * @param {string} model - The GPT model to use
 * @param {number} maxTokens - Maximum tokens in the response
 * @param {number} temperature - Temperature for response generation
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Response>} The fetch response
 */
export async function makeGPTRequest(messages, model, maxTokens, temperature, apiKey) {
    const requestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature
    };

    const response = await fetch(GPT_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
    });

    return response;
}

