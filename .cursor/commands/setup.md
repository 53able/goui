# setup

pnpm workspaces + Turborepo モノレポプロジェクトの初期セットアップ

> 📝 以下のドキュメントでは `@myorg/*` をパッケージ名のプレースホルダーとして使用。実際のプロジェクトに合わせて変更してください。

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

> 📝 参考: [pnpm公式インストールガイド](https://pnpm.io/ja/installation)

---

## Task 1: 依存関係インストール

```bash
# 全ワークスペースの依存関係をインストール
pnpm install

# 環境変数ファイルの作成（apps/web用）
cp apps/web/.env.example apps/web/.env  # 存在する場合
```

### 🔐 環境変数の設定

プロジェクトルートに `.env` ファイルを作成して、必要な環境変数を設定：

```bash
# .env
# AI API Keys (AI機能を使う場合は必須)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Basic認証 (開発用デフォルト: admin/admin)
BASIC_AUTH_USERNAME=your_username
BASIC_AUTH_PASSWORD=your_password
```

> 🔗 OpenAI APIキー取得: https://platform.openai.com/api-keys
> 📝 詳細は `.cursor/rules/ai-environment.mdc` を参照

---

## Task 2: 動作確認

```bash
# 型チェック + Lint + テスト（Turborepoで並列実行）
pnpm typecheck && pnpm lint && pnpm test

# ビルド確認
pnpm build
```

> 💡 Turborepoがキャッシュを活用して高速に実行します

---

## 開発時の起動（SSR + HMR）

> 💡 開発環境ではSSRサーバー（`dev:api`）を起動して、SSRサーバー経由でアクセスする

### 方法1: 個別起動（推奨）

```bash
# ターミナル1: Webアプリ（SSRサーバー）
cd apps/web && pnpm dev:api      # http://localhost:3000 ← メインアクセスURL

# ターミナル2: 管理画面（SSRサーバー）
cd apps/admin && pnpm dev:api    # http://localhost:3001 ← メインアクセスURL

# ターミナル3: Playground（SSRサーバー）
cd apps/playground && pnpm dev:api  # http://localhost:3002 ← メインアクセスURL
```

> ⚠️ SSRサーバーが内部でVite Dev Serverも起動するため、`pnpm dev`（Viteのみ）は不要

### 方法2: フィルター指定

```bash
# 特定のアプリのSSRサーバーを起動
pnpm --filter @myorg/web dev:api
pnpm --filter @myorg/admin dev:api
```

### 方法3: Turborepo一括起動

```bash
# 全アプリを同時起動（SSRサーバー）
pnpm dev
```

---

## 開発時のエンドポイント（SSR + HMR）

> 💡 開発時は **SSRサーバー（300x）** にアクセスする。Vite Dev（517x）はHMR用で内部的に使用される。

| URL | 種別 | 説明 |
|-----|------|------|
| `http://localhost:3000` | **SSRサーバー (web)** | メインアクセスURL - SSR + API + HMR |
| `http://localhost:3001` | **SSRサーバー (admin)** | メインアクセスURL - SSR + API + HMR |
| `http://localhost:3002` | **SSRサーバー (playground)** | メインアクセスURL - SSR + API + HMR |
| `http://localhost:5173` | Vite Dev (web) | HMR用（直接アクセスはCSR） |
| `http://localhost:5174` | Vite Dev (admin) | HMR用（直接アクセスはCSR） |
| `http://localhost:5175` | Vite Dev (playground) | HMR用（直接アクセスはCSR） |
| `http://localhost:300x/api/ui` | Swagger UI | OpenAPIドキュメント |
| `http://localhost:300x/api/doc` | OpenAPI JSON | API仕様書 |

### curlでのAPI呼び出し例

```bash
# 認証情報はデフォルト値（開発用）
curl -u admin:admin http://localhost:3000/api/v1/users
```

### SSRとHMRの動作確認

```bash
# SSRが動作しているか確認（初回レスポンスでHTMLが返る）
curl -s http://localhost:3000 | grep -o '<div id="root">.*</div>' | head -1

# HMRが有効か確認（コンソールに「Hydrating React app...」と表示される）
# ブラウザでアクセスして開発者ツールを確認
```

---

## 本番ビルド

```bash
# 全パッケージをビルド（クライアント + SSRバンドル、Turborepoで依存順に実行）
pnpm build

# 特定のアプリのみビルド
pnpm build --filter=@myorg/web
```

> 💡 **ビルド出力**:
> - `dist/` - クライアントビルド（静的ファイル + manifest.json）
> - `dist/server/` - SSRバンドル（entry-server.js）

---

## 本番SSRサーバー起動（セルフホスト）

```bash
# 特定のアプリの本番サーバーを起動
pnpm --filter @myorg/web start
pnpm --filter @myorg/admin start
pnpm --filter @myorg/playground start
```

> ⚠️ **事前に `pnpm build` が必要です。** SSRバンドル（`dist/server/entry-server.js`）が読み込まれます。

---

## Vercelへのデプロイ（マルチプロジェクト）

> 💡 **Note**: 各アプリには `vercel.json` が設定済み。Build Command、Install Command、rewrites などは自動で適用されます。

### 🚀 推奨: モノレポ一括リンク（vercel link --repo）

モノレポ全体を一度にリンクする方法。**CLIのみで完結**できる。

#### Step 1: モノレポをVercelにリンク

```bash
cd /path/to/project-root
vercel link --repo --yes
```

これで `.vercel/repo.json` が作成され、全プロジェクトがリンクされる：

```json
{
  "orgId": "team_xxxxx",
  "projects": [
    { "id": "prj_xxxxx", "name": "web", "directory": "apps/web" },
    { "id": "prj_xxxxx", "name": "admin", "directory": "apps/admin" },
    { "id": "prj_xxxxx", "name": "playground", "directory": "apps/playground" }
  ]
}
```

#### Step 2: 環境変数でプロジェクト指定デプロイ

```bash
# repo.json から ORG_ID と PROJECT_ID を取得してデプロイ
VERCEL_ORG_ID=team_xxxxx \
VERCEL_PROJECT_ID=prj_xxxxx \
vercel deploy --prod --yes
```

#### デプロイスクリプト例

```bash
#!/bin/bash
# deploy.sh - 特定のプロジェクトをデプロイ

ORG_ID="team_xxxxx"

case "$1" in
  web)
    PROJECT_ID="prj_xxxxx" ;;
  admin)
    PROJECT_ID="prj_xxxxx" ;;
  playground)
    PROJECT_ID="prj_xxxxx" ;;
  *)
    echo "Usage: $0 {web|admin|playground}"
    exit 1 ;;
esac

VERCEL_ORG_ID=$ORG_ID VERCEL_PROJECT_ID=$PROJECT_ID vercel deploy --prod --yes
```

---

### 従来の方法: 個別リンク

各アプリディレクトリで個別にリンクする方法。

#### @myorg/web のデプロイ

```bash
# Vercel CLIのインストール（未インストールの場合）
pnpm add -g vercel

# プロジェクトをVercelにリンク
cd apps/web
vercel link

# 環境変数の設定（方法1: 対話式で1つずつ）
vercel env add OPENAI_API_KEY
vercel env add BASIC_AUTH_USERNAME
vercel env add BASIC_AUTH_PASSWORD

# デプロイ
vercel deploy
```

#### @myorg/admin のデプロイ

```bash
cd apps/admin
vercel link
vercel deploy
```

---

### 環境変数の設定

#### 🔐 Basic認証の設定（必須）

> ⚠️ **セキュリティ注意**: デフォルト値 `admin/admin` は開発用です。本番環境では必ず変更してください！

```bash
# Basic認証の環境変数を設定
vercel env add BASIC_AUTH_USERNAME production
# → 入力: your_secure_username

vercel env add BASIC_AUTH_PASSWORD production
# → 入力: your_secure_password
```

#### 環境変数の一括設定（.env から Vercel へ）

```bash
# .env ファイルから本番環境変数を一括設定
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue  # 空行・コメントをスキップ
  echo "$value" | vercel env add "$key" production --yes 2>/dev/null || \
    echo "⚠️ $key already exists, skipping"
done < .env.production
```

| 環境指定 | コマンド |
|---------|---------|
| Production | `vercel env add KEY production` |
| Preview | `vercel env add KEY preview` |
| Development | `vercel env add KEY development` |
| 全環境 | `vercel env add KEY production preview development` |

#### Vercel → ローカルへ環境変数を取得

```bash
# Vercelに設定済みの環境変数をローカルに取得
vercel env pull .env.local
```

### 🛡️ Vercel Deployment Protection の無効化

Vercelのデフォルト設定でDeployment Protection（SSO認証）が有効になっている場合、APIアクセスがブロックされます：

```bash
# Deployment Protection を無効化（APIでの設定が必要）
curl -X PATCH "https://api.vercel.com/v9/projects/{projectId}?teamId={teamId}" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection": null}'
```

または、Vercel Dashboard → Project Settings → Deployment Protection で無効化。

### Vercel Dashboard設定

各プロジェクトで以下を設定（`vercel.json` が既に設定済みの場合は不要）：

| 設定項目 | 値 |
|---------|-----|
| **Root Directory** | `apps/web` または `apps/admin` |
| **Build Command** | `cd ../.. && pnpm turbo build --filter=@myorg/xxx` |
| **Output Directory** | `dist` |
| **Install Command** | `cd ../.. && pnpm install` |

### vercel.json の設定内容

各アプリの `vercel.json` には以下が設定済み：

```json
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=@myorg/xxx",
  "installCommand": "cd ../.. && pnpm install",
  "outputDirectory": "dist",
  "framework": "vite",
  "regions": ["hnd1"],
  "rewrites": [
    { "source": "/health", "destination": "/api/[[...route]]" },
    { "source": "/api/:path*", "destination": "/api/[[...route]]" },
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

| 設定 | 説明 |
|-----|------|
| `regions` | `hnd1` = 東京リージョン |
| `rewrites` | SPA対応 + Edge Functions へのルーティング |

### ⚠️ Vercel Functions での注意点

Vercel Functionsで共有パッケージを使用する場合、**ビルド済みJavaScriptが必要**です：

#### ✅ 正しい設定（packages/shared）

```json
// packages/shared/package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc"
  }
}
```

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true
    // ❌ "noEmit": true は削除
  }
}
```

#### ❌ 間違った設定

```json
// ❌ TypeScriptソースを直接参照 → Vercel Functionsで動かない
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

#### Vercel用ファイルの実装

| ファイル | 実装方法 |
|---------|---------|
| `api/[[...route]].ts` | Node.js Serverless Functionsスタイル（req/res → Honoブリッジ） |
| `server/appVercel.ts` | 軽量版Honoアプリ（`@myorg/shared` OK） |
| `middleware.ts` | Vercel Edge Middleware（純粋JS、Basic認証） |

> 📝 `@hono/zod-openapi` や `@scalar/hono-api-reference` は重いため、`appVercel.ts` では使用しない。
> ローカル開発では `server/app.ts` の完全版API（OpenAPI/Swagger UI付き）を使用します。

### Ignored Build Step（差分ビルド）

各アプリの `vercel.json` に `ignoreCommand` が設定済み。変更がないアプリはビルドがスキップされる：

```json
{
  "ignoreCommand": "git diff --quiet HEAD^ HEAD -- ."
}
```

> 💡 **動作**: 前のコミットと比較して、そのアプリのディレクトリに変更がなければビルドをスキップ。
> これにより、1ファイル変更で全アプリがビルドされる無駄を防ぐ。

---

## 新しいアプリの追加

> 📝 詳細な手順は `.cursor/commands/add-app.md` を参照

### Step 1: ディレクトリ作成

```bash
mkdir -p apps/新アプリ/{src,server/routes,api}
```

### Step 2: package.json 作成

> 💡 `@myorg/shared` と `@myorg/ui` を依存に追加するのが必須！

```bash
cat << 'EOF' > apps/新アプリ/package.json
{
  "name": "@myorg/新アプリ",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "biome check --write .",
    "lint:check": "biome check ."
  },
  "dependencies": {
    "@myorg/shared": "workspace:*",
    "@myorg/ui": "workspace:*",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.2",
    "tailwindcss": "^4.1.18",
    "typescript": "~5.9.3",
    "vite": "^7.3.0"
  }
}
EOF
```

### Step 3: tsconfig.json 作成

```bash
cat << 'EOF' > apps/新アプリ/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
EOF
```

### Step 4: vite.config.ts 作成

> ⚠️ `server.port` を既存アプリと被らないように設定！

| アプリ | SSRサーバー | Vite Dev |
|--------|------------|----------|
| @myorg/web | 3000 | 5173 |
| @myorg/admin | 3001 | 5174 |
| @myorg/playground | 3002 | 5175 |
| 新アプリ | 3003〜 | 5176〜 |

```bash
cat << 'EOF' > apps/新アプリ/vite.config.ts
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Vite設定ファイル
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5175, // 他アプリと被らないポートに変更
  },
});
EOF
```

### Step 5: index.html 作成

```bash
cat << 'EOF' > apps/新アプリ/index.html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>新アプリ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
```

### Step 6: src/index.css 作成（Tailwind CSS v4）

```bash
cat << 'EOF' > apps/新アプリ/src/index.css
@import 'tailwindcss';

@theme {
  --color-background: hsl(0 0% 100%);
  --color-foreground: hsl(222.2 84% 4.9%);
  --color-muted-foreground: hsl(215.4 16.3% 46.9%);
  --color-primary: hsl(222.2 47.4% 11.2%);
  --color-primary-foreground: hsl(210 40% 98%);
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: hsl(222.2 84% 4.9%);
    --color-foreground: hsl(210 40% 98%);
    --color-muted-foreground: hsl(215 20.2% 65.1%);
    --color-primary: hsl(210 40% 98%);
    --color-primary-foreground: hsl(222.2 47.4% 11.2%);
  }
}
EOF
```

### Step 7: src/main.tsx 作成

```bash
cat << 'EOF' > apps/新アプリ/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
EOF
```

### Step 8: src/App.tsx 作成

```bash
cat << 'EOF' > apps/新アプリ/src/App.tsx
import { Button, cn } from '@myorg/ui';
import type { FC } from 'react';

/**
 * アプリケーションのルートコンポーネント
 */
export const App: FC = () => {
  return (
    <div className={cn('min-h-screen bg-background p-8')}>
      <h1 className="text-3xl font-bold mb-4">新アプリ</h1>
      <p className="text-muted-foreground mb-4">
        @myorg/ui パッケージのコンポーネントを使用しています
      </p>
      <Button onClick={() => alert('Hello!')}>
        クリックしてね
      </Button>
    </div>
  );
};
EOF
```

### Step 9: 依存関係インストール & 起動確認

```bash
# 依存関係インストール
pnpm install

# 起動確認
pnpm --filter @myorg/新アプリ dev
```

### 🎉 完了チェックリスト

- [ ] `http://localhost:300x`（SSRサーバー）でアプリが表示される
- [ ] ソース変更時にHMRが動作する
- [ ] `@myorg/ui` のButtonコンポーネントが動作する
- [ ] ダークモード切り替えでテーマが変わる
- [ ] `pnpm typecheck` が通る
- [ ] `pnpm lint` が通る

> 📝 新規アプリ追加の詳細は `.cursor/commands/add-app.md` を参照

---

## コマンド早見表

| カテゴリ | コマンド | 用途 |
|---------|---------|------|
| **Setup** | `pnpm install` | 全ワークスペースの依存関係インストール |
| **Dev** | `pnpm dev` | 全アプリのSSRサーバーを同時起動（Turborepo） |
| **Dev** | `pnpm --filter @myorg/web dev:api` | 特定アプリのSSRサーバーを起動 |
| **Dev** | `pnpm --filter @myorg/web dev` | Vite Devのみ起動（CSR、通常は不要） |
| **Build** | `pnpm build` | 全パッケージビルド（クライアント + SSRバンドル） |
| **Build** | `pnpm build --filter=@myorg/web` | 特定アプリのみビルド |
| **Quality** | `pnpm typecheck` | 型チェック（全パッケージ） |
| **Quality** | `pnpm lint` | Linting（全パッケージ） |
| **Quality** | `pnpm test` | テスト実行（全パッケージ） |
| **Production** | `pnpm --filter @myorg/web start` | 本番SSRサーバー起動（セルフホスト） |
| **Vercel** | `vercel dev --cwd apps/web` | Vercelローカルプレビュー |
| **Vercel** | `git push origin main` | Vercel自動デプロイ（Git連携推奨） |

---

## ワークスペース一覧

| パッケージ名 | パス | 説明 |
|-------------|------|------|
| `@myorg/web` | `apps/web` | メインWebアプリ（+ API） |
| `@myorg/admin` | `apps/admin` | 管理画面 |
| `@myorg/playground` | `apps/playground` | 実験場（ライフゲームなど） |
| `@myorg/shared` | `packages/shared` | 共有スキーマ・型定義 |
| `@myorg/ui` | `packages/ui` | 共有UIコンポーネント |
| `@myorg/ai` | `packages/ai` | AI SDK 共有パッケージ |
