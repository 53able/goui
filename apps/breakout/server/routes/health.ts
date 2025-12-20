import { HealthResponseSchema } from '@goui/shared';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';

/**
 * ヘルスチェック用ルーター
 */
export const healthRoutes = new OpenAPIHono();

/**
 * アプリケーションバージョン（package.jsonから取得）
 */
const APP_VERSION = process.env.npm_package_version ?? '0.1.0';

/**
 * ヘルスチェックルート定義
 */
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'ヘルスチェック',
  description: 'breakout APIサーバーの稼働状態を確認',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'サーバー稼働中',
    },
  },
});

healthRoutes.openapi(healthRoute, async (c) => {
  return c.json(
    {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
    },
    200,
  );
});
