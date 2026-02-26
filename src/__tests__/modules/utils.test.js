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

import { basicCleanup, isInputElement, forceSetTextAreaValue } from '../../modules/utils.js';

describe('utils module', () => {
    describe('basicCleanup', () => {
        it('should trim whitespace', () => {
            expect(basicCleanup('  hello  ')).toBe('hello');
        });

        it('should reduce consecutive punctuation', () => {
            expect(basicCleanup('こんにちは。。')).toBe('こんにちは。');
            expect(basicCleanup('はい、、そうです')).toBe('はい、そうです');
        });

        it('should remove spaces before punctuation', () => {
            expect(basicCleanup('こんにちは 。')).toBe('こんにちは。');
            expect(basicCleanup('はい 、そうです')).toBe('はい、そうです');
        });

        it('should handle empty strings', () => {
            expect(basicCleanup('')).toBe('');
        });

        it('should handle text without issues', () => {
            expect(basicCleanup('正常なテキスト')).toBe('正常なテキスト');
        });
    });

    describe('isInputElement', () => {
        it('should return false for null/undefined', () => {
            expect(isInputElement(null)).toBe(false);
            expect(isInputElement(undefined)).toBe(false);
        });

        it('should return true for textarea', () => {
            const textarea = document.createElement('textarea');
            expect(isInputElement(textarea)).toBe(true);
        });

        it('should return true for text input', () => {
            const input = document.createElement('input');
            input.type = 'text';
            expect(isInputElement(input)).toBe(true);
        });

        it('should return true for search input', () => {
            const input = document.createElement('input');
            input.type = 'search';
            expect(isInputElement(input)).toBe(true);
        });

        it('should return true for email input', () => {
            const input = document.createElement('input');
            input.type = 'email';
            expect(isInputElement(input)).toBe(true);
        });

        it('should return true for contenteditable elements', () => {
            const div = document.createElement('div');
            div.contentEditable = 'true';
            // In jsdom, isContentEditable may not be set properly
            // So we mock it explicitly
            Object.defineProperty(div, 'isContentEditable', { value: true });
            expect(isInputElement(div)).toBe(true);
        });

        it('should return false for readonly elements', () => {
            const textarea = document.createElement('textarea');
            textarea.readOnly = true;
            expect(isInputElement(textarea)).toBe(false);
        });

        it('should return false for disabled elements', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.disabled = true;
            expect(isInputElement(input)).toBe(false);
        });

        it('should return false for aria-readonly elements', () => {
            const textarea = document.createElement('textarea');
            textarea.setAttribute('aria-readonly', 'true');
            expect(isInputElement(textarea)).toBe(false);
        });
    });

    describe('forceSetTextAreaValue', () => {
        it('should return false for null element', () => {
            expect(forceSetTextAreaValue(null, 'test')).toBe(false);
        });

        it('should set value on textarea and return true', () => {
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);

            const result = forceSetTextAreaValue(textarea, 'hello world');
            expect(result).toBe(true);

            document.body.removeChild(textarea);
        });

        it('should dispatch input and change events', () => {
            const textarea = document.createElement('textarea');
            document.body.appendChild(textarea);

            const inputHandler = jest.fn();
            const changeHandler = jest.fn();
            textarea.addEventListener('input', inputHandler);
            textarea.addEventListener('change', changeHandler);

            forceSetTextAreaValue(textarea, 'test');

            expect(inputHandler).toHaveBeenCalledTimes(1);
            expect(changeHandler).toHaveBeenCalledTimes(1);

            document.body.removeChild(textarea);
        });
    });
});
