/**
 * Default Site Handler Tests
 */

// JSDOMの環境設定問題を回避するシンプルなテスト構造

// モジュールのモック
jest.mock('../../modules/ui.js');
jest.mock('../../modules/event-bus.js');
jest.mock('../../modules/dom-utils.js');

// インポート
import { findSubmitButtonForInput, findBestInputField } from '../../site-handlers/default';
import * as domUtils from '../../modules/dom-utils';
import { publish, EVENTS } from '../../modules/event-bus';

describe('Default Site Handler', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // chrome API のモック
    global.chrome = {
      i18n: {
        getMessage: jest.fn(key => key)
      }
    };
    
    // console のモック
    console.log = jest.fn();
  });
  
  describe('findSubmitButtonForInput', () => {
    it('should return null if inputElement is null', () => {
      // null入力のテスト
      const result = findSubmitButtonForInput(null);
      expect(result).toBeNull();
    });
    
    it('should call findBestSubmitButton and return its result', () => {
      // モックボタンの準備
      const mockButton = document.createElement('button');
      domUtils.findBestSubmitButton.mockReturnValue(mockButton);
      
      // 関数呼び出し
      const mockInput = document.createElement('input');
      const result = findSubmitButtonForInput(mockInput);
      
      // 検証
      expect(domUtils.findBestSubmitButton).toHaveBeenCalledWith(mockInput);
      expect(result).toBe(mockButton);
    });
    
    it('should log when button is found', () => {
      // モックボタンの準備
      const mockButton = document.createElement('button');
      domUtils.findBestSubmitButton.mockReturnValue(mockButton);
      
      // 関数呼び出し
      findSubmitButtonForInput(document.createElement('input'));
      
      // ログを確認
      expect(console.log).toHaveBeenCalled();
      expect(chrome.i18n.getMessage).toHaveBeenCalledWith('logSubmitButtonFound');
    });
    
    it('should log when button is not found', () => {
      // ボタンが見つからない場合
      domUtils.findBestSubmitButton.mockReturnValue(null);
      
      // 関数呼び出し
      findSubmitButtonForInput(document.createElement('input'));
      
      // ログを確認
      expect(console.log).toHaveBeenCalled();
      expect(chrome.i18n.getMessage).toHaveBeenCalledWith('logSubmitButtonNotFound');
    });
  });
  
  describe('findBestInputField', () => {
    it('should prioritize specific tailwind textareas', () => {
      // 特定のテキストエリアが見つかる場合
      const mockTextarea = document.createElement('textarea');
      domUtils.findElement.mockReturnValue(mockTextarea);
      domUtils.isInputElement.mockReturnValue(true);
      
      // 関数呼び出し
      const result = findBestInputField();
      
      // 期待値の検証
      expect(result).toBe(mockTextarea);
      expect(domUtils.findElement).toHaveBeenCalledWith(
        'textarea.textarea.w-full.resize-none.pl-2.pr-2[placeholder="メッセージを入力..."]'
      );
      expect(console.log).toHaveBeenCalled();
    });
    
    it('should try alternative tailwind textareas if first option fails', () => {
      // 最初のパターンは失敗
      domUtils.findElement.mockReturnValueOnce(null);
      
      // 2番目のパターンは成功
      const mockTextarea = document.createElement('textarea');
      domUtils.findElement.mockReturnValueOnce(mockTextarea);
      domUtils.isInputElement.mockReturnValue(true);
      
      // 関数呼び出し
      const result = findBestInputField();
      
      // 期待値の検証
      expect(result).toBe(mockTextarea);
      expect(domUtils.findElement).toHaveBeenCalledWith(
        'textarea.textarea.w-full.resize-none[placeholder="メッセージを入力..."]'
      );
    });
    
    it('should try generic tailwind textareas if specific patterns fail', () => {
      // 最初の2パターンは失敗
      domUtils.findElement.mockReturnValueOnce(null);
      domUtils.findElement.mockReturnValueOnce(null);
      
      // 3番目のパターンは成功
      const mockTextarea = document.createElement('textarea');
      domUtils.findElement.mockReturnValueOnce(mockTextarea);
      domUtils.isInputElement.mockReturnValue(true);
      
      // 関数呼び出し
      const result = findBestInputField();
      
      // 期待値の検証
      expect(result).toBe(mockTextarea);
      expect(domUtils.findElement).toHaveBeenCalledWith(
        'textarea.textarea.w-full.resize-none'
      );
    });
    
    it('should try placeholder textareas if tailwind patterns fail', () => {
      // すべてのfindElement呼び出しは失敗
      domUtils.findElement.mockReturnValue(null);
      
      // プレースホルダーテキストを持つtextareaを返す
      const mockTextarea = document.createElement('textarea');
      domUtils.findAllElements.mockReturnValue([mockTextarea]);
      domUtils.isInputElement.mockReturnValue(true);
      
      // 関数呼び出し
      const result = findBestInputField();
      
      // 期待値の検証
      expect(result).toBe(mockTextarea);
      expect(domUtils.findAllElements).toHaveBeenCalledWith(
        'textarea[placeholder*="メッセージ"], textarea[placeholder*="message"]'
      );
    });
    
    it('should fallback to domFindBestInputField when all specific searches fail', () => {
      // すべての特定パターンが失敗
      domUtils.findElement.mockReturnValue(null);
      domUtils.findAllElements.mockReturnValue([]);
      
      // 一般的な検索は成功
      const mockInput = document.createElement('input');
      domUtils.findBestInputField.mockReturnValue(mockInput);
      
      // 関数呼び出し
      const result = findBestInputField();
      
      // 期待値の検証
      expect(result).toBe(mockInput);
      expect(domUtils.findBestInputField).toHaveBeenCalled();
    });
    
    it('should return null when all searches fail', () => {
      // すべての検索が失敗
      domUtils.findElement.mockReturnValue(null);
      domUtils.findAllElements.mockReturnValue([]);
      domUtils.findBestInputField.mockReturnValue(null);
      
      // 関数呼び出し
      const result = findBestInputField();
      
      // 期待値の検証
      expect(result).toBeNull();
    });
  });
});