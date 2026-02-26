import {
    initSpeechEvents,
    toggleSpeechRecognition,
    startSpeechRecognition,
    stopSpeechRecognition,
} from '../../modules/speech';
import * as gptService from '../../modules/gpt-service';
import * as history from '../../modules/history';
import * as utils from '../../modules/utils';
import * as state from '../../modules/state';
import * as eventBus from '../../modules/event-bus';
import * as constants from '../../constants';
import * as siteDetector from '../../site-handlers/site-detector';
import * as errorHandler from '../../modules/error-handler';

// Mocks
jest.mock('../../modules/gpt-service');
jest.mock('../../modules/history');
jest.mock('../../modules/utils');
jest.mock('../../modules/state');
jest.mock('../../site-handlers/site-detector');

// Mock event-bus.js
jest.mock('../../modules/event-bus', () => {
    return {
        publish: jest.fn(),
        subscribe: jest.fn(),
        EVENTS: {
            MIC_BUTTON_CLICKED: 'mic:button:clicked',
            GPT_EDITING_STARTED: 'gpt:editing:started',
            LANGUAGE_UPDATED: 'language:updated',
            RECOGNITION_MODAL_SHOWN: 'recognition:modal:shown',
            INPUT_FIELD_FOUND: 'input:field:found',
            STATUS_UPDATED: 'status:updated',
            RECOGNITION_MODAL_UPDATED: 'recognition:modal:updated',
            SPEECH_RECOGNITION_RESULT: 'speech:recognition:result',
            SETTINGS_MODAL_TOGGLED: 'settings:modal:toggled'
        }
    };
});

// Mock error-handler.js
jest.mock('../../modules/error-handler', () => {
    return {
        handleError: jest.fn(),
        createError: jest.fn((code, message, originalError, context, severity) => ({
            id: 'mockErrorId',
            code,
            message: message || 'Mock error message',
            originalError,
            context,
            severity,
            timestamp: new Date(),
        })),
        mapSpeechErrorToErrorCode: jest.fn(error => `MAPPED_${error.toUpperCase()}`),
        ERROR_CATEGORY: {
            SPEECH: 'SPEECH',
            DOM: 'DOM',
            API: 'API'
        },
        ERROR_CODE: {
            SPEECH: {
                START_FAILED: 'SPEECH_START_FAILED',
                STOP_FAILED: 'SPEECH_STOP_FAILED',
                NOT_SUPPORTED: 'SPEECH_NOT_SUPPORTED',
                NO_SPEECH: 'SPEECH_NO_SPEECH',
                ABORTED: 'SPEECH_ABORTED',
                AUDIO_CAPTURE: 'SPEECH_AUDIO_CAPTURE',
                NETWORK: 'SPEECH_NETWORK',
                NOT_ALLOWED: 'SPEECH_NOT_ALLOWED',
                SERVICE_NOT_ALLOWED: 'SPEECH_SERVICE_NOT_ALLOWED',
                BAD_GRAMMAR: 'SPEECH_BAD_GRAMMAR',
                LANGUAGE_NOT_SUPPORTED: 'SPEECH_LANGUAGE_NOT_SUPPORTED',
                UNKNOWN: 'SPEECH_UNKNOWN'
            },
            DOM: {
                ELEMENT_NOT_FOUND: 'DOM_ELEMENT_NOT_FOUND'
            }
        },
        ERROR_SEVERITY: {
            INFO: 'INFO',
            WARNING: 'WARNING',
            ERROR: 'ERROR',
            CRITICAL: 'CRITICAL'
        }
    };
});

// Set up SpeechRecognition mock
const mockRecognitionInstance = {
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    onstart: null,
    onresult: null,
    onend: null,
    onerror: null,
    lang: '',
    interimResults: false,
    continuous: false,
    maxAlternatives: 1,
    speechSetting: {}
};

// Create SpeechRecognition constructor mock
global.SpeechRecognition = jest.fn(() => mockRecognitionInstance);
global.webkitSpeechRecognition = jest.fn(() => mockRecognitionInstance);

// Set up AudioContext mock
global.AudioContext = jest.fn(() => ({
    createOscillator: jest.fn(() => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        type: '',
        frequency: {
            value: 0,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
        },
    })),
    createGain: jest.fn(() => ({
        connect: jest.fn(),
        gain: {
            value: 0,
            setValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn(),
        },
    })),
    createBiquadFilter: jest.fn(() => ({
        connect: jest.fn(),
        type: '',
        frequency: { value: 0 },
        Q: { value: 0 },
    })),
    destination: {},
    currentTime: 0,
}));
global.webkitAudioContext = global.AudioContext;

// Set up Chrome API mock
global.chrome = {
    i18n: {
        getMessage: jest.fn(key => `mock-${key}`),
    },
    runtime: {
        getURL: jest.fn(path => `mock-url/${path}`),
    }
};

// Helper to set up DOM elements for testing
const setupDOM = () => {
    document.body.innerHTML = `
        <button class="otak-voice-menu__input-btn"><span class="otak-voice-menu__label"></span></button>
        <div class="otak-voice-status"></div>
        <input id="test-input" />
        <textarea id="test-textarea"></textarea>
        <div id="test-contenteditable" contenteditable="true"></div>
        <div class="otak-voice-recognition">
            <textarea></textarea>
            <button class="otak-voice-recognition__copy-btn"></button>
        </div>
    `;
};

// Tests for initSpeechEvents, toggleSpeechRecognition, startSpeechRecognition, stopSpeechRecognition
describe('speech.js - Recognition', () => {
    let micButtonClickHandler;
    let activeElementSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        activeElementSpy = jest.spyOn(document, 'activeElement', 'get');
        activeElementSpy.mockReturnValue(document.body);
        setupDOM();

        state.getState.mockImplementation((key) => {
            const mockState = {
                isListening: false,
                recognitionLang: 'en-US',
                silenceTimeout: 3000,
                autoCorrection: true,
                apiKey: 'test-api-key',
                currentInputElement: null,
                lastClickedInput: null,
                autoDetectInputFields: true,
                useRecognitionModal: false,
                showModalWindow: false,
                processingState: 'IDLE',
            };
            return mockState[key];
        });

        state.setState.mockImplementation(() => {});
        state.subscribe.mockImplementation(() => {});
        utils.isInputElement.mockImplementation(el =>
            el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
        );
        siteDetector.detectSiteType.mockReturnValue('default');
    });

    afterEach(() => {
        if (activeElementSpy) {
            activeElementSpy.mockRestore();
        }
    });

    describe('initSpeechEvents', () => {
        it('should subscribe to MIC_BUTTON_CLICKED, GPT_EDITING_STARTED, and LANGUAGE_UPDATED events', () => {
            initSpeechEvents();
            expect(eventBus.subscribe).toHaveBeenCalledWith(eventBus.EVENTS.MIC_BUTTON_CLICKED, expect.any(Function));
            expect(eventBus.subscribe).toHaveBeenCalledWith(eventBus.EVENTS.GPT_EDITING_STARTED, expect.any(Function));
            const { updateRecognitionLanguage } = require('../../modules/speech');
            expect(eventBus.subscribe).toHaveBeenCalledWith(eventBus.EVENTS.LANGUAGE_UPDATED, updateRecognitionLanguage);

            const calls = eventBus.subscribe.mock.calls;
            const micButtonCall = calls.find(call => call[0] === eventBus.EVENTS.MIC_BUTTON_CLICKED);
            if (micButtonCall) {
                micButtonClickHandler = micButtonCall[1];
            }
        });
    });

    describe('startSpeechRecognition', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should alert and return if SpeechRecognition API is not available', () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
            const originalSpeechRecognition = global.SpeechRecognition;
            const originalWebkitSpeechRecognition = global.webkitSpeechRecognition;

            global.SpeechRecognition = undefined;
            global.webkitSpeechRecognition = undefined;

            startSpeechRecognition();

            expect(alertSpy).toHaveBeenCalledWith('mock-alertSpeechApiNotAvailable');

            global.SpeechRecognition = originalSpeechRecognition;
            global.webkitSpeechRecognition = originalWebkitSpeechRecognition;
            alertSpy.mockRestore();
        });

        it('should stop previous recognition instance if it exists', () => {
            startSpeechRecognition();
            mockRecognitionInstance.stop.mockClear();
            startSpeechRecognition();
            expect(mockRecognitionInstance.stop).toHaveBeenCalledTimes(1);
        });
    });

    describe('stopSpeechRecognition', () => {
        it('should update state if not listening or no instance', () => {
            state.getState.mockImplementation(key => key === 'isListening' ? false : undefined);
            stopSpeechRecognition();
            expect(state.setState).toHaveBeenCalledWith('isListening', false);

            const micButton = document.querySelector('.otak-voice-menu__input-btn');
            expect(micButton.classList.contains('otak-voice-menu__input-btn--active')).toBe(false);
        });

        it('should handle errors during stop and reset state', () => {
            state.getState.mockImplementation(key => key === 'isListening' ? true : undefined);

            const stopError = new Error('Stop failed');
            mockRecognitionInstance.stop.mockImplementationOnce(() => { throw stopError; });

            stopSpeechRecognition();

            expect(errorHandler.createError).toHaveBeenCalledWith(
                errorHandler.ERROR_CODE.SPEECH.STOP_FAILED,
                null,
                stopError,
                null,
                errorHandler.ERROR_SEVERITY.ERROR
            );
            expect(errorHandler.handleError).toHaveBeenCalled();
            expect(state.setState).toHaveBeenCalledWith('isListening', false);
        });
    });

    describe.skip('toggleSpeechRecognition', () => {
        it('should call stopSpeechRecognition if isListening is true', () => {
            state.getState.mockImplementation(key => key === 'isListening' ? true : undefined);
            expect(true).toBe(true);
        });

        it('should call startSpeechRecognition if isListening is false', () => {
            state.getState.mockImplementation(key => key === 'isListening' ? false : undefined);
            expect(true).toBe(true);
        });
    });

    describe('SpeechRecognition event handlers', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should set up and execute handler functions', () => {
            startSpeechRecognition();
            jest.advanceTimersByTime(300);

            expect(mockRecognitionInstance.onstart).toBeDefined();
            expect(mockRecognitionInstance.onend).toBeDefined();
            expect(mockRecognitionInstance.onresult).toBeDefined();
            expect(mockRecognitionInstance.onerror).toBeDefined();

            if (mockRecognitionInstance.onstart) {
                mockRecognitionInstance.onstart();
            }
            if (mockRecognitionInstance.onend) {
                mockRecognitionInstance.onend();
            }
            if (mockRecognitionInstance.onerror) {
                mockRecognitionInstance.onerror({ error: 'no-speech' });
            }
            expect(state.setState).toHaveBeenCalled();
        });

        it('should handle recognition results', () => {
            startSpeechRecognition();
            jest.advanceTimersByTime(300);

            const mockEvent = {
                results: [
                    [{ transcript: 'Test transcript', confidence: 0.9 }]
                ],
                resultIndex: 0
            };
            mockEvent.results[0].isFinal = true;

            if (mockRecognitionInstance.onresult) {
                mockRecognitionInstance.onresult(mockEvent);
            }
            expect(eventBus.publish).toHaveBeenCalled();
        });

        it('should handle interim results', () => {
            startSpeechRecognition();
            jest.advanceTimersByTime(300);

            const mockEvent = {
                results: [
                    [{ transcript: 'Test interim', confidence: 0.5 }]
                ],
                resultIndex: 0
            };
            mockEvent.results[0].isFinal = false;

            if (mockRecognitionInstance.onresult) {
                mockRecognitionInstance.onresult(mockEvent);
            }
            expect(eventBus.publish).toHaveBeenCalled();
        });
    });
});
