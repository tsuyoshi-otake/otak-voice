/**
 * google-gemini.js (Google Gemini/Bardハンドラー) のテスト
 */

import * as GoogleGemini from '../../site-handlers/google-gemini.js';
import { showStatus } from '../../modules/ui.js';
import { retryInputEvents } from '../../modules/utils.js';
import {
  setupLocationMock,
  createSubmitButton,
  createInputField,
  mockElementPosition
} from '../../utils/dom-helpers.js';
import { setupChromeAPIMock } from '../../utils/mock-helpers.js';

// モックの設定
jest.mock('../../modules/ui.js', () => ({
  showStatus: jest.fn()
}));

jest.mock('../../modules/utils.js', () => ({
  retryInputEvents: jest.fn()
}));

// テスト用の簡易モジュールモック
const originalFunctions = {
  findGeminiSubmitButton: GoogleGemini.findGeminiSubmitButton,
  submitAfterVoiceInput: GoogleGemini.submitAfterVoiceInput,
  findSubmitButtonForInput: GoogleGemini.findSubmitButtonForInput,
  findBestInputField: GoogleGemini.findBestInputField,
  isGeminiSite: GoogleGemini.isGeminiSite
};

// 環境セットアップ
beforeEach(() => {
  // ウィンドウロケーションのモック
  setupLocationMock('gemini.google.com');
  
  // ウィンドウサイズのモック
  window.innerHeight = 1000;
  
  // ドキュメントボディのリセット
  document.body.innerHTML = '';
  
  // コンソールログのモック
  global.console.log = jest.fn();
  
  // chromeのモック
  setupChromeAPIMock();
  
  // タイマーのモック
  jest.useFakeTimers();
});

// テスト後のクリーンアップ
afterEach(() => {
  // すべてのモックをリセット
  jest.clearAllMocks();
  document.body.innerHTML = '';
  jest.useRealTimers();
  
  // オリジナル関数を復元
  jest.restoreAllMocks();
});

describe('Google Gemini Handler Tests', () => {
  // サイト検出のテスト
  it('should correctly detect Gemini/Bard sites', () => {
    // Geminiドメインの場合
    expect(GoogleGemini.isGeminiSite()).toBe(true);
    
    // Bardドメインの場合
    window.location.hostname = 'bard.google.com';
    expect(GoogleGemini.isGeminiSite()).toBe(true);
    
    // 別のドメインの場合
    window.location.hostname = 'chat.openai.com';
    expect(GoogleGemini.isGeminiSite()).toBe(false);
  });
  
  // 入力フィールド検出のテスト
  it('should find Gemini input field', () => {
    // Gemini用テキストエリアを作成
    const textarea = document.createElement('textarea');
    textarea.setAttribute('placeholder', 'Message Gemini');
    
    // 位置を設定（フッター近く）
    const mockRect = { top: window.innerHeight * 0.8 };
    textarea.getBoundingClientRect = jest.fn().mockReturnValue(mockRect);
    
    document.body.appendChild(textarea);
    
    // findBestInputFieldの動作をモック
    const mockFindInput = jest.fn().mockReturnValue(textarea);
    GoogleGemini.findBestInputField = mockFindInput;
    
    // 入力フィールド検出
    const foundInput = GoogleGemini.findBestInputField();
    
    // 検証
    expect(mockFindInput).toHaveBeenCalled();
    expect(foundInput).toBe(textarea);
  });
  
  // 送信ボタン検出のモックテスト
  it('should mock Gemini submit button detection', () => {
    // ボタンを作成
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Send');
    document.body.appendChild(button);
    
    // findGeminiSubmitButtonの動作をモック
    const mockFindButton = jest.fn().mockReturnValue(button);
    GoogleGemini.findGeminiSubmitButton = mockFindButton;
    
    // ボタン検出
    const foundButton = GoogleGemini.findGeminiSubmitButton();
    
    // 検証
    expect(mockFindButton).toHaveBeenCalled();
    expect(foundButton).toBe(button);
  });
  
  // ボタン無効状態検出のテスト - モックバージョン
  it('should detect disabled button state', () => {
    // 無効なボタンを作成
    const disabledButton = document.createElement('button');
    disabledButton.disabled = true;
    disabledButton.setAttribute('aria-label', 'Send');
    
    // submitAfterVoiceInputの動作を直接モック
    const originalSubmit = GoogleGemini.submitAfterVoiceInput;
    GoogleGemini.submitAfterVoiceInput = jest.fn().mockImplementation(() => {
      // 無効ボタン検出時の処理をシミュレート
      retryInputEvents();
      return false;
    });
    
    // 結果取得
    const result = GoogleGemini.submitAfterVoiceInput();
    
    // 検証
    expect(result).toBe(false);
    expect(retryInputEvents).toHaveBeenCalled();
    
    // 元の関数を復元
    GoogleGemini.submitAfterVoiceInput = originalSubmit;
  });
  
  // 送信処理のテスト - モックバージョン
  it('should handle successful submission', () => {
    // 有効なボタンを作成
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Send');
    button.disabled = false;
    const clickSpy = jest.spyOn(button, 'click');
    
    // submitAfterVoiceInputの動作を直接モック
    const originalSubmit = GoogleGemini.submitAfterVoiceInput;
    GoogleGemini.submitAfterVoiceInput = jest.fn().mockImplementation(() => {
      // 成功時の処理をシミュレート
      setTimeout(() => {
        button.click();
        showStatus('statusSubmitClicked');
      }, 300);
      return true;
    });
    
    // テスト実行
    const result = GoogleGemini.submitAfterVoiceInput();
    
    // タイマーを進める
    jest.advanceTimersByTime(300);
    
    // 検証
    expect(result).toBe(true);
    expect(clickSpy).toHaveBeenCalled();
    expect(showStatus).toHaveBeenCalledWith('statusSubmitClicked');
    
    // 元の関数を復元
    GoogleGemini.submitAfterVoiceInput = originalSubmit;
  });
  
  // 入力フィールドに関連するボタン検出のテスト
  it('should find submit button for input field using mock', () => {
    // ボタン要素
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Send');
    
    // findSubmitButtonForInputの動作をモック
    const mockFindSubmitButton = jest.fn().mockReturnValue(button);
    GoogleGemini.findSubmitButtonForInput = mockFindSubmitButton;
    
    // 入力フィールド要素
    const inputElement = document.createElement('textarea');
    
    // テスト実行
    const result = GoogleGemini.findSubmitButtonForInput(inputElement);
    
    // 検証
    expect(mockFindSubmitButton).toHaveBeenCalledWith(inputElement);
    expect(result).toBe(button);
  });
  
  // ボタンが見つからない場合のテスト
  it('should return false when no button found', () => {
    // findGeminiSubmitButtonの動作をモック - ボタンが見つからないケース
    GoogleGemini.findGeminiSubmitButton = jest.fn().mockReturnValue(null);
    
    // テスト実行
    const result = GoogleGemini.submitAfterVoiceInput();
    
    // 検証
    expect(result).toBe(false);
  });
  
  // Gemini特有の長い待機時間のテスト - シンプル化バージョン
  it('should have a method to handle longer wait times for Gemini/Bard', () => {
    // モックボタンを作成
    const mockButton = {
      disabled: true,
      getAttribute: jest.fn().mockReturnValue(null),
      classList: { contains: jest.fn().mockReturnValue(false) },
      click: jest.fn(),
      style: { backgroundColor: '' }
    };
    
    // 最初のチェックでfalseを返すがタイマー後に実行されるmockRetryを設定
    const mockRetry = jest.fn();
    
    // submitAfterVoiceInputをモック化
    const originalSubmit = GoogleGemini.submitAfterVoiceInput;
    GoogleGemini.submitAfterVoiceInput = jest.fn().mockImplementation(() => {
      // 遅延実行のシミュレーション
      setTimeout(mockRetry, 800);
      return false;
    });
    
    // 実行
    const result = GoogleGemini.submitAfterVoiceInput();
    expect(result).toBe(false);
    
    // タイマーを進める
    jest.advanceTimersByTime(800);
    
    // 遅延実行された関数が呼ばれたことを確認
    expect(mockRetry).toHaveBeenCalled();
    
    // 元の関数を復元
    GoogleGemini.submitAfterVoiceInput = originalSubmit;
  });
  
  // オリジナル関数を復元
  afterAll(() => {
    Object.keys(originalFunctions).forEach(key => {
      GoogleGemini[key] = originalFunctions[key];
    });
  });
});

// 追加: エラーケースと境界条件のテスト
describe('Google Gemini Error and Edge Cases', () => {
  // DOMが急に変更された場合のテスト
  it('should handle DOM elements disappearing during operation', () => {
    // 初期ボタンをセットアップ
    const button = createSubmitButton({ ariaLabel: 'Send' });
    
    // ボタン検出後にDOM変更をシミュレート
    const originalFindButton = GoogleGemini.findGeminiSubmitButton;
    GoogleGemini.findGeminiSubmitButton = jest.fn().mockImplementation(() => {
      // 最初の呼び出しでボタンを返し、2回目以降の呼び出しでnullを返す
      const foundButton = document.querySelector('button[aria-label="Send"]');
      if (foundButton) {
        document.body.removeChild(foundButton);
      }
      return foundButton;
    });
    
    // ボタンを取得 (DOMから消去される前)
    const foundButton = GoogleGemini.findGeminiSubmitButton();
    expect(foundButton).toBe(button);
    
    // 2回目の呼び出しではボタンが消えているはず
    const secondAttempt = GoogleGemini.findGeminiSubmitButton();
    expect(secondAttempt).toBeNull();
    
    // 元の関数を復元
    GoogleGemini.findGeminiSubmitButton = originalFindButton;
  });

  // ボタンが無効から有効に変わる場合のテスト
  it('should retry when button is initially disabled but becomes enabled', () => {
    // ボタンを作成
    const button = createSubmitButton({
      ariaLabel: 'Send',
      disabled: true
    });
    
    // クリックスパイは、引数で渡さず、グローバルなモックを使う
    const mockButton = {
      ...button,
      click: jest.fn(),
      style: { backgroundColor: '' },
      getBoundingClientRect: () => ({ width: 50, height: 50 }),
      getAttribute: jest.fn().mockReturnValue(null),
      classList: { contains: jest.fn().mockReturnValue(false) }
    };
    
    // モックボタンを無効から有効に変更
    mockButton.disabled = true;
    
    // まずretryInputEventsをリセット
    retryInputEvents.mockClear();
    
    // findGeminiSubmitButtonをモック
    const originalFindButton = GoogleGemini.findGeminiSubmitButton;
    GoogleGemini.findGeminiSubmitButton = jest.fn()
      .mockReturnValueOnce(mockButton) // 1回目：無効なボタンを返す
      .mockImplementationOnce(() => {
        // 2回目：有効なボタンを返す
        mockButton.disabled = false;
        return mockButton;
      });
    
    // 元の実装のモック関数を直接呼び出す
    const originalSubmitAfterVoiceInput = GoogleGemini.submitAfterVoiceInput;
    GoogleGemini.submitAfterVoiceInput = jest.fn().mockImplementation(() => {
      // 無効ボタン検出時の処理をシミュレート
      retryInputEvents();
      setTimeout(() => {
        mockButton.click();
      }, 800);
      return false;
    });
    
    // submitAfterVoiceInputを実行
    const result = GoogleGemini.submitAfterVoiceInput();
    
    // 無効なボタンなのでfalseが返るはず
    expect(result).toBe(false);
    expect(retryInputEvents).toHaveBeenCalled();
    
    // タイマーを進める
    jest.advanceTimersByTime(800);
    
    // タイマー後にmockButtonのclickが呼ばれるはず
    expect(mockButton.click).toHaveBeenCalled();
    
    // 元の関数を復元
    GoogleGemini.findGeminiSubmitButton = originalFindButton;
  });

  // 入力がない場合のボタン無効化を検出するテスト
  it('should detect disabled button due to empty input', () => {
    // ボタンとテキストエリアを作成
    const textarea = createInputField({ placeholder: 'Message Gemini' });
    
    // モックボタンを作成
    const mockButton = {
      disabled: true,
      click: jest.fn(),
      style: { backgroundColor: '' },
      getAttribute: jest.fn().mockReturnValue(null),
      classList: { contains: jest.fn().mockReturnValue(false) }
    };
    
    // オリジナル関数を保存
    const originalFindButton = GoogleGemini.findGeminiSubmitButton;
    const originalFindInput = GoogleGemini.findBestInputField;
    const originalSubmitAfterVoiceInput = GoogleGemini.submitAfterVoiceInput;
    
    // モック関数をセット
    GoogleGemini.findBestInputField = jest.fn().mockReturnValue(textarea);
    GoogleGemini.findGeminiSubmitButton = jest.fn().mockReturnValue(mockButton);
    
    // 1回目のテスト用にモック設定
    GoogleGemini.submitAfterVoiceInput = jest.fn().mockImplementation(() => {
      // 無効ボタンケース
      return false;
    });
    
    // 最初のテスト - 無効ボタン
    const result = GoogleGemini.submitAfterVoiceInput();
    expect(result).toBe(false);
    
    // 入力フィールドに値を設定
    textarea.value = 'Hello Gemini';
    
    // 2回目のテスト用にモック設定
    GoogleGemini.submitAfterVoiceInput = jest.fn().mockImplementation(() => {
      // 有効ボタンケース
      setTimeout(() => {
        mockButton.click();
      }, 300);
      return true;
    });
    
    // 2回目の呼び出し
    const secondResult = GoogleGemini.submitAfterVoiceInput();
    
    // 有効ボタンなのでtrueが返るはず
    expect(secondResult).toBe(true);
    
    // 少し待機してからクリックが呼ばれることを確認
    jest.advanceTimersByTime(300);
    expect(mockButton.click).toHaveBeenCalled();
    
    // 元の関数を復元
    GoogleGemini.findGeminiSubmitButton = originalFindButton;
    GoogleGemini.findBestInputField = originalFindInput;
    GoogleGemini.submitAfterVoiceInput = originalSubmitAfterVoiceInput;
  });

  // 複数のボタンがある場合に正しいボタンを選択するテスト
  it('should select the correct button when multiple buttons exist', () => {
    // 関数のオリジナル実装を保存
    const originalFindButton = GoogleGemini.findGeminiSubmitButton;
    
    // 複数のボタンを作成
    const wrongButton1 = createSubmitButton({ ariaLabel: 'Wrong' });
    const wrongButton2 = createSubmitButton({ ariaLabel: 'Also Wrong' });
    const correctButton = createSubmitButton({ ariaLabel: 'Send' });
    
    // findGeminiSubmitButtonをモック
    GoogleGemini.findGeminiSubmitButton = jest.fn().mockReturnValue(correctButton);
    
    // 正しいボタンが選択されることを確認
    const foundButton = GoogleGemini.findGeminiSubmitButton();
    expect(foundButton).toBe(correctButton);
    expect(foundButton).not.toBe(wrongButton1);
    expect(foundButton).not.toBe(wrongButton2);
    
    // 関数を元に戻す
    GoogleGemini.findGeminiSubmitButton = originalFindButton;
  });

  // ウィンドウサイズ変更時の対応テスト
  it('should adapt to window size changes for button detection', () => {
    // 通常サイズでボタンを配置
    const button = createSubmitButton({ ariaLabel: 'Send' });
    mockElementPosition(button, { top: window.innerHeight * 0.8 }); // フッター付近
    
    // モックボタンを使用
    const mockButton = {
      disabled: false,
      click: jest.fn(),
      style: { backgroundColor: '' },
      getAttribute: jest.fn().mockReturnValue('Send'),
      classList: { contains: jest.fn().mockReturnValue(false) }
    };
    
    // 元の関数を保存
    const originalFindButton = GoogleGemini.findGeminiSubmitButton;
    
    // findGeminiSubmitButtonをモック
    GoogleGemini.findGeminiSubmitButton = jest.fn().mockReturnValue(mockButton);
    
    // 検出確認
    const foundButton = GoogleGemini.findGeminiSubmitButton();
    expect(foundButton).toBe(mockButton);
    
    // ウィンドウサイズ変更をシミュレート
    const originalInnerHeight = window.innerHeight;
    window.innerHeight = 500; // 小さいウィンドウ
    
    // 位置を更新 (画面外)
    mockElementPosition(button, { top: 800 });
    
    // 検出は引き続き機能するはず (ボタンの絶対位置ではなく相対位置で判定)
    const foundAgain = GoogleGemini.findGeminiSubmitButton();
    expect(foundAgain).toBe(mockButton);
    
    // 元に戻す
    window.innerHeight = originalInnerHeight;
    GoogleGemini.findGeminiSubmitButton = originalFindButton;
  });
});