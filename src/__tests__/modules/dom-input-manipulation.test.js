/** DOM Input Manipulation Tests */
import {
  dispatchEvent, setInputValue, handleTwitterInput, writeToInputField,
  appendToInputField, clickButtonWithFeedback, clearInputField,
  findElement, findAllElements,
} from '../../modules/dom-utils';
import { resetDOM } from '../../utils/dom-helpers';
import { createError, handleError } from '../../modules/error-handler';
import { publish, EVENTS } from '../../modules/event-bus';

jest.mock('../../modules/error-handler', () => {
  const EC = { DOM: 'DOM_ERROR' };
  const ECODE = {};
  ECODE[EC.DOM] = {
    EVENT_DISPATCH_FAILED: 'DOM_EVENT_DISPATCH_FAILED',
    INPUT_OPERATION_FAILED: 'DOM_INPUT_OPERATION_FAILED',
    TWITTER_INPUT_FAILED: 'DOM_TWITTER_INPUT_FAILED',
    BUTTON_CLICK_FAILED: 'DOM_BUTTON_CLICK_FAILED',
  };
  return {
    createError: jest.fn(), handleError: jest.fn(),
    ERROR_CODE: ECODE, ERROR_CATEGORY: EC, ERROR_SEVERITY: { WARNING: 'WARNING' },
  };
});
jest.mock('../../modules/event-bus', () => ({
  publish: jest.fn(),
  EVENTS: { ERROR_OCCURRED: 'errorOccurred', STATUS_UPDATED: 'statusUpdated' },
}));

const defaultRect = (o) => ({
  width: o.width || 100, height: o.height || 30, top: o.top || 0, left: o.left || 0,
  right: (o.left || 0) + (o.width || 100), bottom: (o.top || 0) + (o.height || 30),
});
const mockOffset = (el) => Object.defineProperty(el, 'offsetParent', {
  get: jest.fn().mockReturnValue(document.body), configurable: true
});
function createInputField(o = {}) {
  const input = document.createElement(o.type === 'textarea' ? 'textarea' : 'input');
  if (o.type && o.type !== 'textarea') input.type = o.type;
  if (o.placeholder) input.placeholder = o.placeholder;
  if (o.value) input.value = o.value;
  if (o.disabled) input.disabled = true;
  if (o.readOnly) input.readOnly = true;
  document.body.appendChild(input);
  input.getBoundingClientRect = jest.fn().mockReturnValue(defaultRect(o));
  mockOffset(input);
  return input;
}
function createButton(o = {}) {
  const b = document.createElement('button');
  if (o.text) b.textContent = o.text;
  if (o.type) b.type = o.type;
  if (o.disabled) b.disabled = true;
  document.body.appendChild(b);
  b.getBoundingClientRect = jest.fn().mockReturnValue({
    ...defaultRect(o), width: o.width || 80, right: (o.left || 0) + (o.width || 80),
  });
  mockOffset(b);
  return b;
}
function createCE(text) {
  const el = document.createElement('div');
  el.isContentEditable = true;
  if (text) el.textContent = text;
  document.body.appendChild(el);
  el.getBoundingClientRect = jest.fn().mockReturnValue(defaultRect({}));
  mockOffset(el);
  return el;
}

describe('DOM Input Manipulation', () => {
  beforeEach(() => {
    resetDOM();
    window.getComputedStyle = jest.fn().mockReturnValue({ display: 'block', visibility: 'visible', opacity: '1' });
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });
  afterEach(() => { jest.clearAllMocks(); console.error.mockRestore(); });

  describe('dispatchEvent', () => {
    it('should return false if element is null', () => {
      expect(dispatchEvent(null, 'click')).toBe(false);
    });
    it('should dispatch an input event', () => {
      const el = createInputField();
      const spy = jest.spyOn(el, 'dispatchEvent');
      dispatchEvent(el, 'input', { inputType: 'insertText', data: 'test' });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'input', inputType: 'insertText', data: 'test', bubbles: true }));
    });
    it('should dispatch a keyboard event', () => {
      const el = createInputField();
      const spy = jest.spyOn(el, 'dispatchEvent');
      dispatchEvent(el, 'keydown', { key: 'Enter' });
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'keydown', key: 'Enter', bubbles: true }));
    });
    it('should handle errors, call error handler, and return false', () => {
      const el = createInputField();
      el.dispatchEvent = jest.fn(() => { throw new Error('err'); });
      expect(dispatchEvent(el, 'click')).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setInputValue', () => {
    it('should set value and dispatch events for text input', () => {
      const input = createInputField({ type: 'text' });
      const fSpy = jest.spyOn(input, 'focus');
      const dSpy = jest.spyOn(input, 'dispatchEvent');
      expect(setInputValue(input, 'test value')).toBe(true);
      expect(fSpy).toHaveBeenCalled();
      expect(input.value).toBe('test value');
      expect(dSpy).toHaveBeenCalledTimes(4);
    });
    it('should set textContent for contentEditable', () => {
      const el = createCE();
      expect(setInputValue(el, 'test content')).toBe(true);
      expect(el.textContent).toBe('test content');
    });
    it('should handle errors and return false', () => {
      const input = createInputField();
      input.focus = jest.fn(() => { throw new Error('err'); });
      expect(setInputValue(input, 'test')).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('handleTwitterInput', () => {
    it('should return false if element is null', () => { expect(handleTwitterInput(null, 'x')).toBe(false); });
    it('should return false if not contentEditable', () => {
      expect(handleTwitterInput(createInputField({ type: 'text' }), 'x')).toBe(false);
    });
    it('should return false if not a Twitter input', () => {
      const d = document.createElement('div'); d.isContentEditable = true; document.body.appendChild(d);
      expect(handleTwitterInput(d, 'x')).toBe(false);
    });
    it('should handle Twitter input structure', () => {
      const tw = document.createElement('div');
      tw.isContentEditable = true;
      tw.setAttribute('aria-label', 'Tweet text');
      document.body.appendChild(tw);
      tw.closest = jest.fn().mockReturnValue(tw);
      expect(handleTwitterInput(tw, 'Hello Twitter!')).toBe(true);
      expect(tw.querySelector('div[data-contents="true"]')).not.toBeNull();
      expect(tw.querySelector('div[data-block="true"]')).not.toBeNull();
      const span = tw.querySelector('span[data-text="true"]');
      expect(span).not.toBeNull();
      expect(span.textContent).toBe('Hello Twitter!');
    });
    it('should handle errors and return false', () => {
      const tw = document.createElement('div');
      tw.isContentEditable = true;
      tw.setAttribute('aria-label', 'Tweet text');
      document.body.appendChild(tw);
      tw.closest = jest.fn().mockReturnValue(tw);
      tw.focus = jest.fn(() => { throw new Error('err'); });
      expect(handleTwitterInput(tw, 'x')).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('writeToInputField', () => {
    it('should use setInputValue for standard input', () => {
      const input = createInputField({ type: 'text' });
      expect(writeToInputField(input, 'test text')).toBe(true);
      expect(input.value).toBe('test text');
    });
    it('should return false for invalid input', () => {
      expect(writeToInputField(document.createElement('div'), 'x')).toBe(false);
      expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
    it('should validate null input', () => {
      expect(writeToInputField(null, 'x')).toBe(false);
      expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
  });

  describe('appendToInputField', () => {
    it('should return false if null or not input', () => {
      expect(appendToInputField(null, 'x')).toBe(false);
      expect(appendToInputField(document.createElement('div'), 'x')).toBe(false);
      expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
    it('should append text to standard input', () => {
      const input = createInputField({ type: 'text', value: 'Initial ' });
      expect(appendToInputField(input, 'text')).toBe(true);
      expect(input.value).toBe('Initial text');
    });
    it('should use completeText if provided', () => {
      const input = createInputField({ type: 'text', value: 'Initial ' });
      expect(appendToInputField(input, 'ignored', 'Complete replacement')).toBe(true);
      expect(input.value).toBe('Complete replacement');
    });
    it('should append text to contentEditable', () => {
      const el = createCE('Initial ');
      document.execCommand = jest.fn().mockReturnValue(true);
      expect(appendToInputField(el, 'text')).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'Initial text');
    });
    it('should dispatch change event only when isFinal is true', () => {
      const input = createInputField({ type: 'text', value: 'Initial ' });
      const spy = jest.spyOn(input, 'dispatchEvent');
      appendToInputField(input, 'text', '', false);
      expect(spy.mock.calls.filter(c => c[0].type === 'change').length).toBe(0);
      spy.mockClear();
      appendToInputField(input, 'text', '', true);
      expect(spy.mock.calls.filter(c => c[0].type === 'change').length).toBe(1);
    });
    it('should handle errors and return false', () => {
      const input = createInputField({ type: 'text', value: 'x' });
      input.getBoundingClientRect = jest.fn(() => { throw new Error('err'); });
      expect(appendToInputField(input, 'text')).toBe(false);
      expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
  });

  describe('clearInputField', () => {
    it('should clear value of input', () => {
      const input = createInputField({ type: 'text', value: 'initial text' });
      expect(clearInputField(input)).toBe(true);
      expect(input.value).toBe('');
    });
    it('should clear textContent of contentEditable', () => {
      const el = createCE('initial content');
      expect(clearInputField(el)).toBe(true);
      expect(el.textContent).toBe('');
    });
    it('should handle errors and return false', () => {
      const input = createInputField();
      input.focus = jest.fn(() => { throw new Error('err'); });
      expect(clearInputField(input)).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('clickButtonWithFeedback', () => {
    beforeEach(() => { jest.useFakeTimers(); });
    afterEach(() => { jest.useRealTimers(); });
    it('should return false if button is null or disabled', () => {
      expect(clickButtonWithFeedback(null)).toBe(false);
      expect(clickButtonWithFeedback(createButton({ disabled: true }))).toBe(false);
    });
    it('should apply styles, click the button, and restore styles', () => {
      const btn = createButton();
      const spy = jest.spyOn(btn, 'click');
      expect(clickButtonWithFeedback(btn)).toBe(true);
      expect(btn.style.backgroundColor).toBeTruthy();
      expect(btn.style.border).toBeTruthy();
      jest.advanceTimersByTime(500);
      expect(spy).toHaveBeenCalled();
      expect(publish).toHaveBeenCalledWith(EVENTS.STATUS_UPDATED, { messageKey: 'statusSubmitClicked', persistent: false });
    });
    it('should handle errors and return false', () => {
      const btn = createButton();
      Object.defineProperty(btn, 'style', { get: () => { throw new Error('err'); }, configurable: true });
      expect(clickButtonWithFeedback(btn)).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('findElement and findAllElements', () => {
    it('should find an element by selector', () => {
      const div = document.createElement('div'); div.id = 'test-id'; document.body.appendChild(div);
      expect(findElement('#test-id')).toBe(div);
    });
    it('should return null if element is not found', () => { expect(findElement('#none')).toBeNull(); });
    it('should find elements matching a selector', () => {
      document.body.appendChild(document.createElement('div'));
      expect(Array.isArray(findAllElements('div'))).toBe(true);
    });
    it('should handle errors in findElement', () => {
      document.querySelector = jest.fn(() => { throw new Error('err'); });
      expect(findElement('.test')).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
    it('should handle errors in findAllElements', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('err'); });
      expect(findAllElements('.test')).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
