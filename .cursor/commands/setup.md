# setup

プロジェクトの初期セットアップを実行する

---

## Task 0: 前提条件の確認

### pnpm のインストール確認

```bash
pnpm --version
```

インストールされていない場合は以下のいずれかでインストール：

**方法1: Homebrew（推奨）**
```bash
brew install pnpm
```

**方法2: スタンドアロンスクリプト**
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

**方法3: Corepack（Node.js 16.13以降）**
```bash
npm install --global corepack@latest
corepack enable pnpm
corepack use pnpm@latest-10
```

**方法4: npm**
```bash
npm install -g pnpm@latest-10
```

> 📝 参考: [pnpm公式インストールガイド](https://pnpm.io/ja/installation)

---

## Task 1: Gitリポジトリ初期化

```bash
# Gitリポジトリ初期化
git init
git branch -M main

# .gitignoreの作成（なければ）
cat << 'EOF' > .gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/

# Temporary
tmp/
*.log

# Vite
.vite/
EOF

# 初期コミット
git add .
git commit -m "chore: initial project setup"
```

> 💡 リモートリポジトリへの接続: `git remote add origin <URL>`

---

## Task 2: 依存関係インストール

```bash
# 依存関係インストール
pnpm install

# 環境変数ファイルの作成
cp .env.example .env
```

### 🔐 API認証情報の設定

`.env` ファイルを編集して、Basic認証の認証情報を設定してください：

```bash
# .env
BASIC_AUTH_USERNAME=your_username  # ← 任意のユーザー名に変更
BASIC_AUTH_PASSWORD=your_password  # ← 安全なパスワードに変更
```

> ⚠️ **セキュリティ注意**: デフォルトの `admin/admin` は開発用です。本番環境では必ず変更してください。

```bash
# コミット
git add .
git commit -m "chore: install dependencies"
```

> 💡 `.env` ファイルは `.gitignore` に含まれているため、コミットされません。

---

## Task 3: 動作確認

```bash
# 型チェック（tsgo使用） + Lint + テスト
pnpm typecheck && pnpm lint && pnpm test

# 開発サーバー起動
pnpm dev
# → http://localhost:5173
```

> 💡 `pnpm typecheck` は tsgo（TypeScript Go native）を使用。従来のtscは `pnpm typecheck:tsc` で実行可能。

---

## 開発時の起動

```bash
# ターミナル1: バックエンド（Hono）
pnpm api:dev
# → http://localhost:3000
# → Swagger UI: http://localhost:3000/api/ui

# ターミナル2: フロントエンド（Vite）
pnpm dev
# → http://localhost:5173
```

### 🔐 API認証情報（開発環境）

| 項目 | 値 |
|------|-----|
| **ユーザー名** | `admin` |
| **パスワード** | `admin` |
| **認証方式** | Basic認証 |

```bash
# curlでのAPI呼び出し例
curl -u admin:admin http://localhost:3000/api/v1/users
```

> 💡 本番環境では環境変数 `BASIC_AUTH_USERNAME` / `BASIC_AUTH_PASSWORD` で設定

---

## コマンド早見表

| カテゴリ | コマンド | 用途 |
|---------|---------|------|
| **Setup** | `pnpm install` | 依存関係インストール |
| **Dev** | `pnpm dev` | フロントエンド開発サーバー（:5173） |
| **Dev** | `pnpm api:dev` | バックエンド開発サーバー（:3000） |
| **Build** | `pnpm build` | プロダクションビルド（tsgo + vite） |
| **Quality** | `pnpm typecheck` | 型チェック（tsgo - 高速） |
| **Quality** | `pnpm typecheck:tsc` | 型チェック（tsc - 互換用） |
| **Quality** | `pnpm lint` | Linting（Biome） |
| **Quality** | `pnpm test` | テスト実行（Vitest） |
| **Quality** | `pnpm check` | 型チェック + Lint |
