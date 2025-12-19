import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { app } from './app.js';

/**
 * 開発用サーバー（管理画面）
 * @description フロントエンドはVite dev serverが配信、APIのみこのサーバーで処理
 */
const devApp = new OpenAPIHono();

// ヘルスチェック・OpenAPIドキュメント以外にBasic認証を適用
devApp.use('*', async (c, next) => {
  const publicPaths = ['/health', '/api/doc', '/api/ui'];
  if (publicPaths.some((path) => c.req.path.startsWith(path))) {
    return next();
  }
  const auth = basicAuth({
    username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
    password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
  });
  return auth(c, next);
});

// アプリをマウント
devApp.route('/', app);

const port = Number(process.env.ADMIN_API_PORT) || 3001;

console.log('🔧 Admin Development Server');
console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
console.log('🔐 認証: 全体（/health, /api/doc, /api/ui 除く）');

serve({
  fetch: devApp.fetch,
  port,
});
