
/**
 * GPT Service Module
 * Barrel file that re-exports all GPT service functions
 * for backward compatibility
 */

export { correctWithGPT } from './gpt-correction.js';
export { proofreadWithGPT } from './gpt-proofreading.js';
export { editWithGPT } from './gpt-editing.js';
