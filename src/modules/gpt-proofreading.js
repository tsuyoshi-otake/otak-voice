
/**
 * GPT Proofreading Module
 * Provides text proofreading using GPT API
 */

import { GPT_MODELS } from '../constants.js';
import { getState } from './state.js';
import { publish, EVENTS } from './event-bus.js';
import {
    makeGPTRequest,
    handleAPIError,
    createError,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './gpt-api-client.js';

/**
 * @param {string} text - Text to proofread
 * @returns {Promise<string>} Proofread text
 */
export async function proofreadWithGPT(text) {
    const apiKey = getState('apiKey');
    if (!apiKey) throw new Error(chrome.i18n.getMessage('statusApiKeyMissing'));

    try {
        // Use event bus to show status
        publish(EVENTS.STATUS_UPDATED, {
            messageKey: 'statusProofreadingModel',
            substitutions: GPT_MODELS.PROOFREADING,
            persistent: true
        });

        // Get custom prompt from settings or use default
        const customPrompt = getState('proofreadingPrompt');
        const systemPrompt = customPrompt || "You are an assistant that proofreads Japanese text. For the entire text provided by the user, correct typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Please preserve the original meaning and nuance of the text as much as possible. Output only the corrected text.";

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: text
            }
        ];

        const response = await makeGPTRequest(
            messages,
            GPT_MODELS.PROOFREADING,
            32768, // Support for long output
            0.5,   // Moderate creativity for proofreading
            apiKey
        );

        if (!response.ok) {
            const { errorCode, errorData } = await handleAPIError(response);

            // Create and throw the error
            throw createError(
                errorCode,
                `API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Details unknown'}`,
                null,
                {
                    status: response.status,
                    apiError: errorData.error?.message || 'Unknown API error',
                    originalResponse: errorData
                },
                ERROR_SEVERITY.ERROR
            );
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const correctedText = data.choices[0].message.content.trim();
            return correctedText;
        } else {
            console.error(chrome.i18n.getMessage('logOpenAiApiResponseUnexpected'), data);
            throw new Error(chrome.i18n.getMessage('statusCorrectionResponseError'));
        }
    } catch (error) {
        // If it's already an AppError, just re-throw it
        if (error.name === 'AppError') {
            throw error;
        }

        // Otherwise, create a new AppError
        console.error(chrome.i18n.getMessage('logProofreadRequestError'), error);
        throw createError(
            ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
            null,
            error,
            null,
            ERROR_SEVERITY.ERROR
        );
    }
}
