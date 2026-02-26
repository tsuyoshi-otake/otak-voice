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
    it('should return true for null, button.disabled=true, aria-disabled, and disabled CSS classes', () => {
      expect(isButtonDisabled(null)).toBe(true);
      expect(isButtonDisabled(createButton({ disabled: true }))).toBe(true);
      const ariaBtn = createButton();
      ariaBtn.setAttribute('aria-disabled', 'true');
      expect(isButtonDisabled(ariaBtn)).toBe(true);
      expect(isButtonDisabled(createButton({ className: 'btn disabled' }))).toBe(true);
      expect(isButtonDisabled(createButton({ className: 'cursor-not-allowed' }))).toBe(true);
      expect(isButtonDisabled(createButton({ className: 'opacity-50' }))).toBe(true);
    });
    it('should return true if getComputedStyle opacity is less than 0.9', () => {
      const button = createButton();
      window.getComputedStyle = jest.fn().mockReturnValue({
        display: 'block', visibility: 'visible', opacity: '0.5',
      });
      expect(isButtonDisabled(button)).toBe(true);
    });
    it('should return false for an enabled button and true on error', () => {
      expect(isButtonDisabled(createButton())).toBe(false);
      const errBtn = createButton();
      jest.spyOn(errBtn, 'getAttribute').mockImplementation(() => { throw new Error('Test'); });
      expect(isButtonDisabled(errBtn)).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('findAllButtons', () => {
    it('should return an array including input[type="submit"] but excluding invisible buttons', () => {
      const submitInput = document.createElement('input');
      submitInput.type = 'submit';
      document.body.appendChild(submitInput);
      submitInput.getBoundingClientRect = jest.fn().mockReturnValue(
        { width: 80, height: 30, top: 0, left: 0, right: 80, bottom: 30 }
      );
      Object.defineProperty(submitInput, 'offsetParent', {
        get: jest.fn().mockReturnValue(document.body), configurable: true
      });

      const invisible = document.createElement('button');
      document.body.appendChild(invisible);
      invisible.getBoundingClientRect = jest.fn().mockReturnValue(
        { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }
      );
      window.getComputedStyle = jest.fn().mockImplementation((el) =>
        el === invisible
          ? { display: 'none', visibility: 'visible', opacity: '1' }
          : { display: 'block', visibility: 'visible', opacity: '1' }
      );

      const buttons = findAllButtons();
      expect(Array.isArray(buttons)).toBe(true);
      expect(buttons).toContain(submitInput);
      expect(buttons).not.toContain(invisible);
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
    it('should find buttons in the same form and nearby buttons when no form exists', () => {
      const form = document.createElement('form');
      document.body.appendChild(form);
      const formInput = createInputField({ type: 'text' });
      form.appendChild(formInput);
      const btn1 = createButton({ text: 'Submit' });
      form.appendChild(btn1);
      const btn2 = createButton({ text: 'Cancel' });
      form.appendChild(btn2);
      const formButtons = findButtonsForInput(formInput);
      expect(formButtons).toContain(btn1);
      expect(formButtons).toContain(btn2);

      const container = document.createElement('div');
      document.body.appendChild(container);
      const divInput = createInputField({ type: 'text' });
      container.appendChild(divInput);
      const nearBtn = createButton({ text: 'Submit' });
      container.appendChild(nearBtn);
      const divButtons = findButtonsForInput(divInput);
      expect(divButtons).toContain(nearBtn);
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
    it('should give extra score for SVG, send-related image, type=submit, and single-form bonus', () => {
      const input = createInputField();

      // SVG bonus
      const plainBtn = createButton({ text: 'Send' });
      const svgBtn = createButton({ text: 'Send' });
      svgBtn.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
      expect(scoreSubmitButton(svgBtn, input)).toBeGreaterThan(scoreSubmitButton(plainBtn, input));

      // Image send bonus
      const imgBtn = createButton();
      const img = document.createElement('img');
      img.src = 'https://example.com/send-icon.png';
      imgBtn.appendChild(img);
      expect(scoreSubmitButton(imgBtn, input)).toBeGreaterThan(scoreSubmitButton(createButton(), input));

      // type=submit bonus
      expect(scoreSubmitButton(createButton({ type: 'submit' }), input))
        .toBeGreaterThan(scoreSubmitButton(createButton({ type: 'button' }), input));

      // Single-form-only bonus
      const makeFormInput = () => {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.getBoundingClientRect = jest.fn().mockReturnValue(
          { width: 100, height: 30, top: 0, left: 0, right: 100, bottom: 30 }
        );
        Object.defineProperty(inp, 'offsetParent', { get: () => document.body, configurable: true });
        return inp;
      };
      const singleForm = document.createElement('form');
      document.body.appendChild(singleForm);
      const singleInp = makeFormInput();
      singleForm.appendChild(singleInp);
      const singleBtn = createButton({ type: 'button' });
      singleForm.appendChild(singleBtn);

      const multiForm = document.createElement('form');
      document.body.appendChild(multiForm);
      const multiInp = makeFormInput();
      multiForm.appendChild(multiInp);
      multiForm.appendChild(createButton({ type: 'button' }));
      multiForm.appendChild(createButton({ type: 'button' }));

      expect(scoreSubmitButton(singleBtn, singleInp))
        .toBeGreaterThan(scoreSubmitButton(multiForm.querySelector('button'), multiInp));
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
    it('should find the highest scoring button and skip disabled top candidates', () => {
      const input = createInputField();
      const submitBtn = createButton({ text: '送信', type: 'submit' });
      const regularBtn = createButton({ text: 'Click Me' });
      expect(findBestSubmitButton(input)).toBe(submitBtn);

      const form = document.createElement('form');
      document.body.appendChild(form);
      const formInput = createInputField();
      form.appendChild(formInput);
      const disabledBtn = createButton({ text: '送信', type: 'submit', disabled: true });
      const enabledBtn = createButton({ text: 'OK' });
      form.appendChild(disabledBtn);
      form.appendChild(enabledBtn);
      const best = findBestSubmitButton(formInput);
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
