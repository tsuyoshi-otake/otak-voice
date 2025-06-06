# テスト改善計画

## 現状分析

現在のテスト状況:

| モジュール | ステートメントカバレッジ | ブランチカバレッジ | 関数カバレッジ | ラインカバレッジ |
|------------|--------------------------|--------------------|--------------| ---------------|
| constants.js | 100% | 100% | 100% | 100% |
| icons.js | 100% | 100% | 100% | 100% |
| site-detector.js | 100% | 88.88% | 100% | 100% |
| default.js | 62.22% | 62.5% | 66.66% | 61.36% |
| openai-chatgpt.js | 51.61% | 39.13% | 57.14% | 51.61% |
| settings.js | 53.2% | 36.48% | 65.62% | 52.9% |

## 解決した課題

1. **JSDOMの制限への対応**
   - `document.activeElement`のようなJSDOMで直接モック化できないプロパティへの対処法を確立
   - モックオブジェクトの直接定義によるテスト方法の確立

2. **モジュール間の依存関係処理**
   - `jest.spyOn`と`jest.mock`を使い分けることでモジュール間の依存関係を適切に処理
   - 関数の仕様確認によるテスト（実装ではなくインターフェースのテスト）

3. **テスト用ユーティリティの最適化**
   - テスト前後の適切なモックのセットアップとクリーンアップ
   - `beforeEach`と`afterEach`を使った効率的なテスト環境の準備

## 今後の改善計画

### 短期目標（1週間以内）

1. **既存サイトハンドラーのカバレッジ向上**
   - `openai-chatgpt.js`: `submitAfterVoiceInput`関数のタイマー処理テスト改善
   - `default.js`: 残りの未カバー部分（89-120行）のテスト追加

2. **他のサイトハンドラーのテスト実装**
   - `anthropic-claude.js`のテスト実装
   - `google-gemini.js`のテスト実装
   - `systemexe.js`のテスト実装
   - `twitter.js`のテスト実装
   
3. **テストヘルパーの整備**
   - 現在エラーとなっている`dom-helpers.js`を実用的なテストヘルパーに変更
   - サイトハンドラーのテスト用共通モック関数の作成

### 中期目標（1ヶ月以内）

1. **コアモジュールのテスト実装**
   - `dom-utils.js`のテスト（最重要）
   - `event-bus.js`のテスト
   - `input-handler.js`のテスト
   - `ui.js`のテスト

2. **Jestカスタム設定の最適化**
   - テスト環境のグローバルセットアップの改善
   - カスタムマッチャーの追加（DOM要素比較など）

3. **テスト実行の効率化**
   - 並列テスト実行の設定
   - テストレポート形式の改善

### 長期目標（3ヶ月以内）

1. **全体カバレッジ目標の設定と達成**
   - ステートメントカバレッジ: 80%以上
   - ブランチカバレッジ: 70%以上 
   - 関数カバレッジ: 90%以上
   - 特に重要なモジュールは90%以上のカバレッジを目指す

2. **継続的インテグレーション（CI）との連携**
   - GitHub Actionsでのテスト自動実行
   - カバレッジレポートの自動生成と閾値チェック

## テスト実装上の注意点

1. **DOM操作のモック化テクニック**
   - `document.querySelector`や`getComputedStyle`などのモック化は一貫したアプローチで行う
   - DOMイベントのシミュレーションには専用のユーティリティ関数を用意する

2. **非同期処理のテスト**
   - `setTimeout`や`Promise`を使った非同期コードのテストには`jest.useFakeTimers()`と`jest.runAllTimers()`を活用
   - 適切なエラーハンドリングのテストも含める

3. **サイトハンドラー固有の注意点**
   - サイト固有の検出ロジックは個別にテストする
   - 共通インターフェース（`findBestInputField`、`findSubmitButtonForInput`、`submitAfterVoiceInput`）の一貫性を確認する

## 成功指標

1. 全モジュールの平均テストカバレッジ70%以上
2. 重要なコアモジュール（state.js, dom-utils.js, site-detector.js）のカバレッジ90%以上
3. すべてのサイトハンドラーのテスト実装完了
4. CI環境での自動テスト実行とカバレッジレポート生成