# otak-voice v3.1 リリースノート

## 主な変更点

- **クラウド同期機能の追加**: 設定が複数デバイス間で同期されるようになりました
- **テーマ機能の強化**: ダークモードとライトモードの切り替えが可能になりました
- **音声認識結果表示モーダルの追加**: 入力フィールドが見つからない場合でも音声認識を使用可能に
- **x.com (Twitter) サポートの改善**: 複雑なエディタ環境でも使用可能に
- **バグ修正**: 「内容を校閲」ボタンのエラーを修正
- **パフォーマンス改善**: DOM操作の最適化によりレスポンス性能が向上

## 技術的な改善

- `chrome.storage.sync` への移行によるクロスデバイス設定同期
- モジュール構造の最適化によるコード保守性の向上
- エラーハンドリングの強化
- テスト範囲の拡大

このリリースは、ユーザーエクスペリエンスの向上と安定性の改善に焦点を当てています。

---

## v3.1 リリース以降の開発品質改善（未リリース）

ユーザー向け機能の変更はありませんが、コードベースに以下の大規模改善を実施しました。

### バグ修正（16件）

- state モジュールへの移行：`window` グローバル変数をすべて `state.js` の `getState`/`setState` に置き換え
- 音声認識フォーカス条件の修正（条件が反転していた）
- ChatGPT / Claude サイト検出ロジックの修正
- GPT / 音声モジュールの処理状態リークを修正
- 設定バリデーション・エラーコードの欠落を補完
- 重複していた `toggleSettingsModal` / `updateEditProofreadButtonsState` を削除

### モジュール分割リファクタリング

すべてのソースファイルを 298 行以下に分割し、バレルファイルで後方互換性を維持：

| 旧ファイル | 分割後 |
|---|---|
| `dom-utils.js` | dom-visibility, dom-input-detection, dom-button-detection, dom-input-manipulation |
| `gpt-service.js` | gpt-api-client, gpt-correction, gpt-proofreading, gpt-editing |
| `settings.js` | settings-schema, settings-storage, settings-theme |
| `error-handler.js` | error-types + error-handler |
| `ui.js` | ui-status, ui-core, ui-settings-modal, ui-recognition-modal, ui-events, ui-tooltips |
| `speech.js` | speech-utils, speech-recognition, speech-edit |
| `input-handler.js` | input-storage, input-menu, input-operations, input-handler-init |

### コード重複排除リファクタリング

- `isInputElement` を `dom-input-detection.js` に統一（旧 `utils.js` の簡易版を削除）
- `publishStatus()` を `event-bus.js` に追加し、4箇所に散在したプライベート `showStatus` プロキシを統合
- `constants.js` に `UI_FEEDBACK`・`GPT_PARAMS`・`PAPER_PLANE_SVG` 定数グループを追加してマジック値を排除
- `clickButtonWithFeedback(button, delayMs?)` に遅延パラメータを追加し、サイトハンドラーの送信ロジック重複を解消
- `gpt-api-client.js` からエラーユーティリティの再エクスポートを削除（直接 `error-handler.js` からインポート）

### テスト・品質管理

- Jest テストスイート：46 スイート・650 テスト（630 passed, 20 skipped）
- ESLint 導入（Flat Config 形式）：エラー 0 件
- 分散 CLAUDE.md による Agentic Coding コンテキスト整備
