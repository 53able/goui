import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { healthRoutes } from './routes/health';
import { userRoutes } from './routes/users';

/**
 * Honoアプリケーションインスタンス（API部分のみ）
 * @description 認証は各サーバー設定で適用
 */
const app = new OpenAPIHono();

// ミドルウェア設定
app.use('*', logger());
app.use('*', cors());

// ルート登録
app.route('/', healthRoutes);
app.route('/api/v1/users', userRoutes);

// OpenAPI仕様
app.doc('/api/doc', {
  openapi: '3.1.0',
  info: {
    title: 'UI Sample Admin API',
    version: '0.1.0',
    description: 'エンタープライズ級管理画面APIのボイラープレート',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '開発環境',
    },
  ],
});

// Swagger UI (Scalar)
app.get(
  '/api/ui',
  apiReference({
    url: '/api/doc',
  }),
);

export type AppType = typeof app;
export { app };
