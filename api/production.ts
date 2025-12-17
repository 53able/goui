import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { app } from './index';

/**
 * 本番用サーバー
 * @description SPA配信 + API、全体にBasic認証を適用
 */
const prodApp = new OpenAPIHono();

// 全体にBasic認証を適用（ヘルスチェック以外）
prodApp.use('*', async (c, next) => {
  // ヘルスチェックは認証なし（監視ツール用）
  if (c.req.path === '/health') {
    return next();
  }
  // それ以外はBasic認証を適用
  const auth = basicAuth({
    username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
    password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
  });
  return auth(c, next);
});

// APIルートをマウント
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

const port = Number(process.env.API_PORT) || 3000;

console.log('🚀 Production Server');
console.log(`🌐 Application: http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
console.log('🔐 認証: 全画面（/health 以外）');

serve({
  fetch: prodApp.fetch,
  port,
});


