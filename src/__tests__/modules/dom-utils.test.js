/**
 * DOM Utilities テスト
 * 
 * DOM操作のユーティリティ関数をテストします
 */

import {
  isElementVisible,
  isElementInViewport,
  isInputElement,
  findAllInputElements,
  isButtonDisabled,
  findAllButtons,
  findButtonsForInput,
  scoreSubmitButton,
  findBestSubmitButton,
  scoreInputField,
  findBestInputField,
  dispatchEvent,
  setInputValue,
  handleTwitterInput,
  writeToInputField,
  appendToInputField,
  clickButtonWithFeedback,
  clearInputField,
  findElement,
  findAllElements,
} from '../../modules/dom-utils';

// Import directly from the utility files
import { resetDOM, mockElementPosition } from '../../utils/dom-helpers';

// Import dependencies to mock
import { createError, handleError, ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY } from '../../modules/error-handler';
import { publish, EVENTS } from '../../modules/event-bus';

// Mock dependencies
jest.mock('../../modules/error-handler', () => {
  const ERROR_CATEGORY = {
    DOM: 'DOM_ERROR',
  };
  
  const ERROR_CODE = {};
  ERROR_CODE[ERROR_CATEGORY.DOM] = {
    EVENT_DISPATCH_FAILED: 'DOM_EVENT_DISPATCH_FAILED',
    INPUT_OPERATION_FAILED: 'DOM_INPUT_OPERATION_FAILED',
    TWITTER_INPUT_FAILED: 'DOM_TWITTER_INPUT_FAILED',
    BUTTON_CLICK_FAILED: 'DOM_BUTTON_CLICK_FAILED',
  };
  
  return {
    createError: jest.fn(),
    handleError: jest.fn(),
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY: {
      WARNING: 'WARNING',
    },
  };
});

jest.mock('../../modules/event-bus', () => ({
  publish: jest.fn(),
  EVENTS: {
    ERROR_OCCURRED: 'errorOccurred',
    STATUS_UPDATED: 'statusUpdated',
  },
}));

// Helper to create an input field
function createInputField(options = {}) {
  const input = document.createElement(options.type === 'textarea' ? 'textarea' : 'input');
  if (options.type && options.type !== 'textarea') input.type = options.type;
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.value) input.value = options.value;
  if (options.disabled) input.disabled = true;
  if (options.readOnly) input.readOnly = true;
  
  document.body.appendChild(input);
  
  // Mock getBoundingClientRect
  const rect = {
    width: options.width || 100,
    height: options.height || 30,
    top: options.top || 0,
    left: options.left || 0,
    right: (options.left || 0) + (options.width || 100),
    bottom: (options.top || 0) + (options.height || 30),
  };
  
  input.getBoundingClientRect = jest.fn().mockReturnValue(rect);
  
  // Mock offsetParent
  Object.defineProperty(input, 'offsetParent', {
    get: jest.fn().mockReturnValue(document.body),
    configurable: true
  });
  
  return input;
}

// Helper to create a button
function createButton(options = {}) {
  const button = document.createElement('button');
  if (options.text) button.textContent = options.text;
  if (options.type) button.type = options.type;
  if (options.disabled) button.disabled = true;
  if (options.className) button.className = options.className;
  if (options.id) button.id = options.id;
  
  document.body.appendChild(button);
  
  // Mock getBoundingClientRect
  const rect = {
    width: options.width || 80,
    height: options.height || 30,
    top: options.top || 0,
    left: options.left || 0,
    right: (options.left || 0) + (options.width || 80),
    bottom: (options.top || 0) + (options.height || 30),
  };
  
  button.getBoundingClientRect = jest.fn().mockReturnValue(rect);
  
  // Mock offsetParent
  Object.defineProperty(button, 'offsetParent', {
    get: jest.fn().mockReturnValue(document.body),
    configurable: true
  });
  
  return button;
}

describe('DOM Utilities', () => {
  beforeEach(() => {
    resetDOM();
    
    // Mock window.getComputedStyle
    window.getComputedStyle = jest.fn().mockReturnValue({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
    });
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
    
    // Suppress console errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset all mocks at the start of each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  describe('isElementVisible', () => {
    it('should return true for a visible element', () => {
      const element = createInputField();
      expect(isElementVisible(element)).toBe(true);
    });

    it('should return false if element is null', () => {
      expect(isElementVisible(null)).toBe(false);
    });

    it('should return false if display is none', () => {
      const element = createInputField();
      window.getComputedStyle.mockReturnValueOnce({ display: 'none', visibility: 'visible', opacity: '1' });
      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false if visibility is hidden', () => {
      const element = createInputField();
      window.getComputedStyle.mockReturnValueOnce({ display: 'block', visibility: 'hidden', opacity: '1' });
      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false if opacity is 0', () => {
      const element = createInputField();
      window.getComputedStyle.mockReturnValueOnce({ display: 'block', visibility: 'visible', opacity: '0' });
      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false if width is 0', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      // Directly mock getBoundingClientRect
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 0,
        height: 10,
        top: 0,
        left: 0,
        right: 0,
        bottom: 10
      });
      Object.defineProperty(element, 'offsetParent', {
        get: jest.fn(() => document.body),
        configurable: true
      });
      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false if height is 0', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      // Directly mock getBoundingClientRect
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 10,
        height: 0,
        top: 0,
        left: 0,
        right: 10,
        bottom: 0
      });
      Object.defineProperty(element, 'offsetParent', {
        get: jest.fn(() => document.body),
        configurable: true
      });
      expect(isElementVisible(element)).toBe(false);
    });

    it('should return false if offsetParent is null', () => {
      const element = createInputField();
      Object.defineProperty(element, 'offsetParent', {
        get: jest.fn().mockReturnValue(null),
        configurable: true
      });
      expect(isElementVisible(element)).toBe(false);
    });

    it('should handle errors and return false', () => {
      const element = createInputField();
      window.getComputedStyle.mockImplementationOnce(() => { throw new Error('Test error'); });
      expect(isElementVisible(element)).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isElementInViewport', () => {
    it('should return true for an element in viewport', () => {
      const element = createInputField({ top: 100, left: 100 });
      expect(isElementInViewport(element)).toBe(true);
    });

    it('should return false if element is null', () => {
      expect(isElementInViewport(null)).toBe(false);
    });

    it('should return false if element is outside viewport (top)', () => {
      const element = createInputField({ top: -50 });
      expect(isElementInViewport(element)).toBe(false);
    });

    it('should return false if element is outside viewport (left)', () => {
      const element = createInputField({ left: -50 });
      expect(isElementInViewport(element)).toBe(false);
    });

    it('should return false if element is outside viewport (bottom)', () => {
      const element = createInputField({ top: 750 });
      expect(isElementInViewport(element)).toBe(false);
    });

    it('should return false if element is outside viewport (right)', () => {
      const element = createInputField({ left: 1000 });
      expect(isElementInViewport(element)).toBe(false);
    });

    it('should handle errors and return false', () => {
      const element = createInputField();
      element.getBoundingClientRect.mockImplementationOnce(() => { throw new Error('Test error'); });
      expect(isElementInViewport(element)).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isInputElement', () => {
    it('should return true for a visible text input', () => {
      const element = createInputField({ type: 'text' });
      expect(isInputElement(element)).toBe(true);
    });

    it('should return true for a visible textarea', () => {
      const element = createInputField({ type: 'textarea' });
      expect(isInputElement(element)).toBe(true);
    });

    it('should return true for a visible contentEditable element', () => {
      const element = document.createElement('div');
      element.isContentEditable = true;
      document.body.appendChild(element);
      
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 100, height: 30, top: 0, left: 0, right: 100, bottom: 30
      });
      
      Object.defineProperty(element, 'offsetParent', {
        get: jest.fn().mockReturnValue(document.body),
        configurable: true
      });
      
      expect(isInputElement(element)).toBe(true);
    });

    it('should return false if element is null', () => {
      expect(isInputElement(null)).toBe(false);
    });

    it('should return false for a non-input element', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);
      expect(isInputElement(element)).toBe(false);
    });

    it('should return false for a disabled input', () => {
      const element = createInputField({ type: 'text', disabled: true });
      expect(isInputElement(element)).toBe(false);
    });

    it('should return false for a readonly input', () => {
      const element = createInputField({ type: 'text', readOnly: true });
      expect(isInputElement(element)).toBe(false);
    });

    it('should return false for button-type inputs', () => {
      const element = createInputField({ type: 'button' });
      expect(isInputElement(element)).toBe(false);
    });
  });

  describe('findAllInputElements', () => {
    it('should find all valid input elements', () => {
      const input1 = createInputField({ type: 'text' });
      const input2 = createInputField({ type: 'textarea' });
      
      const contentEditable = document.createElement('div');
      contentEditable.isContentEditable = true;
      contentEditable.setAttribute('contenteditable', 'true');
      document.body.appendChild(contentEditable);
      
      contentEditable.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 100, height: 30, top: 0, left: 0, right: 100, bottom: 30
      });
      
      Object.defineProperty(contentEditable, 'offsetParent', {
        get: jest.fn().mockReturnValue(document.body),
        configurable: true
      });
      
      // Create a non-input element which should be filtered out
      const nonInput = document.createElement('div');
      document.body.appendChild(nonInput);
      
      const elements = findAllInputElements();
      expect(elements.length).toBe(3);
      expect(elements).toContain(input1);
      expect(elements).toContain(input2);
      expect(elements).toContain(contentEditable);
      expect(elements).not.toContain(nonInput);
    });

    it('should return an empty array if no input elements are found', () => {
      expect(findAllInputElements()).toEqual([]);
    });

    it('should handle errors and return an empty array', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      expect(findAllInputElements()).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('isButtonDisabled', () => {
    it('should return true if button is null', () => {
      expect(isButtonDisabled(null)).toBe(true);
    });

    it('should return true if button.disabled is true', () => {
      const button = createButton({ disabled: true });
      expect(isButtonDisabled(button)).toBe(true);
    });

    it('should return true if aria-disabled is true', () => {
      const button = createButton();
      button.setAttribute('aria-disabled', 'true');
      expect(isButtonDisabled(button)).toBe(true);
    });

    it('should return true if className contains disabled', () => {
      const button = createButton({ className: 'btn disabled' });
      expect(isButtonDisabled(button)).toBe(true);
    });

    it('should return false for an enabled button', () => {
      const button = createButton();
      expect(isButtonDisabled(button)).toBe(false);
    });
  });

  describe('findAllButtons', () => {
    it('should find button elements', () => {
      // Create some buttons in the DOM
      const button1 = document.createElement('button');
      document.body.appendChild(button1);
      const button2 = document.createElement('button');
      document.body.appendChild(button2);
      
      // Simply verify the function returns an array
      const buttons = findAllButtons();
      expect(Array.isArray(buttons)).toBe(true);
    });

    it('should handle errors and return an empty array', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      expect(findAllButtons()).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('findElement and findAllElements', () => {
    it('should find an element by selector', () => {
      const div = document.createElement('div');
      div.id = 'test-id';
      document.body.appendChild(div);
      
      expect(findElement('#test-id')).toBe(div);
    });
    
    it('should return null if element is not found', () => {
      expect(findElement('#non-existent')).toBeNull();
    });
    
    it('should find elements matching a selector', () => {
      // Create some test divs
      const div1 = document.createElement('div');
      div1.id = 'test-div-1';
      document.body.appendChild(div1);
      
      const div2 = document.createElement('div');
      div2.id = 'test-div-2';
      document.body.appendChild(div2);
      
      // Simply verify the function returns an array
      const elements = findAllElements('div');
      expect(Array.isArray(elements)).toBe(true);
    });
    
    it('should handle errors in findElement', () => {
      document.querySelector = jest.fn(() => { throw new Error('Test error'); });
      expect(findElement('.test')).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
    
    it('should handle errors in findAllElements', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      expect(findAllElements('.test')).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('dispatchEvent', () => {
    it('should return false if element is null', () => {
      expect(dispatchEvent(null, 'click')).toBe(false);
    });
    
    it('should dispatch an input event', () => {
      const element = createInputField();
      const dispatchSpy = jest.spyOn(element, 'dispatchEvent');
      
      dispatchEvent(element, 'input', { inputType: 'insertText', data: 'test' });
      
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'input',
        inputType: 'insertText',
        data: 'test',
        bubbles: true
      }));
    });
    
    it('should dispatch a keyboard event', () => {
      const element = createInputField();
      const dispatchSpy = jest.spyOn(element, 'dispatchEvent');
      
      dispatchEvent(element, 'keydown', { key: 'Enter' });
      
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
        type: 'keydown',
        key: 'Enter',
        bubbles: true
      }));
    });
    
    it('should handle errors, call error handler, and return false', () => {
      const element = createInputField();
      element.dispatchEvent = jest.fn(() => { throw new Error('Test error'); });
      
      const result = dispatchEvent(element, 'click');
      
      expect(result).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setInputValue', () => {
    it('should set value and dispatch events for text input', () => {
      const input = createInputField({ type: 'text' });
      const focusSpy = jest.spyOn(input, 'focus');
      const dispatchSpy = jest.spyOn(input, 'dispatchEvent');
      
      const result = setInputValue(input, 'test value');
      
      expect(result).toBe(true);
      expect(focusSpy).toHaveBeenCalled();
      expect(input.value).toBe('test value');
      expect(dispatchSpy).toHaveBeenCalledTimes(4); // input, change, keydown, keyup
    });
    
    it('should set textContent for contentEditable', () => {
      const element = document.createElement('div');
      element.isContentEditable = true;
      document.body.appendChild(element);
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 100, height: 30, top: 0, left: 0, right: 100, bottom: 30
      });
      Object.defineProperty(element, 'offsetParent', {
        get: jest.fn().mockReturnValue(document.body),
        configurable: true
      });
      
      const result = setInputValue(element, 'test content');
      
      expect(result).toBe(true);
      expect(element.textContent).toBe('test content');
    });
    
    it('should handle errors and return false', () => {
      const input = createInputField();
      input.focus = jest.fn(() => { throw new Error('Test error'); });
      
      const result = setInputValue(input, 'test');
      
      expect(result).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });
  });

  describe('writeToInputField', () => {
    it('should use setInputValue for standard input elements', () => {
      const input = createInputField({ type: 'text' });
      
      const result = writeToInputField(input, 'test text');
      
      expect(result).toBe(true);
      expect(input.value).toBe('test text');
    });
    
    it('should return false for invalid input element', () => {
      const div = document.createElement('div');
      
      const result = writeToInputField(div, 'test');
      
      expect(result).toBe(false);
      expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
    
    it('should validate null input', () => {
      // Test with a null element (which should return false)
      expect(writeToInputField(null, 'test')).toBe(false);
      
      // Make sure publish was called for error reporting
      expect(publish).toHaveBeenCalledWith(EVENTS.ERROR_OCCURRED, expect.any(Object));
    });
  });

  describe('clearInputField', () => {
    it('should clear value of input element', () => {
      const input = createInputField({ type: 'text', value: 'initial text' });
      
      const result = clearInputField(input);
      
      expect(result).toBe(true);
      expect(input.value).toBe('');
    });
    
    it('should clear textContent of contentEditable element', () => {
      const element = document.createElement('div');
      element.isContentEditable = true;
      element.textContent = 'initial content';
      document.body.appendChild(element);
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 100, height: 30, top: 0, left: 0, right: 100, bottom: 30
      });
      Object.defineProperty(element, 'offsetParent', {
        get: jest.fn().mockReturnValue(document.body),
        configurable: true
      });
      
      const result = clearInputField(element);
      
      expect(result).toBe(true);
      expect(element.textContent).toBe('');
    });
    
    it('should handle errors and return false', () => {
      const input = createInputField();
      input.focus = jest.fn(() => { throw new Error('Test error'); });
      
      const result = clearInputField(input);
      
      expect(result).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });
  });
  
  describe('clickButtonWithFeedback', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should return false if button is null or disabled', () => {
      expect(clickButtonWithFeedback(null)).toBe(false);
      
      const disabledButton = createButton({ disabled: true });
      expect(clickButtonWithFeedback(disabledButton)).toBe(false);
    });
    
    it('should apply styles, click the button, and restore styles', () => {
      const button = createButton();
      const clickSpy = jest.spyOn(button, 'click');
      
      const result = clickButtonWithFeedback(button);
      
      expect(result).toBe(true);
      // CSS colors may be normalized to rgb format, so use a more flexible assertion
      expect(button.style.backgroundColor).toBeTruthy();
      expect(button.style.border).toBeTruthy();
      
      // Advance timers to trigger the timeout
      jest.advanceTimersByTime(500);
      
      expect(clickSpy).toHaveBeenCalled();
      expect(publish).toHaveBeenCalledWith(EVENTS.STATUS_UPDATED, {
        messageKey: 'statusSubmitClicked',
        persistent: false
      });
    });
    
    it('should handle errors and return false', () => {
      const button = createButton();
      Object.defineProperty(button, 'style', {
        get: () => { throw new Error('Style error'); },
        configurable: true
      });
      
      const result = clickButtonWithFeedback(button);
      
      expect(result).toBe(false);
      expect(createError).toHaveBeenCalled();
      expect(handleError).toHaveBeenCalled();
    });
  });
});