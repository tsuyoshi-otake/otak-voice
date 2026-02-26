# otak-voice v3.2 リリースノート

## 主な変更点

### バグ修正
- **自動送信のデフォルト状態修正**: `autoSubmit` の初期値がストレージデフォルトと不一致だった問題を修正
- **クリップボード操作の最新化**: 非推奨の `document.execCommand('copy')` を `navigator.clipboard.writeText()` に置き換え（フォールバック付き）
- **未処理 Promise の修正**: `saveAutoSubmitState()` の戻り値を適切にエラーハンドリング

### コード品質改善
- **GPTモデル最新化**: 校正モデルを `gpt-4.1-mini` に、校閲/編集モデルを `gpt-5.2` に更新
- **モジュール分割リファクタリング**: すべてのソースファイルを 298 行以下に分割
- **コード重複排除**: `isInputElement` の統一、`publishStatus()` の一元化、マジック値の定数化
- **ESLint 導入**: Flat Config 形式でエラー 0 件を達成

### ドキュメント整備
- 未実装の追記モード関連記述を README から削除
- 分散 CLAUDE.md による Agentic Coding コンテキスト整備
- 不要な計画ドキュメント・IDE 設定ファイルを削除

## 技術的な改善

### モジュール分割

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

### コード重複排除

- `isInputElement` を `dom-input-detection.js` に統一（旧 `utils.js` の簡易版を削除）
- `publishStatus()` を `event-bus.js` に追加し、4箇所に散在したプライベート `showStatus` プロキシを統合
- `constants.js` に `UI_FEEDBACK`・`GPT_PARAMS`・`PAPER_PLANE_SVG` 定数グループを追加してマジック値を排除
- `clickButtonWithFeedback(button, delayMs?)` に遅延パラメータを追加し、サイトハンドラーの送信ロジック重複を解消

### テスト・品質管理

- Jest テストスイート：46 スイート・650 テスト（630 passed, 20 skipped）
- ESLint（Flat Config 形式）：エラー 0 件
- Snyk によるセキュリティ脆弱性チェック

---

## v3.1 リリースノート (2025-05-04)

- **クラウド同期機能の追加**: 設定が複数デバイス間で同期されるようになりました
- **テーマ機能の強化**: ダークモードとライトモードの切り替えが可能になりました
- **音声認識結果表示モーダルの追加**: 入力フィールドが見つからない場合でも音声認識を使用可能に
- **x.com (Twitter) サポートの改善**: 複雑なエディタ環境でも使用可能に
- **バグ修正**: 「内容を校閲」ボタンのエラーを修正
- **パフォーマンス改善**: DOM操作の最適化によりレスポンス性能が向上
