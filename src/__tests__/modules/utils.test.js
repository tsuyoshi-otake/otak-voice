/**
 * Tests for utils.js module
 */

jest.mock('../../modules/state.js', () => ({
    getState: jest.fn(),
}));
jest.mock('../../modules/event-bus.js', () => ({
    publish: jest.fn(),
    EVENTS: {
        SPEECH_RECOGNITION_RESULT: 'speech:recognition_result',
    },
}));

// utils.js now only exports retryInputEvents.
// basicCleanup and forceSetTextAreaValue were dead code (lived in speech-utils.js);
// isInputElement was moved to dom-input-detection.js (tested there).
describe('utils module', () => {
    it('exports retryInputEvents', () => {
        const utils = require('../../modules/utils.js');
        expect(typeof utils.retryInputEvents).toBe('function');
    });
});
