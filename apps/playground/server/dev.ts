import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { createElement, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import { apiRoutes } from './app.js';

/**
 * 開発用SSRサーバー（Vite統合）
 * @description ViteのSSRモジュールローダーを使用してSSR + HMRを実現
 */

// グローバルなViteインスタンス
let vite: ViteDevServer;

/**
 * Viteインスタンスを作成
 */
const createVite = async () => {
  vite = await createViteServer({
    server: {
      middlewareMode: false, // Viteを独立したサーバーとして起動
      port: 5175,
      hmr: {
        port: 5175,
      },
    },
    appType: 'custom',
  });

  await vite.listen();
  return vite;
};

/**
 * 開発サーバーを起動
 */
const startDevServer = async () => {
  const port = Number(process.env.PLAYGROUND_API_PORT) || 3002;

  // Vite dev serverを起動
  console.log('🔧 Starting Vite dev server...');
  await createVite();
  console.log('✅ Vite dev server ready at http://localhost:5175');

  // Honoアプリを作成
  const app = new OpenAPIHono();

  // API部分にBasic認証を適用
  app.use(
    '/api/v1/*',
    basicAuth({
      username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
      password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
    }),
  );

  // APIルートをマウント
  app.route('/api', apiRoutes);

  // Vite関連アセットをプロキシ
  const VITE_PROXY_PATHS = [
    '/src/*',
    '/@vite/*',
    '/@fs/*',
    '/@id/*',
    '/@react-refresh',
    '/node_modules/*',
    '/@vite-plugin-*',
  ];

  for (const path of VITE_PROXY_PATHS) {
    app.use(path, async (c) => {
      const url = new URL(c.req.url);
      const viteUrl = `http://localhost:5175${url.pathname}${url.search}`;
      try {
        const res = await fetch(viteUrl);
        return new Response(res.body, {
          status: res.status,
          headers: res.headers,
        });
      } catch (error) {
        console.error(`Failed to proxy ${viteUrl}:`, error);
        return c.text('Proxy error', 500);
      }
    });
  }

  // React SSRエンドポイント（ViteのssrLoadModuleを使用）
  app.get('*', async (c) => {
    const url = c.req.url;

    try {
      // 初期データを取得
      const initialData = {
        title: 'Playground - ライフゲームシミュレーター',
        description: 'Hono SSR + Vite で実装されたライフゲーム',
        timestamp: new Date().toISOString(),
      };

      // ViteでReactコンポーネントをSSRロード（Appコンポーネントのみ）
      const { App } = await vite.ssrLoadModule('/src/App.tsx');

      // ReactコンポーネントをSSR（StrictModeで囲む）
      // react と react-dom は直接インポート（Node.jsネイティブ）
      const appHtml = renderToString(
        createElement(StrictMode, {}, createElement(App, { initialData })),
      );

      // HTMLテンプレート
      const template = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${initialData.title}</title>
  <meta name="description" content="${initialData.description}">
  <script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>
</head>
<body>
  <div id="root">${appHtml}</div>
  <script type="module" src="http://localhost:5175/src/main.tsx"></script>
  <script type="module">
    import RefreshRuntime from 'http://localhost:5175/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
  </script>
</body>
</html>`;

      // ViteのHTML変換を適用（HMRクライアント注入）
      const html = await vite.transformIndexHtml(url, template);

      return c.html(html);
    } catch (error) {
      // SSRエラー処理
      if (error instanceof Error) {
        vite.ssrFixStacktrace(error);
        console.error('❌ SSR Error:', error.message);
        console.error(error.stack);
      }

      // エラー時はクライアントサイドレンダリングにフォールバック
      const fallbackHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Playground</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="http://localhost:5175/src/main.tsx"></script>
  <h1 style="color: red;">SSR Error (falling back to CSR)</h1>
  <pre>${error}</pre>
</body>
</html>`;

      return c.html(fallbackHtml, 500);
    }
  });

  console.log('');
  console.log('🔧 Playground Development Server (Vite SSR Integration)');
  console.log(`🚀 SSR Server: http://localhost:${port}`);
  console.log(`⚡ Vite Dev Server: http://localhost:5175`);
  console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
  console.log('🔐 API認証: /api/v1/* のみ');
  console.log('💡 SSR + HMR + Fast Refresh enabled!');
  console.log('');

  serve(
    {
      fetch: app.fetch,
      port,
    },
    (info) => {
      console.log(`✅ SSR Server running at http://localhost:${info.port}`);
    },
  );
};

// サーバー起動
startDevServer().catch((err) => {
  console.error('❌ Failed to start dev server:', err);
  process.exit(1);
});

// プロセス終了時にViteをクリーンアップ
process.on('SIGTERM', () => {
  if (vite) {
    vite.close();
  }
  process.exit(0);
});
