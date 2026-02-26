// Import functions to test
import * as claudeHandler from '../../site-handlers/anthropic-claude';

// Mock dependencies
jest.mock('../../modules/ui', () => ({
  showStatus: jest.fn(),
}));

jest.mock('../../modules/utils', () => ({
  retryInputEvents: jest.fn(),
}));

// Mock chrome.i18n
global.chrome = {
  ...global.chrome,
  i18n: {
    getMessage: jest.fn((key) => `[${key}]`),
  },
};

describe('anthropic-claude.js - detection', () => {
  // Reset DOM and mocks before each test
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'claude.ai',
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isClaudeSite', () => {
    test('detects claude.ai domain', () => {
      // Already set in beforeEach
      const result = claudeHandler.isClaudeSite();

      expect(result).toBe(true);
    });

    test('returns false for anthropic.com domain (not a chat site)', () => {
      // anthropic.com is the company site, not the Claude chat interface
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'anthropic.com',
        },
        writable: true,
      });

      const result = claudeHandler.isClaudeSite();

      expect(result).toBe(false);
    });

    test('returns false for unrelated domain', () => {
      // Set location to unrelated domain
      Object.defineProperty(window, 'location', {
        value: {
          hostname: 'example.com',
        },
        writable: true,
      });

      const result = claudeHandler.isClaudeSite();

      expect(result).toBe(false);
    });
  });

  describe('findBestInputField', () => {
    test('finds English textarea by placeholder', () => {
      // Create a textarea with English placeholder
      const mockTextarea = document.createElement('textarea');
      mockTextarea.setAttribute('placeholder', 'Message Claude...');
      document.body.appendChild(mockTextarea);

      const result = claudeHandler.findBestInputField();

      expect(result).toBe(mockTextarea);
    });

    test('finds Japanese textarea by placeholder', () => {
      // Create a textarea with Japanese placeholder
      const mockTextarea = document.createElement('textarea');
      mockTextarea.setAttribute('placeholder', 'Claudeにメッセージを送信...');
      document.body.appendChild(mockTextarea);

      const result = claudeHandler.findBestInputField();

      expect(result).toBe(mockTextarea);
    });

    test('falls back to ProseMirror contenteditable div', () => {
      const mockDiv = document.createElement('div');
      mockDiv.classList.add('ProseMirror');
      mockDiv.setAttribute('contenteditable', 'true');
      document.body.appendChild(mockDiv);

      const result = claudeHandler.findBestInputField();

      expect(result).toBe(mockDiv);
    });

    test('returns null when no textarea or contenteditable found', () => {
      // No matching elements in DOM
      const result = claudeHandler.findBestInputField();

      expect(result).toBeNull();
    });
  });

  describe('findSubmitButtonForInput', () => {
    test('delegates to findClaudeSubmitButton', () => {
      // Create a mock button with the correct aria-label
      const mockButton = document.createElement('button');
      mockButton.setAttribute('aria-label', 'Send message');

      // Make button visible
      Object.defineProperty(mockButton, 'getBoundingClientRect', {
        value: jest.fn().mockReturnValue({
          width: 100,
          height: 50,
        }),
      });

      document.body.appendChild(mockButton);

      // Mock getComputedStyle
      window.getComputedStyle = jest.fn().mockReturnValue({
        display: 'block',
        visibility: 'visible',
        opacity: '1',
      });

      const inputElement = document.createElement('textarea');
      const result = claudeHandler.findSubmitButtonForInput(inputElement);

      expect(result).toBe(mockButton);
    });
  });
});
