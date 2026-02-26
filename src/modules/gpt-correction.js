
/**
 * GPT Correction Module
 * Provides voice input correction using GPT API
 */

import { GPT_MODELS, PROCESSING_STATE, GPT_PARAMS, DEFAULT_SETTINGS } from '../constants.js';
import { getState } from './state.js';
import { voiceHistory } from './history.js';
import { updateProcessingState } from './ui.js';
import { publish, EVENTS } from './event-bus.js';
import { makeGPTRequest, validateApiKey, handleAPIError } from './gpt-api-client.js';
import { createError, handleError, ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY } from './error-handler.js';

/**
 * @param {string} text - Text to proofread
 * @returns {Promise<string>} Proofread text
 */
export async function correctWithGPT(text) {
    const apiKey = getState('apiKey');
    if (!validateApiKey(apiKey)) {
        return text; // Return original text if no API key
    }
    if (!text || text.trim() === '') return text; // Return empty text as is

    updateProcessingState(PROCESSING_STATE.CORRECTING);

    try {
        // Use event bus to show status
        publish(EVENTS.STATUS_UPDATED, {
            messageKey: 'statusCorrecting',
            substitutions: undefined,
            persistent: true
        });

        const useHistoryContext = getState('useHistoryContext');
        const conversationHistory = useHistoryContext ?
            voiceHistory.slice(-5).map(item => ({
                role: "user", // Treat history as user utterances
                content: item.text
            })) : [];

        // Get custom prompt from settings or use default
        const customPrompt = getState('autoCorrectionPrompt');
        const systemPrompt = customPrompt || DEFAULT_SETTINGS.AUTO_CORRECTION_PROMPT;

        const messages = [
            {
                role: "system",
                content: systemPrompt
            },
            ...conversationHistory, // Expand conversation history
            {
                role: "user",
                content: text // Current voice input
            }
        ];

        const response = await makeGPTRequest(
            messages,
            GPT_MODELS.CORRECTION,
            GPT_PARAMS.CORRECTION.maxTokens,
            GPT_PARAMS.CORRECTION.temperature,
            apiKey
        );

        if (!response.ok) {
            const { errorCode, errorData } = await handleAPIError(response);

            // Create and handle the error
            const error = createError(
                errorCode,
                null,
                null,
                {
                    status: response.status,
                    apiError: errorData.error?.message || 'Unknown API error',
                    originalResponse: errorData
                },
                ERROR_SEVERITY.ERROR
            );
            handleError(error, true, false, 'gpt-service');

            // For unauthorized errors, open settings modal
            if (response.status === 401) {
                publish(EVENTS.SETTINGS_MODAL_TOGGLED);
            }

            return text;
        }

        const data = await response.json();

        // Update processing state via event bus
        updateProcessingState(PROCESSING_STATE.IDLE);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const correctedText = data.choices[0].message.content.trim();

            // Use event bus to show status
            publish(EVENTS.STATUS_UPDATED, {
                messageKey: 'statusCorrectionSuccess',
                substitutions: undefined,
                persistent: false
            });

            return correctedText;
        } else {
            console.warn(chrome.i18n.getMessage('logApiResponseUnexpected'), data);

            // Use event bus to show status
            publish(EVENTS.STATUS_UPDATED, {
                messageKey: 'statusCorrectionResponseError',
                substitutions: undefined,
                persistent: false
            });

            return text; // Return original text even with unexpected response
        }
    } catch (error) {
        // Update processing state via event bus
        updateProcessingState(PROCESSING_STATE.IDLE);

        // Create and handle the error
        const appError = createError(
            ERROR_CODE[ERROR_CATEGORY.NETWORK].FETCH_FAILED,
            null,
            error,
            null,
            ERROR_SEVERITY.ERROR
        );
        handleError(appError, true, false, 'gpt-service');

        return text;
    }
}
