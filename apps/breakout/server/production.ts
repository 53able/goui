import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { apiRoutes } from './app.js';

/**
 * 本番用SSRサーバー（VPS/セルフホスト用）
 * @description React SSR + 静的ファイル配信 + API認証
 * @note Vercelデプロイでは使用しない（CSRが配信される）
 */

// SSRバンドルとマニフェストのパス
const CLIENT_DIST_PATH = join(process.cwd(), 'dist');
const SSR_DIST_PATH = join(process.cwd(), 'dist', 'server');
const SSR_MANIFEST_PATH = join(CLIENT_DIST_PATH, '.vite', 'ssr-manifest.json');

const prodApp = new OpenAPIHono();

// API部分にBasic認証を適用
prodApp.use(
  '/api/v1/*',
  basicAuth({
    username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
    password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
  }),
);

// APIルートをマウント
prodApp.route('/api', apiRoutes);

// 静的ファイル配信（Viteビルド出力）
prodApp.use(
  '/*',
  serveStatic({
    root: './dist',
  }),
);

// SSRエンドポイント
prodApp.get('*', async (c) => {
  try {
    // SSRバンドルを動的にインポート
    const { render } = await import(join(SSR_DIST_PATH, 'entry-server.js'));
    // クライアントビルドのマニフェストを読み込み
    const manifest = JSON.parse(await readFile(SSR_MANIFEST_PATH, 'utf-8'));
    // index.html をテンプレートとして読み込み
    const template = await readFile(
      join(CLIENT_DIST_PATH, 'index.html'),
      'utf-8',
    );

    // SSRレンダリング
    const { html, initialData } = await render(c.req.url, manifest);

    // テンプレートのプレースホルダーを置換
    const finalHtml = template
      .replace(/<!--ssr-title-->.*?<!--\/ssr-title-->/, initialData.title)
      .replace(
        /<!--ssr-description-->.*?<!--\/ssr-description-->/,
        initialData.description,
      )
      .replace(
        '<!--ssr-head-->',
        `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`,
      )
      .replace('<!--ssr-outlet-->', html);

    return c.html(finalHtml);
  } catch (error) {
    console.error('❌ SSR Error:', error);
    // SSRエラー時はSPAフォールバック
    const indexPath = join(CLIENT_DIST_PATH, 'index.html');
    const html = await readFile(indexPath, 'utf-8');
    return c.html(html, 500);
  }
});

const port = Number(process.env.BREAKOUT_PORT) || 3003;

console.log('🚀 breakout Production Server (Self-hosted) with SSR');
console.log(`🌐 Application: http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
console.log('🔐 API認証: /api/v1/* のみ');
console.log('⚡ React SSR enabled');

serve({
  fetch: prodApp.fetch,
  port,
});
