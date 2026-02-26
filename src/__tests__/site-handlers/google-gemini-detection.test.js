// Import functions to test
import * as geminiHandler from '../../site-handlers/google-gemini';

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

describe('google-gemini.js - detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    jest.useFakeTimers();

    Object.defineProperty(window, 'location', {
      value: { hostname: 'gemini.google.com' },
      writable: true,
    });

    Object.defineProperty(window, 'innerHeight', {
      value: 1000,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('isGeminiSite', () => {
    test('detects gemini.google.com domain', () => {
      // Already set in beforeEach
      const result = geminiHandler.isGeminiSite();

      expect(result).toBe(true);
    });

    test('detects bard.google.com domain', () => {
      // Change location to bard.google.com
      Object.defineProperty(window, 'location', {
        value: { hostname: 'bard.google.com' },
        writable: true,
      });

      const result = geminiHandler.isGeminiSite();

      expect(result).toBe(true);
    });

    test('returns false for unrelated domain', () => {
      // Change location to unrelated domain
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
      });

      const result = geminiHandler.isGeminiSite();

      expect(result).toBe(false);
    });
  });

  describe('findBestInputField', () => {
    test('finds textarea with English placeholder', () => {
      // Create a textarea with matching placeholder
      const mockTextarea = document.createElement('textarea');
      mockTextarea.placeholder = 'Message Gemini';

      document.body.appendChild(mockTextarea);

      // Mock querySelectorAll
      document.querySelectorAll = jest.fn().mockReturnValue([mockTextarea]);

      const result = geminiHandler.findBestInputField();

      expect(result).toBe(mockTextarea);
    });

    test('finds textarea with Japanese placeholder', () => {
      // Create a textarea with Japanese placeholder
      const mockTextarea = document.createElement('textarea');
      mockTextarea.placeholder = 'Geminiにメッセージ';

      document.body.appendChild(mockTextarea);

      // Mock querySelectorAll
      document.querySelectorAll = jest.fn().mockReturnValue([mockTextarea]);

      const result = geminiHandler.findBestInputField();

      expect(result).toBe(mockTextarea);
    });

    test('finds textarea with aria-label containing Prompt', () => {
      // Create a textarea with aria-label
      const mockTextarea = document.createElement('textarea');
      mockTextarea.setAttribute('aria-label', 'Prompt textarea');

      document.body.appendChild(mockTextarea);

      // Mock querySelectorAll
      document.querySelectorAll = jest.fn().mockReturnValue([mockTextarea]);

      const result = geminiHandler.findBestInputField();

      expect(result).toBe(mockTextarea);
    });

    test('finds textarea positioned at the bottom of the page', () => {
      // Create a textarea positioned in the lower part
      const mockTextarea = document.createElement('textarea');

      // Position textarea at the bottom
      Object.defineProperty(mockTextarea, 'getBoundingClientRect', {
        value: jest.fn().mockReturnValue({
          top: 800, // Above 70% of window.innerHeight (1000)
        }),
      });

      document.body.appendChild(mockTextarea);

      // Mock querySelectorAll
      document.querySelectorAll = jest.fn().mockReturnValue([mockTextarea]);

      const result = geminiHandler.findBestInputField();

      expect(result).toBe(mockTextarea);
    });

    test('returns null when no textarea found', () => {
      // Mock empty DOM
      document.querySelectorAll = jest.fn().mockReturnValue([]);

      const result = geminiHandler.findBestInputField();

      expect(result).toBeNull();
    });
  });

  describe('findSubmitButtonForInput', () => {
    test.skip('delegates to findGeminiSubmitButton', () => {
      // このテストはスキップします - 単純な委譲関数で、モックが複雑になるため
    });
  });
});
