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

## 開発時の起動

### 方法1: 個別起動（推奨）

```bash
# ターミナル1: Webアプリ（@myorg/web）
cd apps/web && pnpm dev          # http://localhost:5173

# ターミナル2: 管理画面（@myorg/admin）
cd apps/admin && pnpm dev        # http://localhost:5174

# ターミナル3: APIサーバー（@myorg/web内）
cd apps/web && pnpm dev:api      # http://localhost:3000
```

### 方法2: フィルター指定

```bash
# 特定のアプリのみ起動
pnpm --filter @myorg/web dev
pnpm --filter @myorg/admin dev
```

### 方法3: Turborepo一括起動

```bash
# 全アプリを同時起動
pnpm dev
```

---

## 開発時のエンドポイント

| URL | アプリ | 説明 |
|-----|--------|------|
| `http://localhost:5173` | @myorg/web | メインWebアプリ |
| `http://localhost:5174` | @myorg/admin | 管理画面 |
| `http://localhost:5175` | @myorg/playground | 実験場（ライフゲームなど） |
| `http://localhost:3000` | API (web) | バックエンドAPIサーバー |
| `http://localhost:3000/api/ui` | API (web) | Swagger UI |
| `http://localhost:3000/api/doc` | API (web) | OpenAPI JSON |

### curlでのAPI呼び出し例

```bash
# 認証情報はデフォルト値（開発用）
curl -u admin:admin http://localhost:3000/api/v1/users
```

---

## 本番ビルド

```bash
# 全パッケージをビルド（Turborepoで依存順に実行）
pnpm build

# 特定のアプリのみビルド
pnpm build --filter=@myorg/web
```

---

## Vercelへのデプロイ（マルチプロジェクト）

### 各アプリを別プロジェクトとしてデプロイ

> 💡 **Note**: 各アプリには `vercel.json` が設定済み。Build Command、Install Command、rewrites などは自動で適用されます。

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

#### @myorg/admin のデプロイ

```bash
cd apps/admin
vercel link
vercel deploy
```

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

### ⚠️ Vercel Edge Runtime の制約

Vercel Edge Runtime では以下のモジュールがサポートされません：
- `@myorg/shared` などのワークスペースパッケージ
- `@hono/zod-openapi`
- `@scalar/hono-api-reference`

そのため、Vercel用のファイルは以下のように実装します：

| ファイル | 実装方法 |
|---------|---------|
| `api/[[...route]].ts` | シンプルなインラインHonoアプリ（Edge Runtime） |
| `middleware.ts` | 純粋なJavaScriptで Basic認証を実装 |

> 📝 ローカル開発では `server/app.ts` の完全版API（OpenAPI/Swagger UI付き）を使用します。

### Ignored Build Step（差分ビルド）

Vercel Dashboard → Project Settings → Git → Ignored Build Step:

```bash
git diff HEAD^ HEAD --quiet ./apps/web ./packages/
```

---

## 新しいアプリの追加

### Step 1: ディレクトリ作成

```bash
mkdir -p apps/新アプリ/src
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

| アプリ | ポート |
|--------|--------|
| @myorg/web | 5173 |
| @myorg/admin | 5174 |
| 新アプリ | 5175〜 |

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

- [ ] `http://localhost:5175` でアプリが表示される
- [ ] `@myorg/ui` のButtonコンポーネントが動作する
- [ ] ダークモード切り替えでテーマが変わる
- [ ] `pnpm typecheck` が通る
- [ ] `pnpm lint` が通る

---

## コマンド早見表

| カテゴリ | コマンド | 用途 |
|---------|---------|------|
| **Setup** | `pnpm install` | 全ワークスペースの依存関係インストール |
| **Dev** | `pnpm dev` | 全アプリを同時起動（Turborepo） |
| **Dev** | `pnpm --filter @myorg/web dev` | 特定アプリのみ起動 |
| **Dev** | `cd apps/web && pnpm dev:api` | APIサーバー起動 |
| **Build** | `pnpm build` | 全パッケージビルド |
| **Build** | `pnpm build --filter=@myorg/web` | 特定アプリのみビルド |
| **Quality** | `pnpm typecheck` | 型チェック（全パッケージ） |
| **Quality** | `pnpm lint` | Linting（全パッケージ） |
| **Quality** | `pnpm test` | テスト実行（全パッケージ） |
| **Vercel** | `vercel deploy` | Vercelプレビューデプロイ |
| **Vercel** | `vercel deploy --prod` | Vercel本番デプロイ |

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
