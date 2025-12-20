import { readFile } from 'node:fs/promises';
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
      port: 5176,
      hmr: {
        port: 5176,
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
  const port = Number(process.env.BREAKOUT_API_PORT) || 3003;

  // Vite dev serverを起動
  console.log('🔧 Starting Vite dev server...');
  await createVite();
  console.log('✅ Vite dev server ready at http://localhost:5176');

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
      const viteUrl = `http://localhost:5176${url.pathname}${url.search}`;
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
        title: 'Breakout Game',
        description: 'ブロック崩しゲーム',
        timestamp: new Date().toISOString(),
      };

      // ViteでReactコンポーネントをSSRロード（Appコンポーネントのみ）
      const { App } = await vite.ssrLoadModule('/src/App.tsx');

      // ReactコンポーネントをSSR（StrictModeで囲む）
      const appHtml = renderToString(
        createElement(StrictMode, {}, createElement(App, { initialData })),
      );

      // index.html を読み込み（Single Source of Truth）
      const rawTemplate = await readFile('index.html', 'utf-8');

      // ViteのHTML変換を適用（HMRクライアント注入、モジュールパス解決）
      const template = await vite.transformIndexHtml(url, rawTemplate);

      // SSR用プレースホルダーを置換
      const html = template
        .replace(/<!--ssr-title-->.*?<!--\/ssr-title-->/, initialData.title)
        .replace(
          /<!--ssr-description-->.*?<!--\/ssr-description-->/,
          initialData.description,
        )
        .replace(
          '<!--ssr-head-->',
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`,
        )
        .replace('<!--ssr-outlet-->', appHtml);

      return c.html(html);
    } catch (error) {
      // SSRエラー処理
      if (error instanceof Error) {
        vite.ssrFixStacktrace(error);
        console.error('❌ SSR Error:', error.message);
        console.error(error.stack);
      }

      // エラー時はindex.htmlをそのまま返す（CSRフォールバック）
      try {
        const fallbackTemplate = await readFile('index.html', 'utf-8');
        const fallbackHtml = await vite.transformIndexHtml(
          url,
          fallbackTemplate,
        );
        return c.html(fallbackHtml, 500);
      } catch {
        return c.html('<html><body><h1>Server Error</h1></body></html>', 500);
      }
    }
  });

  console.log('');
  console.log('🔧 breakout Development Server (Vite SSR Integration)');
  console.log(`🚀 SSR Server: http://localhost:${port}`);
  console.log('⚡ Vite Dev Server: http://localhost:5176');
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
