import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

/**
 * ヘルスチェック用ルーター
 */
export const healthRoutes = new OpenAPIHono();

/**
 * ヘルスチェックレスポンススキーマ
 */
const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
});

/**
 * ヘルスチェックルート定義
 */
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'ヘルスチェック',
  description: 'APIサーバーの稼働状態を確認',
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

healthRoutes.openapi(healthRoute, (c) => {
  return c.json(
    {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    },
    200,
  );
});
