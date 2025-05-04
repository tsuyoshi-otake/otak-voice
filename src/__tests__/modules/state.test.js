/**
 * Tests for state.js module
 */

// Import the module to test
import { getState, setState, subscribe, initializeStateFromGlobals } from '../../modules/state.js';
import { PROCESSING_STATE } from '../../constants.js';

// Mock the console methods to avoid cluttering test output
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

describe('State Management Module', () => {
  // Reset state between tests by directly accessing the module
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getState', () => {
    it('should return undefined for non-existent keys', () => {
      const result = getState('nonExistentKey');
      expect(result).toBeUndefined();
      // 警告出力が削除されたため、このテストを修正
      // expect(console.warn).toHaveBeenCalledWith('State key "nonExistentKey" does not exist');
    });

    it('should return the correct value for existing keys', () => {
      // Set a known state value first
      setState('processingState', PROCESSING_STATE.IDLE);
      
      // Then retrieve it
      const result = getState('processingState');
      expect(result).toBe(PROCESSING_STATE.IDLE);
    });

    it('should return a copy of the entire state when no key is provided', () => {
      // Set some known state values
      setState('processingState', PROCESSING_STATE.IDLE);
      setState('isListening', true);
      
      // Get the entire state
      const state = getState();
      
      // Check that it contains the expected values
      expect(state.processingState).toBe(PROCESSING_STATE.IDLE);
      expect(state.isListening).toBe(true);
      
      // Verify it's a copy by modifying it and checking the original is unchanged
      state.processingState = PROCESSING_STATE.EDITING;
      expect(getState('processingState')).toBe(PROCESSING_STATE.IDLE);
    });
  });

  describe('setState', () => {
    it('should update a single state value and return true when value changes', () => {
      const result = setState('processingState', PROCESSING_STATE.EDITING);
      expect(result).toBe(true);
      expect(getState('processingState')).toBe(PROCESSING_STATE.EDITING);
    });

    it('should return false when setting the same value', () => {
      // Set initial value
      setState('processingState', PROCESSING_STATE.IDLE);
      
      // Try to set the same value again
      const result = setState('processingState', PROCESSING_STATE.IDLE);
      expect(result).toBe(false);
    });

    it('should return false for non-existent keys', () => {
      const result = setState('nonExistentKey', 'value');
      expect(result).toBe(false);
      // 警告出力が削除されたため、このテストを修正
      // expect(console.warn).toHaveBeenCalledWith('State key "nonExistentKey" does not exist');
    });

    it('should update multiple state values when given an object', () => {
      const updates = {
        processingState: PROCESSING_STATE.PROOFREADING,
        isListening: true,
        autoSubmit: true
      };
      
      const result = setState(updates);
      expect(result).toBe(true);
      expect(getState('processingState')).toBe(PROCESSING_STATE.PROOFREADING);
      expect(getState('isListening')).toBe(true);
      expect(getState('autoSubmit')).toBe(true);
    });

    it('should return false when no values change in an object update', () => {
      // Set initial values
      setState({
        processingState: PROCESSING_STATE.IDLE,
        isListening: false
      });
      
      // Try to set the same values again
      const result = setState({
        processingState: PROCESSING_STATE.IDLE,
        isListening: false
      });
      
      expect(result).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should call the callback when state changes', () => {
      const callback = jest.fn();
      subscribe('processingState', callback);
      
      setState('processingState', PROCESSING_STATE.EDITING);
      expect(callback).toHaveBeenCalledWith(PROCESSING_STATE.EDITING);
    });

    it('should not call the callback when other state changes', () => {
      const callback = jest.fn();
      subscribe('processingState', callback);
      
      setState('isListening', true);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should return an unsubscribe function that works', () => {
      // First set a known state
      setState('processingState', PROCESSING_STATE.IDLE);
      
      // Create a simple counter
      let callCount = 0;
      const callback = () => { callCount++; };
      
      // Subscribe to changes
      const unsubscribe = subscribe('processingState', callback);
      
      // Verify initial state doesn't trigger callback
      expect(callCount).toBe(0);
      
      // Change state to trigger callback
      setState('processingState', PROCESSING_STATE.EDITING);
      
      // Verify callback was called
      expect(callCount).toBe(1);
      
      // Unsubscribe
      unsubscribe();
      
      // Change state again
      setState('processingState', PROCESSING_STATE.IDLE);
      
      // Verify callback wasn't called again
      expect(callCount).toBe(1);
    });

    it('should handle errors in callbacks gracefully', () => {
      // First set a known state
      setState('processingState', PROCESSING_STATE.IDLE);
      
      // Create a callback that will throw
      const errorCallback = () => {
        throw new Error('Test error');
      };
      
      // Spy on console.error
      console.error = jest.fn();
      
      // Subscribe with the error callback
      subscribe('processingState', errorCallback);
      
      // Change state to trigger callback
      setState('processingState', PROCESSING_STATE.EDITING);
      
      // Verify error was caught and logged
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('initializeStateFromGlobals', () => {
    it('should initialize state from window object', () => {
      // Create a mock window object
      const mockWindow = {
        currentInputElement: document.createElement('input'),
        isListening: true,
        processingState: PROCESSING_STATE.PROOFREADING
      };
      
      // Initialize state from mock window
      initializeStateFromGlobals(mockWindow);
      
      // Check that state was updated
      expect(getState('currentInputElement')).toBe(mockWindow.currentInputElement);
      expect(getState('isListening')).toBe(true);
      expect(getState('processingState')).toBe(PROCESSING_STATE.PROOFREADING);
    });
  });
});