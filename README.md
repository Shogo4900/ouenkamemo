# ⚾ 応援歌メモ管理ツール

Notionデータベースと連携した野球応援歌の管理アプリです。

## 機能

- ✅ 応援歌の一覧表示（Notionから取得）
- ✅ 新規登録（Notionに直接書き込み）
- ✅ **重複検出**：選手名と歌詞が完全一致する場合に警告を表示
- ✅ チーム・フリーワードで絞り込み検索
- ✅ 汎用フラグ・汎用の対象の設定

## セットアップ

### 1. Notionインテグレーション作成

1. https://www.notion.so/my-integrations にアクセス
2. 「新しいインテグレーション」を作成
3. シークレットキーをコピー
4. 対象のNotionデータベースを開き、「...」→「コネクト」→作成したインテグレーションを追加

### 2. ローカル開発

```bash
# 依存関係インストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集してAPIキーを設定

# 開発サーバー起動
npm run dev
```

http://localhost:3000 でアクセスできます。

## Vercelデプロイ

### GitHubリポジトリを作成してpush

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ouenka-app.git
git push -u origin main
```

### Vercelでデプロイ

1. https://vercel.com にアクセスしてログイン
2. 「New Project」→ GitHubリポジトリをインポート
3. **Environment Variables** に以下を設定：
   - `NOTION_API_KEY` = `secret_xxxx...`
   - `NOTION_DATABASE_ID` = `1ab8b9006adc825891ad81d43963eab0`
4. 「Deploy」をクリック

以上でデプロイ完了です！

## Notionデータベース構造

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| 選手名 | タイトル | 選手の名前 |
| チーム名 | セレクト | 12球団から選択 |
| 歌詞 | テキスト | 応援歌の歌詞 |
| 汎用(選手名→「名前」) | チェックボックス | 汎用フラグ |
| 汎用の対象 | マルチセレクト | 捕手/野手/投手など |
| 流用 | リレーション | 他エントリとの関連 |
