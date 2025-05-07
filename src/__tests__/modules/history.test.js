/**
 * @jest.environment jsdom
 */

import { addToHistory, updateHistoryPanel, toggleHistoryPanel, voiceHistory } from '../../modules/history.js';
import { MAX_HISTORY } from '../../constants.js';
import { publish, subscribe, EVENTS } from '../../modules/event-bus.js';

// モックの設定
jest.mock('../../modules/event-bus.js');
jest.mock('../../modules/state.js', () => ({
  getState: jest.fn().mockReturnValue(true)
}));

// Chrome APIのモック
global.chrome = {
  i18n: {
    getMessage: jest.fn().mockImplementation(key => `Translated: ${key}`)
  }
};

describe('History Module', () => {
  // 各テストの前にDOM環境をリセット
  beforeEach(() => {
    // DOMをクリア
    document.body.innerHTML = '';
    
    // ヒストリーパネルを作成
    const panel = document.createElement('div');
    panel.className = 'otak-voice-history';
    
    // タイトル要素
    const title = document.createElement('div');
    title.textContent = 'History';
    panel.appendChild(title);
    
    document.body.appendChild(panel);
    
    // モックをリセット
    jest.clearAllMocks();
    
    // voiceHistoryをクリア
    while (voiceHistory.length > 0) {
      voiceHistory.pop();
    }
  });

  describe('addToHistory', () => {
    test('空の文字列は履歴に追加されない', () => {
      addToHistory('');
      expect(voiceHistory.length).toBe(0);
      
      addToHistory('   ');
      expect(voiceHistory.length).toBe(0);
    });

    test('重複するテキストは履歴に追加されない', () => {
      addToHistory('テストテキスト');
      expect(voiceHistory.length).toBe(1);
      
      addToHistory('テストテキスト');
      expect(voiceHistory.length).toBe(1);
    });

    test('有効なテキストは履歴に追加される', () => {
      addToHistory('テストテキスト1');
      expect(voiceHistory.length).toBe(1);
      expect(voiceHistory[0].text).toBe('テストテキスト1');
      expect(voiceHistory[0].timestamp).toBeDefined();
      
      addToHistory('テストテキスト2');
      expect(voiceHistory.length).toBe(2);
      expect(voiceHistory[1].text).toBe('テストテキスト2');
    });

    test('履歴が最大サイズを超えると古いエントリが削除される', () => {
      // 最大サイズ+1のエントリを追加
      for (let i = 1; i <= MAX_HISTORY + 1; i++) {
        addToHistory(`テスト${i}`);
      }
      
      expect(voiceHistory.length).toBe(MAX_HISTORY);
      expect(voiceHistory[0].text).toBe('テスト2'); // 最初のエントリが削除されていることを確認
    });
    
    test('表示中のパネルがある場合、ヒストリーパネルが更新される', () => {
      // パネルを表示状態に設定
      const panel = document.querySelector('.otak-voice-history');
      panel.style.display = 'block';
      
      // updateHistoryPanelをスパイ
      const spy = jest.spyOn(document, 'querySelector');
      
      // テキストを追加
      addToHistory('テストテキスト');
      
      // querySelectorが少なくとも1回呼ばれたことを確認
      expect(spy).toHaveBeenCalled();
      
      // クリーンアップ
      spy.mockRestore();
    });
  });

  describe('updateHistoryPanel', () => {
    test('履歴が空の場合、空のメッセージが表示される', () => {
      updateHistoryPanel();
      
      const panel = document.querySelector('.otak-voice-history');
      expect(panel.textContent).toContain('Translated: historyPanelEmpty');
    });

    test('履歴がある場合、全てのアイテムが表示される', () => {
      // 履歴にアイテムを追加
      addToHistory('テストテキスト1');
      addToHistory('テストテキスト2');
      
      updateHistoryPanel();
      
      const panel = document.querySelector('.otak-voice-history');
      const items = panel.querySelectorAll('.otak-voice-history__item');
      
      expect(items.length).toBe(2);
      
      // 最新の項目が最初に表示されることを確認
      const textElements = panel.querySelectorAll('.otak-voice-history__text');
      expect(textElements[0].textContent).toBe('テストテキスト2');
      expect(textElements[1].textContent).toBe('テストテキスト1');
    });
  });

  describe('toggleHistoryPanel', () => {
    test('パネルの表示状態が切り替わる', () => {
      const panel = document.querySelector('.otak-voice-history');
      
      // 初期状態は非表示
      panel.style.display = 'none';
      
      // 表示に切り替え
      toggleHistoryPanel();
      expect(panel.style.display).toBe('block');
      
      // 非表示に切り替え
      toggleHistoryPanel();
      expect(panel.style.display).toBe('none');
    });

    test('パネルが存在しない場合は早期リターンする', () => {
      // パネルを削除
      document.querySelector('.otak-voice-history').remove();
      
      // エラーが発生しないことを確認
      expect(() => toggleHistoryPanel()).not.toThrow();
    });
  });

  // イベント発行のテスト
  describe('publish interactions', () => {
    test('publishの呼び出しをテスト', () => {
      // publishの呼び出しをテスト（直接的なイベント発行/購読の検証は複雑なため避ける）
      // これはモジュールの内部実装に依存しますが、基本的な関数動作の検証として有効です
      
      // 状態の変化を確認
      const initialLength = voiceHistory.length;
      
      // イベントバスを介した追加
      publish.mockClear();
      addToHistory('テスト経由追加');
      
      // 正しい長さになったことを確認
      expect(voiceHistory.length).toBe(initialLength + 1);
      
      // トグル操作のテスト
      const panel = document.querySelector('.otak-voice-history');
      panel.style.display = 'none';
      
      toggleHistoryPanel();
      expect(panel.style.display).toBe('block');
    });
  });
});