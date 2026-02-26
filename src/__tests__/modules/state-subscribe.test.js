/**
 * Tests for state.js module - subscribe, notifications, and cleanup
 */

import { getState, setState, subscribe } from '../../modules/state.js';
import { PROCESSING_STATE } from '../../constants.js';

// Mock the console methods to avoid cluttering test output
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};

describe('State Management Module - Subscribe & Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      setState('processingState', PROCESSING_STATE.IDLE);

      let callCount = 0;
      const callback = () => { callCount++; };

      const unsubscribe = subscribe('processingState', callback);

      // Subscribing should not trigger callback immediately
      expect(callCount).toBe(0);

      // Change state to trigger callback
      setState('processingState', PROCESSING_STATE.EDITING);
      expect(callCount).toBe(1);

      // Unsubscribe
      unsubscribe();

      // Further state changes should not trigger the callback
      setState('processingState', PROCESSING_STATE.IDLE);
      expect(callCount).toBe(1);
    });

    it('should handle errors in callbacks gracefully', () => {
      setState('processingState', PROCESSING_STATE.IDLE);

      const errorCallback = () => {
        throw new Error('Test error');
      };

      console.error = jest.fn();

      subscribe('processingState', errorCallback);
      setState('processingState', PROCESSING_STATE.EDITING);

      // Error should be caught and logged, not propagated
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('subscribe with non-existent key', () => {
    it('should return a no-op function when subscribing to non-existent key', () => {
      const unsubscribe = subscribe('nonExistentKey', jest.fn());

      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('subscribe edge cases', () => {
    it('should warn and return no-op function when callback is not a function', () => {
      console.warn = jest.fn();

      const unsubscribe = subscribe('processingState', 'not a function');

      expect(console.warn).toHaveBeenCalledWith('Subscriber callback must be a function');
      expect(typeof unsubscribe).toBe('function');
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should support multiple subscribers for the same key', () => {
      setState('processingState', PROCESSING_STATE.IDLE);

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      subscribe('processingState', callback1);
      subscribe('processingState', callback2);

      setState('processingState', PROCESSING_STATE.EDITING);

      expect(callback1).toHaveBeenCalledWith(PROCESSING_STATE.EDITING);
      expect(callback2).toHaveBeenCalledWith(PROCESSING_STATE.EDITING);
    });

    it('should only unsubscribe the specific callback, not others', () => {
      setState('processingState', PROCESSING_STATE.IDLE);

      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = subscribe('processingState', callback1);
      subscribe('processingState', callback2);

      unsubscribe1();

      setState('processingState', PROCESSING_STATE.EDITING);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(PROCESSING_STATE.EDITING);
    });

    it('should not call subscriber when value does not change', () => {
      setState('processingState', PROCESSING_STATE.IDLE);

      const callback = jest.fn();
      subscribe('processingState', callback);

      // Setting the same value should not trigger the subscriber
      setState('processingState', PROCESSING_STATE.IDLE);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('batch updates via setState with object', () => {
    it('should notify subscribers for each changed key in a batch update', () => {
      setState('processingState', PROCESSING_STATE.IDLE);
      setState('isListening', false);

      const processingCallback = jest.fn();
      const listeningCallback = jest.fn();

      subscribe('processingState', processingCallback);
      subscribe('isListening', listeningCallback);

      setState({
        processingState: PROCESSING_STATE.PROOFREADING,
        isListening: true
      });

      expect(processingCallback).toHaveBeenCalledWith(PROCESSING_STATE.PROOFREADING);
      expect(listeningCallback).toHaveBeenCalledWith(true);
    });

    it('should not notify subscribers for unchanged keys in a batch update', () => {
      setState('processingState', PROCESSING_STATE.IDLE);
      setState('isListening', false);

      const processingCallback = jest.fn();
      const listeningCallback = jest.fn();

      subscribe('processingState', processingCallback);
      subscribe('isListening', listeningCallback);

      // Only change processingState, keep isListening the same
      setState({
        processingState: PROCESSING_STATE.EDITING,
        isListening: false
      });

      expect(processingCallback).toHaveBeenCalledWith(PROCESSING_STATE.EDITING);
      expect(listeningCallback).not.toHaveBeenCalled();
    });
  });
});
