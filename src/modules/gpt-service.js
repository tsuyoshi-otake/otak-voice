
/**
 * GPT Service Module
 * Provides functions for interacting with OpenAI's GPT API
 */

import { GPT_MODELS, PROCESSING_STATE } from '../constants.js';
import { getState } from './state.js';
import { voiceHistory } from './history.js';
import { updateProcessingState } from './ui.js';
import { simulateTypingIntoElement } from './input-handler.js';
import { publish, EVENTS } from './event-bus.js';
import {
    createError,
    handleError,
    mapHttpStatusToErrorCode,
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY
} from './error-handler.js';

/**
 * @param {string} text - Text to proofread
 * @returns {Promise<string>} Proofread text
 */
export async function correctWithGPT(text) {
    const apiKey = getState('apiKey');
    if (!apiKey) {
        // Create and handle the error
        const error = createError(
            ERROR_CODE[ERROR_CATEGORY.INPUT].MISSING_API_KEY,
            null,
            null,
            null,
            ERROR_SEVERITY.INFO // INFO level since this is expected behavior
        );
        handleError(error, true, false, 'gpt-service');
        
        return text; // Return original text if no API key
    }
    if (!text || text.trim() === '') return text; // Return empty text as is

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
        const systemPrompt = customPrompt || "You are an assistant that corrects Japanese voice input in real-time. Please correct the content spoken by the user (the last message), fixing typos, grammatical errors, and unnatural expressions to make it a more natural and readable text. Consider the previous conversation history (if any) as context. Output only the corrected text.";

        const requestBody = {
            model: GPT_MODELS.CORRECTION,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                ...conversationHistory, // Expand conversation history
                {
                    role: "user",
                    content: text // Current voice input
                }
            ],
            max_tokens: 150, // Expect short response
            temperature: 0.3 // Encourage more deterministic output
        };

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            // Map HTTP status to appropriate error code
            const errorCode = mapHttpStatusToErrorCode(response.status);
            
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

        const requestBody = {
            model: GPT_MODELS.PROOFREADING,
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: text
                }
            ],
            max_tokens: 32768, // Support for long output
            temperature: 0.5 // Moderate creativity for proofreading
        };

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            // Map HTTP status to appropriate error code
            const errorCode = mapHttpStatusToErrorCode(response.status);
            
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

/**
 * @param {string} currentText - Current text
 * @param {string} instruction - Editing instruction
 * @param {Element} activeElement - Target element for editing
 * @returns {Promise<void>}
 */
export async function editWithGPT(currentText, instruction, activeElement) {
    console.log("Editing with GPT:", { currentText, instruction });
    const apiKey = getState('apiKey');

    try {
        // Use event bus to show status
        publish(EVENTS.STATUS_UPDATED, {
            messageKey: 'statusEditing',
            substitutions: undefined,
            persistent: true
        });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: GPT_MODELS.EDITING,
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant that edits text based on user instructions. Apply the instructions to the provided text and output only the resulting edited text, without any explanations or introductory phrases."
                    },
                    {
                        role: "user",
                        content: `Existing text:\n---\n${currentText}\n---\n\nEdit instruction:\n---\n${instruction}\n---\n\nEdited text:`
                    }
                ],
                max_tokens: 32768,
                temperature: 0.5 // Lower temperature for more predictable editing
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            // Map HTTP status to appropriate error code
            const errorCode = mapHttpStatusToErrorCode(response.status);
            
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
            console.log('Edited text:', editedText);
            
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