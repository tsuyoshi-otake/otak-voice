/**
 * dom-helpers.js のテスト
 */

import {
  setupLocationMock,
  createSubmitButton,
  createInputField,
  createPaperPlaneButton,
  resetDOM,
  mockElementPosition
} from '../../utils/dom-helpers.js';

describe('DOM Helpers Tests', () => {
  // 各テスト前にDOMをリセット
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // 各テスト後にDOMをリセット
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('setupLocationMock', () => {
    it('should mock window.location with the provided hostname', () => {
      const hostname = 'test.example.com';
      const location = setupLocationMock(hostname);
      
      expect(location.hostname).toBe(hostname);
      expect(window.location.hostname).toBe(hostname);
    });
  });

  describe('createSubmitButton', () => {
    it('should create a button element and add it to the DOM', () => {
      const button = createSubmitButton();
      
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(document.body.contains(button)).toBe(true);
    });

    it('should set aria-label attribute when provided', () => {
      const ariaLabel = 'Send message';
      const button = createSubmitButton({ ariaLabel });
      
      expect(button.getAttribute('aria-label')).toBe(ariaLabel);
    });

    it('should set data-testid attribute when provided', () => {
      const testId = 'submit-button';
      const button = createSubmitButton({ testId });
      
      expect(button.getAttribute('data-testid')).toBe(testId);
    });

    it('should set disabled state when specified', () => {
      const button = createSubmitButton({ disabled: true });
      
      expect(button.disabled).toBe(true);
    });

    it('should set class when selector starts with dot', () => {
      const className = 'submit-btn';
      const button = createSubmitButton({ selector: `.${className}` });
      
      expect(button.className).toBe(className);
    });

    it('should set id when selector starts with hash', () => {
      const id = 'submit-btn';
      const button = createSubmitButton({ selector: `#${id}` });
      
      expect(button.id).toBe(id);
    });
  });

  describe('createInputField', () => {
    it('should create a textarea element and add it to the DOM', () => {
      const input = createInputField();
      
      expect(input).toBeInstanceOf(HTMLTextAreaElement);
      expect(document.body.contains(input)).toBe(true);
    });

    it('should set placeholder attribute when provided', () => {
      const placeholder = 'Type your message...';
      const input = createInputField({ placeholder });
      
      expect(input.getAttribute('placeholder')).toBe(placeholder);
    });

    it('should set initial value when provided', () => {
      const value = 'Initial text';
      const input = createInputField({ value });
      
      expect(input.value).toBe(value);
    });

    it('should hide the element when isVisible is false', () => {
      const input = createInputField({ isVisible: false });
      
      expect(input.style.display).toBe('none');
    });
  });

  describe('createPaperPlaneButton', () => {
    it('should create a button with SVG paper plane icon', () => {
      const button = createPaperPlaneButton();
      
      expect(button).toBeInstanceOf(HTMLButtonElement);
      expect(document.body.contains(button)).toBe(true);
      
      // SVG要素が含まれていることを確認
      const svg = button.querySelector('svg');
      expect(svg).not.toBeNull();
      
      // ペーパープレーンの特徴的な要素を確認
      const line = svg.querySelector('line');
      const polygon = svg.querySelector('polygon');
      
      expect(line).not.toBeNull();
      expect(polygon).not.toBeNull();
      expect(polygon.getAttribute('points')).toContain('22 2');
    });
  });

  describe('resetDOM', () => {
    it('should clear the document body', () => {
      // 要素を追加
      document.body.innerHTML = '<div>Test content</div>';
      expect(document.body.innerHTML).not.toBe('');
      
      // リセット
      resetDOM();
      
      expect(document.body.innerHTML).toBe('');
    });
  });

  describe('mockElementPosition', () => {
    it('should mock getBoundingClientRect method on an element', () => {
      const element = document.createElement('div');
      const position = {
        top: 100,
        left: 200,
        width: 300,
        height: 400
      };
      
      const result = mockElementPosition(element, position);
      
      // 同じ要素が返されることを確認
      expect(result).toBe(element);
      
      // getBoundingClientRectがモック化されていることを確認
      const rect = element.getBoundingClientRect();
      expect(rect.top).toBe(position.top);
      expect(rect.left).toBe(position.left);
      expect(rect.width).toBe(position.width);
      expect(rect.height).toBe(position.height);
      expect(rect.bottom).toBe(position.top + position.height);
      expect(rect.right).toBe(position.left + position.width);
    });

    it('should use default values for missing position properties', () => {
      const element = document.createElement('div');
      const position = {}; // 空のオブジェクト
      
      mockElementPosition(element, position);
      
      const rect = element.getBoundingClientRect();
      expect(rect.top).toBe(0);
      expect(rect.left).toBe(0);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(30);
      expect(rect.bottom).toBe(30);
      expect(rect.right).toBe(100);
    });

    it('should use provided bottom and right values if specified', () => {
      const element = document.createElement('div');
      const position = {
        top: 50,
        left: 60,
        width: 70,
        height: 80,
        bottom: 200, // 通常はtop + heightだが、明示的に指定
        right: 300   // 通常はleft + widthだが、明示的に指定
      };
      
      mockElementPosition(element, position);
      
      const rect = element.getBoundingClientRect();
      expect(rect.bottom).toBe(position.bottom);
      expect(rect.right).toBe(position.right);
    });
  });
});