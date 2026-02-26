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
    jest.clearAllMocks();
    resetDOM();

    window.getComputedStyle = jest.fn().mockReturnValue({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
    });

    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });

    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
      const originalQuerySelectorAll = document.querySelectorAll.bind(document);
      document.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      try {
        expect(findAllInputElements()).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      } finally {
        document.querySelectorAll = originalQuerySelectorAll;
      }
    });
  });

  describe('scoreInputField', () => {
    it('should return 0 if element is null', () => {
      expect(scoreInputField(null)).toBe(0);
    });

    it('should return 0 for an invisible element (zero dimensions)', () => {
      const invisibleInput = document.createElement('input');
      invisibleInput.type = 'text';
      document.body.appendChild(invisibleInput);

      invisibleInput.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0
      });

      const score = scoreInputField(invisibleInput);
      expect(score).toBe(0);
    });

    it('should score chat keywords higher than search keywords', () => {
      const chatInput = createInputField({ placeholder: 'chat message' });
      const searchInput = createInputField({ placeholder: 'search here' });
      expect(scoreInputField(chatInput)).toBeGreaterThan(0);
      expect(scoreInputField(searchInput)).toBeGreaterThan(0);
      expect(scoreInputField(chatInput)).toBeGreaterThan(scoreInputField(searchInput));
    });

    it('should give score bonus for in-viewport element and for chat/comment keywords in id/placeholder', () => {
      const inViewport = createInputField({ top: 0, left: 0, width: 100, height: 30 });
      const outViewport = createInputField({ top: 9999, left: 0, width: 100, height: 30 });
      expect(scoreInputField(inViewport)).toBeGreaterThan(scoreInputField(outViewport));

      const inputWithId = createInputField();
      inputWithId.id = 'main-input-field';
      expect(scoreInputField(inputWithId)).toBeGreaterThan(0);

      const inputWithComment = createInputField({ placeholder: 'Add a comment' });
      expect(scoreInputField(inputWithComment)).toBeGreaterThan(0);
    });

    it('should give higher score to textarea elements', () => {
      const textInput = createInputField({ type: 'text' });
      const textareaInput = createInputField({ type: 'textarea' });

      const textScore = scoreInputField(textInput);
      const textareaScore = scoreInputField(textareaInput);

      expect(textareaScore).toBeGreaterThan(textScore);
    });

    it('should give contentEditable element a lower score than textarea', () => {
      const textarea = createInputField({ type: 'textarea' });
      const contentEditable = document.createElement('div');
      Object.defineProperty(contentEditable, 'isContentEditable', { get: () => true, configurable: true });
      document.body.appendChild(contentEditable);
      contentEditable.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 100, height: 30, top: 0, left: 0, right: 100, bottom: 30
      });
      Object.defineProperty(contentEditable, 'offsetParent', {
        get: jest.fn().mockReturnValue(document.body), configurable: true
      });

      expect(scoreInputField(textarea)).toBeGreaterThan(scoreInputField(contentEditable));
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
    let originalQuerySelectorAll;

    beforeEach(() => {
      // Save and restore in case a prior test replaced document.querySelectorAll
      originalQuerySelectorAll = document.querySelectorAll.bind(document);
    });

    afterEach(() => {
      document.querySelectorAll = originalQuerySelectorAll;
    });

    it('should return null when no input elements exist', () => {
      document.body.innerHTML = '';
      expect(findBestInputField()).toBeNull();
    });

    it('should return the single input when only one exists', () => {
      const input = createInputField({ type: 'textarea' });
      const result = findBestInputField();
      expect(result).toBe(input);
    });

    it('should return the highest-scoring input and a non-null result', () => {
      createInputField({ type: 'textarea', width: 50, height: 20 });
      const bestInput = createInputField({ type: 'textarea', placeholder: 'chat message', width: 200, height: 80 });
      const result = findBestInputField();
      expect(result).not.toBeNull();
      expect(result).toBe(bestInput);
    });

    it('should handle errors and return null', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      expect(findBestInputField()).toBeNull();
      expect(console.error).toHaveBeenCalled();
      // Restore is handled by afterEach
    });
  });
});
