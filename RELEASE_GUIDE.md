# GitHub Releaseの作成手順

このガイドでは、otak-voice拡張機能のGitHub Releaseを作成する手順を説明します。

## 前提条件

1. GitHubリポジトリへのプッシュ権限があること
2. GitHub Secretsに`EXTENSION_KEY`が設定されていること（初回のみ）

## GitHub Secretsの設定（初回のみ）

拡張機能の署名に使用する秘密鍵を GitHub Secrets に設定する必要があります。

1. GitHubリポジトリのページに移動します
2. 「Settings」タブをクリックします
3. 左側のメニューから「Secrets and variables」→「Actions」を選択します
4. 「New repository secret」ボタンをクリックします
5. 名前に「EXTENSION_KEY」と入力します
6. 値に秘密鍵の内容を貼り付けます
   - 既存の秘密鍵がある場合は、その内容を貼り付けます
   - 新しい秘密鍵を生成する場合は、以下のコマンドを実行して生成された鍵を貼り付けます：
     ```
     openssl genrsa 2048 | base64
     ```
7. 「Add secret」ボタンをクリックします

## リリースの作成手順

### 1. ローカル環境での準備

1. リポジトリを最新の状態に更新します：
   ```
   git pull origin main
   ```

2. テスト・ビルド・Lintがすべて通ることを確認します：
   ```
   npm test
   npm run lint
   npm run build
   ```

3. `manifest.json`と`package.json`のバージョン番号が一致していることを確認します：
   ```
   cat manifest.json | grep version
   cat package.json | grep version
   ```

4. 必要に応じてバージョン番号を更新します（両ファイルを同時に更新）：
   ```json
   // manifest.json
   "version": "X.Y"

   // package.json
   "version": "X.Y"
   ```

5. `release_notes.md` を新バージョンの内容に更新します。

6. 変更をコミットします：
   ```
   git add manifest.json package.json release_notes.md
   git commit -m "chore: bump version to vX.Y"
   ```

### 2. タグの作成とプッシュ

1. 新しいタグを作成します（バージョン番号を指定）：
   ```
   git tag vX.Y
   ```

2. コミットとタグをリモートリポジトリにプッシュします：
   ```
   git push origin main
   git push origin vX.Y
   ```

### 3. GitHub Actionsの実行確認

1. GitHubリポジトリのページに移動します
2. 「Actions」タブをクリックします
3. 「Create GitHub Release」ワークフローが実行されていることを確認します
4. ワークフローの実行が完了するまで待ちます（約2〜3分）

### 4. リリースの確認

1. GitHubリポジトリの「Releases」セクションを確認します
2. 新しいリリースに以下のファイルが添付されていることを確認します：
   - `otak-voice-latest.zip`
   - `otak-voice-latest.crx`
   - `version-info.json`

## リリースノートのカスタマイズ

リリースノートをカスタマイズする場合は、`.github/workflows/release.yml`ファイルの「Generate release notes」ステップを編集します。

## トラブルシューティング

### ワークフローが失敗する場合

1. GitHub Actionsのログを確認して、エラーの原因を特定します
2. 一般的な問題：
   - `EXTENSION_KEY`が設定されていない
   - ビルドエラー（`npm run build`が失敗）
   - パッケージングエラー

### 手動でリリースを作成する場合

1. GitHubリポジトリの「Releases」セクションを開きます
2. 「Draft a new release」ボタンをクリックします
3. タグを選択または新しいタグを作成します
4. リリースタイトルとリリースノートを入力します
5. ビルドしたファイルをアップロードします
6. 「Publish release」ボタンをクリックします
