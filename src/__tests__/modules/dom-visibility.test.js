/**
 * DOM Visibility Tests
 *
 * Tests for isElementVisible, isElementInViewport
 */

import {
  isElementVisible,
  isElementInViewport,
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

describe('DOM Visibility', () => {
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
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 0, height: 10, top: 0, left: 0, right: 0, bottom: 10
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
      element.getBoundingClientRect = jest.fn().mockReturnValue({
        width: 10, height: 0, top: 0, left: 0, right: 10, bottom: 0
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
});
