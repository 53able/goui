import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { app } from './app.js';

/**
 * 本番用サーバー（VPS/セルフホスト用）
 * @description React SSR + API認証
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

// SSR対応のアプリルートをマウント
// app.ts 内で React SSR と静的ファイル配信を処理
prodApp.route('/', app);

const port = Number(process.env.PLAYGROUND_PORT) || 3002;

console.log('🚀 playground Production Server (Self-hosted) with SSR');
console.log(`🌐 Application: http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
console.log('🔐 API認証: /api/v1/* のみ');
console.log('⚡ React SSR enabled');

serve({
  fetch: prodApp.fetch,
  port,
});
