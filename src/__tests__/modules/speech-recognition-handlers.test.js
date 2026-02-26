import {
    startSpeechRecognition,
} from '../../modules/speech';
import * as gptService from '../../modules/gpt-service';
import * as history from '../../modules/history';
import * as utils from '../../modules/utils';
import * as domUtils from '../../modules/dom-utils';
import * as state from '../../modules/state';
import * as eventBus from '../../modules/event-bus';
import * as constants from '../../constants';
import * as siteDetector from '../../site-handlers/site-detector';
import * as errorHandler from '../../modules/error-handler';

// Mocks
jest.mock('../../modules/gpt-service');
jest.mock('../../modules/history');
jest.mock('../../modules/utils');
jest.mock('../../modules/dom-utils');
jest.mock('../../modules/state');
jest.mock('../../site-handlers/site-detector');

// Mock event-bus.js
jest.mock('../../modules/event-bus', () => {
    return {
        publish: jest.fn(),
        publishStatus: jest.fn(),
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

// Tests for SpeechRecognition event handling (onstart, onend, onresult, onerror)
describe('speech.js - Recognition Event Handlers', () => {
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
        domUtils.isInputElement.mockImplementation(el =>
            el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
        );
        siteDetector.detectSiteType.mockReturnValue('default');
    });

    afterEach(() => {
        if (activeElementSpy) {
            activeElementSpy.mockRestore();
        }
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
