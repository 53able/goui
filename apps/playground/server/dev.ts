import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { app } from './app.js';

/**
 * 開発用APIサーバー
 * @description API部分のみ認証をかける（フロントエンドはVite dev serverが配信）
 */
const devApp = new OpenAPIHono();

// API部分にBasic認証を適用
devApp.use(
  '/api/v1/*',
  basicAuth({
    username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
    password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
  }),
);

// APIアプリをマウント
devApp.route('/', app);

const port = Number(process.env.PLAYGROUND_API_PORT) || 3002;

console.log('🔧 playground Development Server');
console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
console.log('🔐 API認証: /api/v1/* のみ');

serve({
  fetch: devApp.fetch,
  port,
});
