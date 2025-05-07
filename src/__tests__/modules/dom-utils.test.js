/**
 * DOM Utilities テスト
 * 最小限の基本テストだけ実装して、パスと構造を検証
 */

import {
  isElementVisible,
  findElement,
  findAllElements
} from '../../modules/dom-utils';

// Import directly from the utility files
import { resetDOM, mockElementPosition } from '../../utils/dom-helpers';

// 正しくモックする
jest.mock('../../modules/error-handler', () => {
  const ERROR_CATEGORY = {
    DOM: 'DOM_ERROR',
  };
  
  const ERROR_CODE = {};
  ERROR_CODE[ERROR_CATEGORY.DOM] = {
    EVENT_DISPATCH_FAILED: 'DOM_EVENT_DISPATCH_FAILED',
    INPUT_OPERATION_FAILED: 'DOM_INPUT_OPERATION_FAILED',
    TWITTER_INPUT_FAILED: 'DOM_TWITTER_INPUT_FAILED',
    BUTTON_CLICK_FAILED: 'DOM_BUTTON_CLICK_FAILED',
  };
  
  return {
    createError: jest.fn(),
    handleError: jest.fn(),
    ERROR_CODE,
    ERROR_CATEGORY,
    ERROR_SEVERITY: {
      WARNING: 'WARNING',
    },
  };
});

jest.mock('../../modules/event-bus', () => ({
  publish: jest.fn(),
  EVENTS: {
    ERROR_OCCURRED: 'errorOccurred',
    STATUS_UPDATED: 'statusUpdated',
  },
}));

describe('DOM Utilities Basic Tests', () => {
  beforeEach(() => {
    resetDOM();
    window.getComputedStyle = jest.fn().mockReturnValue({
      display: 'block',
      visibility: 'visible',
      opacity: '1',
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset all Jest mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    console.error.mockRestore();
  });

  describe('findElement', () => {
    it('should find an element by selector', () => {
      const div = document.createElement('div');
      div.id = 'test-id';
      document.body.appendChild(div);
      expect(findElement('#test-id')).toBe(div);
    });

    it('should return null if element is not found', () => {
      expect(findElement('#non-existent-id')).toBeNull();
    });
  });

  describe('findAllElements', () => {
    it('should find all elements matching a selector', () => {
      const div1 = document.createElement('div');
      div1.className = 'multi-test';
      const div2 = document.createElement('div');
      div2.className = 'multi-test';
      document.body.appendChild(div1);
      document.body.appendChild(div2);
      
      const elements = findAllElements('.multi-test');
      expect(elements.length).toBe(2);
    });

    it('should return an empty array if no elements are found', () => {
      expect(findAllElements('.non-existent-class')).toEqual([]);
    });
  });
});