/**
 * @jest.environment jsdom
 */

import { subscribe, publish, clear, getEventNames, getHandlerCount, EVENTS } from '../../modules/event-bus.js';

describe('Event Bus Module', () => {
  beforeEach(() => {
    // Clear all event handlers before each test
    clear();
  });

  test('subscribe and publish events', () => {
    const mockHandler = jest.fn();
    subscribe('test-event', mockHandler);
    
    publish('test-event', { data: 'test-data' });
    
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledWith({ data: 'test-data' });
  });

  test('unsubscribe from events', () => {
    const mockHandler = jest.fn();
    const unsubscribe = subscribe('test-event', mockHandler);
    
    // First publish should call the handler
    publish('test-event', { data: 'test-data' });
    expect(mockHandler).toHaveBeenCalledTimes(1);
    
    // Unsubscribe
    unsubscribe();
    
    // Second publish should not call the handler
    publish('test-event', { data: 'test-data-2' });
    expect(mockHandler).toHaveBeenCalledTimes(1); // Still 1, not 2
  });

  test('clear removes all event handlers', () => {
    const mockHandler1 = jest.fn();
    const mockHandler2 = jest.fn();
    
    subscribe('event1', mockHandler1);
    subscribe('event2', mockHandler2);
    
    clear();
    
    publish('event1', {});
    publish('event2', {});
    
    expect(mockHandler1).not.toHaveBeenCalled();
    expect(mockHandler2).not.toHaveBeenCalled();
  });

  test('getEventNames returns registered event names', () => {
    subscribe('event1', () => {});
    subscribe('event2', () => {});
    
    const eventNames = getEventNames();
    
    expect(eventNames).toContain('event1');
    expect(eventNames).toContain('event2');
    // 他のテストによってイベントが登録されている可能性があるため、厳密な数ではなく
    // 特定のイベントが含まれていることだけを確認する
    expect(eventNames.length).toBeGreaterThanOrEqual(2);
  });

  test('getHandlerCount returns correct count for an event', () => {
    const event = 'test-event';
    
    expect(getHandlerCount(event)).toBe(0);
    
    subscribe(event, () => {});
    expect(getHandlerCount(event)).toBe(1);
    
    subscribe(event, () => {});
    expect(getHandlerCount(event)).toBe(2);
  });

  test('handles non-function handlers gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Should not throw when passing non-function as handler
    const unsubscribe = subscribe('test-event', 'not-a-function');
    
    expect(consoleSpy).toHaveBeenCalledWith('Event handler must be a function');
    expect(typeof unsubscribe).toBe('function');
    
    // Cleanup
    consoleSpy.mockRestore();
  });

  test('publish handles errors in event handlers', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Subscribe with a handler that throws
    subscribe('test-event', () => {
      throw new Error('Test error');
    });
    
    // Should not throw
    publish('test-event', {});
    
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Error in event handler for "test-event"');
    
    // Cleanup
    consoleSpy.mockRestore();
  });

  test('EVENTS constant contains all expected event types', () => {
    // Check a few key event types to ensure they exist
    expect(EVENTS.MENU_TOGGLED).toBeDefined();
    expect(EVENTS.SPEECH_RECOGNITION_STARTED).toBeDefined();
    expect(EVENTS.SETTINGS_SAVED).toBeDefined();
    expect(EVENTS.HISTORY_ADDED).toBeDefined();
    expect(EVENTS.INITIALIZATION_COMPLETE).toBeDefined();
  });
});