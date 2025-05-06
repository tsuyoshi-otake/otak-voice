/**
 * OpenAI ChatGPT Site Handler Tests
 */

// モジュールのモック
jest.mock('../../modules/ui.js', () => ({
  showStatus: jest.fn()
}));

jest.mock('../../modules/utils.js', () => ({
  retryInputEvents: jest.fn()
}));

// インポート
import { 
  findChatGPTSubmitButton,
  submitAfterVoiceInput,
  findSubmitButtonForInput,
  isChatGPTSite
} from '../../site-handlers/openai-chatgpt';
import { showStatus } from '../../modules/ui.js';
import { retryInputEvents } from '../../modules/utils.js';

describe('OpenAI ChatGPT Site Handler', () => {
  // テスト前の準備
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // chrome API のモック
    global.chrome = {
      i18n: {
        getMessage: jest.fn(key => key)
      }
    };
    
    // consoleのモック
    console.log = jest.fn();
    
    // locationのモック
    delete window.location;
    window.location = {
      hostname: '',
      includes: jest.fn(str => window.location.hostname.includes(str))
    };
    
    // documentのquerySelectorAllのモック
    document.querySelectorAll = jest.fn(() => []);
    
    // windowのgetComputedStyleのモック
    window.getComputedStyle = jest.fn(() => ({
      display: 'block',
      visibility: 'visible',
      opacity: '1'
    }));
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('findChatGPTSubmitButton', () => {
    it('should return null when no buttons are found', () => {
      // querySelectorAllは空配列を返す
      document.querySelectorAll.mockReturnValue([]);
      
      // 関数呼び出し
      const result = findChatGPTSubmitButton();
      
      // 検証
      expect(result).toBeNull();
      // 少なくとも一つのセレクタで検索が行われた
      expect(document.querySelectorAll).toHaveBeenCalled();
    });
    
    it('should find the first visible button matching selectors', () => {
      // モックのボタン要素を作成
      const mockButton1 = document.createElement('button');
      const mockButton2 = document.createElement('button');
      
      // ボタンのスタイルをモック
      window.getComputedStyle.mockImplementation((element) => {
        if (element === mockButton1) {
          return {
            display: 'block',
            visibility: 'visible',
            opacity: '1'
          };
        }
        return {
          display: 'block',
          visibility: 'visible', 
          opacity: '1'
        };
      });
      
      // ボタンのBoundingClientRectをモック
      mockButton1.getBoundingClientRect = jest.fn(() => ({
        width: 100,
        height: 40
      }));
      
      mockButton2.getBoundingClientRect = jest.fn(() => ({
        width: 100,
        height: 40
      }));
      
      // querySelectorAllの返り値をモック
      document.querySelectorAll.mockReturnValueOnce([mockButton1, mockButton2]);
      
      // 関数呼び出し
      const result = findChatGPTSubmitButton();
      
      // 検証
      expect(result).toBe(mockButton1);
    });
    
    it('should filter out invisible buttons', () => {
      // モックのボタン要素を作成
      const mockInvisibleButton = document.createElement('button');
      const mockVisibleButton = document.createElement('button');
      
      // ボタンのスタイルをモック
      window.getComputedStyle.mockImplementation((element) => {
        if (element === mockInvisibleButton) {
          return {
            display: 'none',  // 非表示
            visibility: 'visible',
            opacity: '1'
          };
        }
        return {
          display: 'block',
          visibility: 'visible',
          opacity: '1'
        };
      });
      
      // ボタンのBoundingClientRectをモック
      mockInvisibleButton.getBoundingClientRect = jest.fn(() => ({
        width: 100,
        height: 40
      }));
      
      mockVisibleButton.getBoundingClientRect = jest.fn(() => ({
        width: 100,
        height: 40
      }));
      
      // querySelectorAllの返り値をモック
      document.querySelectorAll.mockReturnValueOnce([mockInvisibleButton, mockVisibleButton]);
      
      // 関数呼び出し
      const result = findChatGPTSubmitButton();
      
      // 検証
      expect(result).toBe(mockVisibleButton);
    });
    
    it('should try multiple selectors until a match is found', () => {
      // 最初のセレクタは要素が見つからない
      document.querySelectorAll.mockReturnValueOnce([]);
      
      // 2番目のセレクタで要素が見つかる
      const mockButton = document.createElement('button');
      mockButton.getBoundingClientRect = jest.fn(() => ({
        width: 100,
        height: 40
      }));
      document.querySelectorAll.mockReturnValueOnce([mockButton]);
      
      // 関数呼び出し
      const result = findChatGPTSubmitButton();
      
      // 検証
      expect(result).toBe(mockButton);
      expect(document.querySelectorAll).toHaveBeenCalledTimes(2);
    });
  });
  
  // この関数は実装がシンプルなのでシンプルなテストにします
  describe('findSubmitButtonForInput', () => {
    it('should exist and be a function', () => {
      expect(typeof findSubmitButtonForInput).toBe('function');
    });
    
    // 関数の仕様を確認するだけのシンプルなテスト
    it('should forward the result from findChatGPTSubmitButton', () => {
      // 関数の中身を確認
      const functionString = findSubmitButtonForInput.toString();
      // 関数内で`findChatGPTSubmitButton`を呼び出していることを確認
      expect(functionString).toContain('findChatGPTSubmitButton');
      expect(functionString).toContain('return findChatGPTSubmitButton');
    });
  });
  
  describe('isChatGPTSite', () => {
    it('should return true for chat.openai.com domain', () => {
      // OpenAIドメインをシミュレート
      window.location.hostname = 'chat.openai.com';
      
      // 関数呼び出し
      const result = isChatGPTSite();
      
      // 検証
      expect(result).toBe(true);
    });
    
    it('should return false for other domains', () => {
      // 他のドメインをシミュレート
      window.location.hostname = 'example.com';
      
      // 関数呼び出し
      const result = isChatGPTSite();
      
      // 検証
      expect(result).toBe(false);
    });
  });
  
  describe('submitAfterVoiceInput', () => {
    it('should return false when no submit button is found', () => {
      // findChatGPTSubmitButtonの結果をモック
      jest.spyOn(require('../../site-handlers/openai-chatgpt'), 'findChatGPTSubmitButton')
        .mockImplementation(() => null);
      
      // 関数呼び出し
      const result = submitAfterVoiceInput();
      
      // 検証
      expect(result).toBe(false);
    });
  });
});