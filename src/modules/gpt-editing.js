
/**
 * GPT Editing Module
 * Provides text editing using GPT API with instruction-based editing
 */

import { GPT_MODELS, PROCESSING_STATE } from '../constants.js';
import { getState } from './state.js';
import { updateProcessingState } from './ui.js';
import { simulateTypingIntoElement } from './input-handler.js';
import { publish, EVENTS } from './event-bus.js';
import {
    makeGPTRequest,
    handleAPIError,
    createError,
    handleError,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './gpt-api-client.js';

/**
 * @param {string} currentText - Current text
 * @param {string} instruction - Editing instruction
 * @param {Element} activeElement - Target element for editing
 * @returns {Promise<void>}
 */
export async function editWithGPT(currentText, instruction, activeElement) {
    const apiKey = getState('apiKey');

    try {
        // Use event bus to show status
        publish(EVENTS.STATUS_UPDATED, {
            messageKey: 'statusEditing',
            substitutions: undefined,
            persistent: true
        });

        const messages = [
            {
                role: "system",
                content: "You are an AI assistant that edits text based on user instructions. Apply the instructions to the provided text and output only the resulting edited text, without any explanations or introductory phrases."
            },
            {
                role: "user",
                content: `Existing text:\n---\n${currentText}\n---\n\nEdit instruction:\n---\n${instruction}\n---\n\nEdited text:`
            }
        ];

        const response = await makeGPTRequest(
            messages,
            GPT_MODELS.EDITING,
            32768,
            0.5, // Lower temperature for more predictable editing
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

            return; // Don't proceed if API call failed
        }

        const data = await response.json();
        // Update processing state via event bus
        updateProcessingState(PROCESSING_STATE.IDLE);

        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const editedText = data.choices[0].message.content.trim();

            setTimeout(() => {
                // Update the input field based on its type
                if (activeElement.isContentEditable) {
                    activeElement.textContent = editedText;
                    // Fire events
                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                } else {
                    // React compatibility: Try typing simulation first
                    try {
                        simulateTypingIntoElement(activeElement, editedText);
                    } catch (error) {
                        console.error('Error simulating typing:', error);
                        // Fallback to traditional method
                        activeElement.value = editedText;
                        // Fire events
                        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                        activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }, 100);

            // Use event bus to show status
            publish(EVENTS.STATUS_UPDATED, {
                messageKey: 'statusEditingComplete',
                substitutions: undefined,
                persistent: false
            });
        } else {
            // Update processing state via event bus
            updateProcessingState(PROCESSING_STATE.IDLE);

            // Create and handle the error
            const error = createError(
                ERROR_CODE[ERROR_CATEGORY.API].UNEXPECTED_RESPONSE,
                null,
                null,
                { originalResponse: data },
                ERROR_SEVERITY.ERROR
            );
            handleError(error, true, false, 'gpt-service');
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
    }
}
