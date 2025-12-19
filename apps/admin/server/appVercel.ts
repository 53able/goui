import type { ApiError } from '@goui/shared';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { healthRoutes } from './routes/health';

/**
 * Vercel Functions向けのHonoアプリケーション（admin）
 * @description Vercel上では TS をバンドルして実行されるため、`.js` 拡張子importを避ける
 * @note ローカル開発/自己ホストは `app.ts` を使用
 */
const app = new OpenAPIHono<{ Variables: { requestId: string } }>();

app.use('*', requestId());
app.use('*', secureHeaders());

app.use('*', async (c: Context<{ Variables: { requestId: string } }>, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const reqId = c.get('requestId') ?? '-';
  console.log(`[${reqId}] ${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`);
});

app.use('*', cors());
app.use('*', prettyJSON());

app.route('/', healthRoutes);

app.doc('/api/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Admin API',
    version: '0.1.0',
    description: '管理画面用APIエンドポイント',
  },
  servers: [
    { url: 'http://localhost:3001', description: '開発環境' },
    { url: 'https://goui-admin.vercel.app', description: 'Vercel本番環境' },
  ],
});

app.notFound((c) => {
  const errorResponse: ApiError = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    requestId: c.get('requestId'),
    timestamp: new Date().toISOString(),
  };
  return c.json(errorResponse, 404);
});

app.onError((err, c) => {
  const requestId = c.get('requestId');
  const timestamp = new Date().toISOString();

  if (err instanceof HTTPException) {
    const errorResponse: ApiError = {
      success: false,
      error: { code: `HTTP_${err.status}`, message: err.message },
      requestId,
      timestamp,
    };
    return c.json(errorResponse, err.status);
  }

  if (err.name === 'ZodError' && 'issues' in err) {
    const zodError = err as {
      issues: Array<{ path: (string | number)[]; message: string }>;
    };
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'リクエストのバリデーションに失敗しました',
        details: {
          issues: zodError.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      requestId,
      timestamp,
    };
    return c.json(errorResponse, 400);
  }

  console.error(`[${requestId}] Unhandled error:`, err);
  const errorResponse: ApiError = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
    requestId,
    timestamp,
  };
  return c.json(errorResponse, 500);
});

export type AppType = typeof app;
export { app };
export default app;


