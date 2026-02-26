/**
 * Speech Module (Barrel File)
 * Re-exports all speech-related functionality from sub-modules.
 * Functions are wrapped as local exports so Babel generates configurable properties,
 * allowing jest.spyOn to work correctly in tests.
 */

import {
    updateMicButtonState as _updateMicButtonState,
    updateRecognitionLanguage as _updateRecognitionLanguage,
    basicCleanup as _basicCleanup,
    forceSetTextAreaValue as _forceSetTextAreaValue
} from './speech-utils.js';
import {
    initSpeechEvents as _initSpeechEvents,
    toggleSpeechRecognition as _toggleSpeechRecognition,
    startSpeechRecognition as _startSpeechRecognition,
    stopSpeechRecognition as _stopSpeechRecognition
} from './speech-recognition.js';
import {
    startEditInstructionRecognition as _startEditInstructionRecognition,
    processEditInstruction as _processEditInstruction
} from './speech-edit.js';
import { subscribe as eventSubscribe, EVENTS } from './event-bus.js';

export function updateMicButtonState(active) { return _updateMicButtonState(active); }
export function updateRecognitionLanguage(newLang) { return _updateRecognitionLanguage(newLang); }
export function basicCleanup(text) { return _basicCleanup(text); }
export function forceSetTextAreaValue(element, value) { return _forceSetTextAreaValue(element, value); }
export function initSpeechEvents() {
    _initSpeechEvents();
    eventSubscribe(EVENTS.LANGUAGE_UPDATED, updateRecognitionLanguage);
}
export function toggleSpeechRecognition() { return _toggleSpeechRecognition(); }
export function startSpeechRecognition() { return _startSpeechRecognition(); }
export function stopSpeechRecognition() { return _stopSpeechRecognition(); }
export function startEditInstructionRecognition(targetElement) { return _startEditInstructionRecognition(targetElement); }
export async function processEditInstruction(instruction, targetElement) { return _processEditInstruction(instruction, targetElement); }
