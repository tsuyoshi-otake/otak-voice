/**
 * DOM Button Detection Tests
 * Tests for isButtonDisabled, findAllButtons, findButtonsForInput,
 * scoreSubmitButton, findBestSubmitButton
 */
import {
  isButtonDisabled, findAllButtons, findButtonsForInput,
  scoreSubmitButton, findBestSubmitButton,
} from '../../modules/dom-utils';
import { resetDOM } from '../../utils/dom-helpers';

function createInputField(options = {}) {
  const input = document.createElement(options.type === 'textarea' ? 'textarea' : 'input');
  if (options.type && options.type !== 'textarea') input.type = options.type;
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.value) input.value = options.value;
  if (options.disabled) input.disabled = true;
  if (options.readOnly) input.readOnly = true;
  document.body.appendChild(input);
  input.getBoundingClientRect = jest.fn().mockReturnValue({
    width: options.width || 100, height: options.height || 30,
    top: options.top || 0, left: options.left || 0,
    right: (options.left || 0) + (options.width || 100),
    bottom: (options.top || 0) + (options.height || 30),
  });
  Object.defineProperty(input, 'offsetParent', {
    get: jest.fn().mockReturnValue(document.body), configurable: true
  });
  return input;
}

function createButton(options = {}) {
  const button = document.createElement('button');
  if (options.text) button.textContent = options.text;
  if (options.type) button.type = options.type;
  if (options.disabled) button.disabled = true;
  if (options.className) button.className = options.className;
  if (options.id) button.id = options.id;
  document.body.appendChild(button);
  button.getBoundingClientRect = jest.fn().mockReturnValue({
    width: options.width || 80, height: options.height || 30,
    top: options.top || 0, left: options.left || 0,
    right: (options.left || 0) + (options.width || 80),
    bottom: (options.top || 0) + (options.height || 30),
  });
  Object.defineProperty(button, 'offsetParent', {
    get: jest.fn().mockReturnValue(document.body), configurable: true
  });
  return button;
}

describe('DOM Button Detection', () => {
  beforeEach(() => {
    resetDOM();
    window.getComputedStyle = jest.fn().mockReturnValue({
      display: 'block', visibility: 'visible', opacity: '1',
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

  describe('isButtonDisabled', () => {
    it('should return true if button is null', () => {
      expect(isButtonDisabled(null)).toBe(true);
    });
    it('should return true if button.disabled is true', () => {
      expect(isButtonDisabled(createButton({ disabled: true }))).toBe(true);
    });
    it('should return true if aria-disabled is true', () => {
      const button = createButton();
      button.setAttribute('aria-disabled', 'true');
      expect(isButtonDisabled(button)).toBe(true);
    });
    it('should return true if className contains disabled', () => {
      expect(isButtonDisabled(createButton({ className: 'btn disabled' }))).toBe(true);
    });
    it('should return false for an enabled button', () => {
      expect(isButtonDisabled(createButton())).toBe(false);
    });
  });

  describe('findAllButtons', () => {
    it('should find button elements', () => {
      document.body.appendChild(document.createElement('button'));
      document.body.appendChild(document.createElement('button'));
      expect(Array.isArray(findAllButtons())).toBe(true);
    });
    it('should handle errors and return an empty array', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      expect(findAllButtons()).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('findButtonsForInput', () => {
    it('should return an empty array if input element is null', () => {
      expect(findButtonsForInput(null)).toEqual([]);
    });
    it('should find buttons in the same form', () => {
      const form = document.createElement('form');
      document.body.appendChild(form);
      const input = createInputField({ type: 'text' });
      form.appendChild(input);
      const button1 = createButton({ text: 'Submit' });
      form.appendChild(button1);
      const button2 = createButton({ text: 'Cancel' });
      form.appendChild(button2);
      const buttons = findButtonsForInput(input);
      expect(buttons.length).toBe(2);
      expect(buttons).toContain(button1);
      expect(buttons).toContain(button2);
    });
    it('should find nearby buttons when no form exists', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const input = createInputField({ type: 'text' });
      container.appendChild(input);
      const button = createButton({ text: 'Submit' });
      container.appendChild(button);
      const buttons = findButtonsForInput(input);
      expect(buttons.length).toBe(1);
      expect(buttons).toContain(button);
    });
    it('should handle errors and return an empty array', () => {
      const form = document.createElement('form');
      document.body.appendChild(form);
      const testInput = createInputField({ type: 'text' });
      form.appendChild(testInput);
      const orig = Element.prototype.querySelectorAll;
      Element.prototype.querySelectorAll = jest.fn(() => { throw new Error('Test error'); });
      try {
        expect(findButtonsForInput(testInput)).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      } finally {
        Element.prototype.querySelectorAll = orig;
      }
    });
  });

  describe('scoreSubmitButton', () => {
    it('should return 0 if button or input is null', () => {
      const button = createButton();
      const input = createInputField();
      expect(scoreSubmitButton(null, input)).toBe(0);
      expect(scoreSubmitButton(button, null)).toBe(0);
      expect(scoreSubmitButton(null, null)).toBe(0);
    });
    it('should score based on text content and attributes', () => {
      const input = createInputField();
      const submitButton = createButton({ text: '送信', type: 'submit' });
      const regularButton = createButton({ text: 'Click Me' });
      const idButton = createButton({ id: 'submit-button' });
      const classButton = createButton({ className: 'submit-btn' });
      const submitScore = scoreSubmitButton(submitButton, input);
      const regularScore = scoreSubmitButton(regularButton, input);
      const idScore = scoreSubmitButton(idButton, input);
      const classScore = scoreSubmitButton(classButton, input);
      expect(submitScore).toBeGreaterThan(regularScore);
      expect(submitScore).toBeGreaterThan(idScore);
      expect(submitScore).toBeGreaterThan(classScore);
      expect(idScore).toBeGreaterThan(regularScore);
      expect(classScore).toBeGreaterThan(regularScore);
    });
    it('should score based on position relative to input', () => {
      const input = createInputField({ left: 100, top: 100 });
      const rightButton = createButton({ left: 210, top: 100 });
      const belowButton = createButton({ left: 100, top: 140 });
      const farButton = createButton({ left: 500, top: 500 });
      expect(scoreSubmitButton(rightButton, input)).toBeGreaterThan(scoreSubmitButton(farButton, input));
      expect(scoreSubmitButton(belowButton, input)).toBeGreaterThan(scoreSubmitButton(farButton, input));
    });
    it('should reduce score for disabled buttons', () => {
      const input = createInputField();
      const enabled = createButton({ text: 'Submit', type: 'submit' });
      const disabled = createButton({ text: 'Submit', type: 'submit', disabled: true });
      expect(scoreSubmitButton(enabled, input)).toBeGreaterThan(scoreSubmitButton(disabled, input));
    });
    it('should handle errors and return 0', () => {
      const input = createInputField();
      const button = createButton();
      button.getBoundingClientRect = jest.fn(() => { throw new Error('Test error'); });
      expect(scoreSubmitButton(button, input)).toBe(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('findBestSubmitButton', () => {
    it('should return null if input element is null', () => {
      expect(findBestSubmitButton(null)).toBeNull();
    });
    it('should find the highest scoring button', () => {
      const testInput = createInputField();
      document.body.appendChild(testInput);
      const submitButton = createButton({ text: '送信', type: 'submit' });
      const regularButton = createButton({ text: 'Click Me' });
      document.body.appendChild(submitButton);
      document.body.appendChild(regularButton);
      expect(findBestSubmitButton(testInput)).toBe(submitButton);
    });
    it('should skip disabled buttons and choose the next best', () => {
      const disabledBtn = createButton({ text: '送信', type: 'submit', disabled: true });
      const enabledBtn = createButton({ text: 'OK' });
      const testInput = createInputField();
      const form = document.createElement('form');
      document.body.appendChild(form);
      form.appendChild(testInput);
      form.appendChild(disabledBtn);
      form.appendChild(enabledBtn);
      expect(isButtonDisabled(disabledBtn)).toBe(true);
      expect(isButtonDisabled(enabledBtn)).toBe(false);
      const best = findBestSubmitButton(testInput);
      expect(best).not.toBe(disabledBtn);
      expect(best).toBe(enabledBtn);
    });
    it('should handle errors and return null', () => {
      const input = createInputField();
      input.getBoundingClientRect = jest.fn(() => { throw new Error('Test error'); });
      expect(findBestSubmitButton(input)).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
