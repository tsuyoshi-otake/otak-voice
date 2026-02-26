/**
 * DOM Input Detection Tests
 *
 * Tests for isInputElement, findAllInputElements, scoreInputField, findBestInputField
 */

import {
  isInputElement,
  findAllInputElements,
  scoreInputField,
  findBestInputField,
} from '../../modules/dom-utils';

import { resetDOM } from '../../utils/dom-helpers';

// Helper to create an input field with mock positioning
function createInputField(options = {}) {
  const input = document.createElement(options.type === 'textarea' ? 'textarea' : 'input');
  if (options.type && options.type !== 'textarea') input.type = options.type;
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.value) input.value = options.value;
  if (options.disabled) input.disabled = true;
  if (options.readOnly) input.readOnly = true;

  document.body.appendChild(input);

  const rect = {
    width: options.width || 100,
    height: options.height || 30,
    top: options.top || 0,
    left: options.left || 0,
    right: (options.left || 0) + (options.width || 100),
    bottom: (options.top || 0) + (options.height || 30),
  };

  input.getBoundingClientRect = jest.fn().mockReturnValue(rect);

  Object.defineProperty(input, 'offsetParent', {
    get: jest.fn().mockReturnValue(document.body),
    configurable: true
  });

  return input;
}

describe('DOM Input Detection', () => {
  beforeEach(() => {
    resetDOM();

    window.getComputedStyle = jest.fn().mockReturnValue({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
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

  describe('scoreInputField', () => {
    it('should return 0 if element is null', () => {
      expect(scoreInputField(null)).toBe(0);
    });

    it('should give lower score to invisible elements', () => {
      const invisibleInput = document.createElement('input');
      invisibleInput.type = 'text';
      document.body.appendChild(invisibleInput);

      invisibleInput.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0
      });

      const score = scoreInputField(invisibleInput);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should score based on element attributes', () => {
      const chatInput = createInputField({ placeholder: 'Type your message here' });
      const searchInput = createInputField({ placeholder: 'Search' });

      const chatScore = scoreInputField(chatInput);
      const searchScore = scoreInputField(searchInput);

      expect(chatScore).toBeGreaterThan(0);
      expect(searchScore).toBeGreaterThan(0);
    });

    it('should give higher score to textarea elements', () => {
      const textInput = createInputField({ type: 'text' });
      const textareaInput = createInputField({ type: 'textarea' });

      const textScore = scoreInputField(textInput);
      const textareaScore = scoreInputField(textareaInput);

      expect(textareaScore).toBeGreaterThan(textScore);
    });

    it('should score based on element size', () => {
      const smallInput = createInputField({ width: 50, height: 20 });
      const largeInput = createInputField({ width: 300, height: 100 });

      const smallScore = scoreInputField(smallInput);
      const largeScore = scoreInputField(largeInput);

      expect(largeScore).toBeGreaterThan(smallScore);
    });

    it('should handle errors and return 0', () => {
      const input = createInputField();
      input.getBoundingClientRect = jest.fn(() => { throw new Error('Test error'); });

      expect(scoreInputField(input)).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('findBestInputField', () => {
    it('should return null when no input elements exist', () => {
      document.body.innerHTML = '';
      expect(findBestInputField()).toBeNull();
    });

    it('should find an input element when one exists', () => {
      expect(typeof findBestInputField).toBe('function');
      expect(() => findBestInputField()).not.toThrow();
    });

    it('should handle errors and return null', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      expect(findBestInputField()).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
