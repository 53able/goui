import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { app } from './app.js';

/**
 * 本番用サーバー（VPS/セルフホスト用）
 * @description SPA配信 + API認証
 * @note Vercelデプロイでは使用しない
 */
const prodApp = new OpenAPIHono();

// API部分にBasic認証を適用
prodApp.use(
  '/api/v1/*',
  basicAuth({
    username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
    password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
  }),
);

// アプリルートをマウント
prodApp.route('/', app);

// 静的ファイル配信（Viteビルド出力）
prodApp.use(
  '/*',
  serveStatic({
    root: './dist',
  }),
);

// SPAフォールバック（全てのルートでindex.htmlを返す）
prodApp.get('*', async (c) => {
  const indexPath = join(process.cwd(), 'dist', 'index.html');
  const html = await readFile(indexPath, 'utf-8');
  return c.html(html);
});

const port = Number(process.env.PLAYGROUND_PORT) || 3002;

console.log('🚀 playground Production Server (Self-hosted)');
console.log(`🌐 Application: http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
console.log('🔐 API認証: /api/v1/* のみ');

serve({
  fetch: prodApp.fetch,
  port,
});
