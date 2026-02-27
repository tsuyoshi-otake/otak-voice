/**
 * @jest.environment jsdom
 */

import { correctWithGPT, proofreadWithGPT, editWithGPT } from '../../modules/gpt-service.js';
import { getState } from '../../modules/state.js';
import { updateProcessingState } from '../../modules/ui.js';
import { simulateTypingIntoElement } from '../../modules/input-handler.js';
import { publish } from '../../modules/event-bus.js';
import { createError, handleError, mapHttpStatusToErrorCode, ERROR_CODE, ERROR_CATEGORY, ERROR_SEVERITY } from '../../modules/error-handler.js';
import { PROCESSING_STATE } from '../../constants.js';

// Mock dependencies
jest.mock('../../modules/state.js');
jest.mock('../../modules/ui.js');
jest.mock('../../modules/input-handler.js');
jest.mock('../../modules/event-bus.js');
jest.mock('../../modules/error-handler.js');
jest.mock('../../modules/history.js', () => ({
  voiceHistory: [
    { text: 'Previous text 1' },
    { text: 'Previous text 2' }
  ]
}));

// Mock chrome.i18n
global.chrome = {
  i18n: {
    getMessage: jest.fn().mockImplementation((key) => {
      // 特定のキーに対して具体的な値を返す
      if (key === 'statusApiKeyMissing') return 'API key is missing';
      return key;
    })
  }
};

describe('GPT Service Module', () => {
  let originalFetch;
  
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
    
    // Enable fake timers
    jest.useFakeTimers();
    
    // Mock getState to return default values
    getState.mockImplementation((key) => {
      if (key === 'apiKey') return 'test-api-key';
      if (key === 'useHistoryContext') return true;
      if (key === 'autoCorrectionPrompt') return '';
      if (key === 'proofreadingPrompt') return '';
      return null;
    });
    
    // Save original fetch
    originalFetch = global.fetch;
    
    // Mock successful fetch response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [
          {
            message: {
              content: 'Corrected text'
            }
          }
        ]
      })
    });

    // Mock error handler functions
    createError.mockImplementation(() => new Error('Mock error'));
    handleError.mockImplementation(() => {});
    mapHttpStatusToErrorCode.mockImplementation(() => 'MOCK_ERROR_CODE');
  });
  
  afterEach(() => {
    // Restore fetch
    global.fetch = originalFetch;
    
    // Restore real timers
    jest.useRealTimers();
  });
  
  describe('correctWithGPT', () => {
    test('returns original text when API key is missing', async () => {
      getState.mockImplementation((key) => key === 'apiKey' ? '' : null);
      
      const result = await correctWithGPT('Test text');
      
      expect(result).toBe('Test text');
      expect(handleError).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });
    
    test('returns original text when input is empty', async () => {
      const result = await correctWithGPT('');
      
      expect(result).toBe('');
      expect(fetch).not.toHaveBeenCalled();
    });
    
    test('makes API request and returns corrected text', async () => {
      const result = await correctWithGPT('Test text');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
      
      expect(result).toBe('Corrected text');
      expect(publish).toHaveBeenCalledWith(
        expect.any(String), 
        expect.objectContaining({
          messageKey: 'statusCorrectionSuccess'
        })
      );
    });
    
    test('handles API error responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({
          error: { message: 'Invalid API key' }
        })
      });
      
      const result = await correctWithGPT('Test text');
      
      expect(result).toBe('Test text');
      expect(handleError).toHaveBeenCalled();
      expect(publish).toHaveBeenCalledWith('settings:modal:toggled');
    });
    
    test('handles network errors', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await correctWithGPT('Test text');
      
      expect(result).toBe('Test text');
      expect(handleError).toHaveBeenCalled();
      expect(updateProcessingState).toHaveBeenCalledWith(PROCESSING_STATE.IDLE);
    });
  });
  
  describe('proofreadWithGPT', () => {
    test('プロセスがAPIキーが欠けている場合に動作する', async () => {
      // 現在のモックをクリア
      getState.mockClear();
      
      // APIキーがないケースをシミュレート
      getState.mockReturnValue('');
      
      // 例外が投げられることだけを確認
      await expect(async () => {
        await proofreadWithGPT('Test text');
      }).rejects.toBeDefined();
      
      // fetchが呼ばれないことを確認
      expect(fetch).not.toHaveBeenCalled();
    });
    
    test('makes API request and returns proofread text', async () => {
      const result = await proofreadWithGPT('Test text');
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
      
      expect(result).toBe('Corrected text');
    });
    
    test('handles API error responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          error: { message: 'Invalid request' }
        })
      });
      
      await expect(proofreadWithGPT('Test text')).rejects.toThrow();
      expect(createError).toHaveBeenCalled();
    });
  });
  
  describe('editWithGPT', () => {
    test('makes API request and handles response', async () => {
      const activeElement = {
        isContentEditable: false,
        isConnected: true,
        value: 'Original text',
        dispatchEvent: jest.fn()
      };
      
      // setTimeoutの代わりに直接コールバックを実行するようにモック
      jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
        cb(); // コールバックを即時実行
        return 999; // タイマーIDとして任意の数値を返す
      });
      
      await editWithGPT('Original text', 'Make it better', activeElement);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          }),
          body: expect.stringContaining('Original text')
        })
      );
      
      // simulateTypingIntoElementが呼び出されたことを確認
      expect(simulateTypingIntoElement).toHaveBeenCalled();
      
      // ステータス更新のイベントが発行されたことを確認
      expect(publish).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messageKey: 'statusEditingComplete'
        })
      );
    });
    
    test('contentEditableプロパティの値に応じて処理が分岐する', async () => {
      // モックのcontent editableエレメントを作成
      const activeElement = {
        isContentEditable: true,
        isConnected: true,
        textContent: 'Original text',
        dispatchEvent: jest.fn()
      };
      
      // setTimeoutのモックを作成して即時実行するよう設定
      jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
        // モジュール内の処理をシミュレート - setTimeoutのコールバック内で行われる処理
        activeElement.textContent = 'Corrected text';
        
        // コールバックを実行
        cb();
        return 1;
      });
      
      // 関数を実行
      await editWithGPT('Original text', 'Make it better', activeElement);
      
      // dispatchEventが呼ばれたことを確認
      expect(activeElement.dispatchEvent).toHaveBeenCalled();
    });
    
    test('handles API error responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          error: { message: 'Invalid request' }
        })
      });
      
      const activeElement = { isContentEditable: false };
      
      await editWithGPT('Test text', 'Edit instruction', activeElement);
      
      expect(handleError).toHaveBeenCalled();
      // Should not attempt to update the element
      expect(simulateTypingIntoElement).not.toHaveBeenCalled();
    });
  });
});