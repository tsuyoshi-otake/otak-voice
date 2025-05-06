// Import the functions to test
import { 
  findBestInputField,
  findSubmitButtonForInput,
  submitAfterVoiceInput,
  isTwitterPage
} from '../../site-handlers/twitter';

// Mock dependencies
jest.mock('../../modules/ui', () => ({
  showStatus: jest.fn(),
  showRecognitionTextModal: jest.fn()
}));

jest.mock('../../modules/dom-utils', () => ({
  findElement: jest.fn(),
  findAllElements: jest.fn()
}));

jest.mock('../../modules/event-bus', () => ({
  publish: jest.fn(),
  EVENTS: {
    STATUS_UPDATED: 'statusUpdated'
  }
}));

describe('twitter.js', () => {
  // Setup and teardown
  beforeEach(() => {
    // Reset mocks and DOM
    jest.clearAllMocks();
    document.body.innerHTML = '';

    // Mock console methods to avoid test output clutter
    jest.spyOn(console, 'log').mockImplementation(() => {});

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        hostname: 'twitter.com'
      },
      writable: true
    });

    // Set up global lastRecognizedText used by submitAfterVoiceInput
    window.lastRecognizedText = 'This is a test tweet';
  });

  afterEach(() => {
    // Clean up
    delete window.lastRecognizedText;
  });

  describe('findBestInputField', () => {
    test('always returns null for Twitter and publishes warning event', () => {
      const result = findBestInputField();
      
      // Verify the function returns null
      expect(result).toBeNull();
      
      // Verify the event-bus publish was called with Twitter incompatibility message
      expect(require('../../modules/event-bus').publish).toHaveBeenCalledWith(
        'statusUpdated',
        {
          messageKey: 'statusTwitterNotSupported',
          persistent: true
        }
      );
    });
  });

  describe('findSubmitButtonForInput', () => {
    test('returns null when input element is null', () => {
      const result = findSubmitButtonForInput(null);
      
      expect(result).toBeNull();
      expect(require('../../modules/dom-utils').findElement).not.toHaveBeenCalled();
    });

    test('finds tweet button by data-testid attribute', () => {
      // Create a mock button
      const mockButton = document.createElement('button');
      mockButton.setAttribute('data-testid', 'tweetButton');
      
      // Mock findElement to return our button
      require('../../modules/dom-utils').findElement.mockReturnValue(mockButton);
      
      // Create a mock input element
      const mockInput = document.createElement('div');
      
      const result = findSubmitButtonForInput(mockInput);
      
      expect(require('../../modules/dom-utils').findElement).toHaveBeenCalledWith(
        '[data-testid="tweetButton"], [data-testid="tweetButtonInline"]'
      );
      expect(result).toBe(mockButton);
    });

    test('returns null when tweet button is not found', () => {
      // Mock findElement to return null
      require('../../modules/dom-utils').findElement.mockReturnValue(null);
      
      // Create a mock input element
      const mockInput = document.createElement('div');
      
      const result = findSubmitButtonForInput(mockInput);
      
      expect(result).toBeNull();
    });
  });

  describe('submitAfterVoiceInput', () => {
    test('shows modal with recognized text and publishes status event', () => {
      // Set recognized text in window (already done in beforeEach)
      
      const result = submitAfterVoiceInput();
      
      // Verify modal was shown
      expect(require('../../modules/ui').showRecognitionTextModal).toHaveBeenCalledWith('This is a test tweet');
      
      // Verify status event was published
      expect(require('../../modules/event-bus').publish).toHaveBeenCalledWith(
        'statusUpdated',
        {
          messageKey: 'statusTwitterUseModal',
          persistent: false
        }
      );
      
      // Verify function returns true
      expect(result).toBe(true);
    });

    test('returns false when no recognized text is available', () => {
      // Remove recognized text
      delete window.lastRecognizedText;
      
      const result = submitAfterVoiceInput();
      
      // Verify modal was not shown
      expect(require('../../modules/ui').showRecognitionTextModal).not.toHaveBeenCalled();
      
      // Verify function returns false
      expect(result).toBe(false);
    });
  });

  describe('isTwitterPage', () => {
    test('detects twitter.com hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'twitter.com' },
        writable: true
      });
      
      const result = isTwitterPage();
      
      expect(result).toBe(true);
    });

    test('detects x.com hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'x.com' },
        writable: true
      });
      
      const result = isTwitterPage();
      
      expect(result).toBe(true);
    });

    test('detects mobile.twitter.com hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'mobile.twitter.com' },
        writable: true
      });
      
      const result = isTwitterPage();
      
      expect(result).toBe(true);
    });

    test('returns false for unrelated hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true
      });
      
      const result = isTwitterPage();
      
      expect(result).toBe(false);
    });
  });
});