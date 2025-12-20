import type { ApiError } from '@goui/shared';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { prettyJSON } from 'hono/pretty-json';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { healthRoutes } from './routes/health.js';

/**
 * リクエストID付きHono Context型
 */
type Variables = {
  requestId: string;
};

/**
 * Honoアプリケーションインスタンス（APIルートのみ）
 * @description SSRロジックはdev.tsとproduction.tsで管理
 */
const app = new OpenAPIHono<{ Variables: Variables }>();

// ============ ミドルウェア設定 ============

// リクエストID（トレーサビリティ向上）
app.use('*', requestId());

// セキュリティヘッダー
app.use('*', secureHeaders());

// ロギング（リクエストIDを含む）
app.use('*', async (c: Context<{ Variables: Variables }>, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const reqId = c.get('requestId') ?? '-';
  console.log(
    `[${reqId}] ${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`,
  );
});

// CORS
app.use('*', cors());

// Pretty JSON（開発時の可読性向上）
app.use('/api/*', prettyJSON());

// ============ API ルート登録 ============

app.route('/api', healthRoutes);

// ============ OpenAPI仕様 ============

app.doc('/api/doc', {
  openapi: '3.1.0',
  info: {
    title: 'Playground API',
    version: '0.1.0',
    description: 'ライフゲームシミュレーター API',
  },
  servers: [
    {
      url: 'http://localhost:3002',
      description: '開発環境',
    },
    {
      url: 'https://goui-playground.vercel.app',
      description: 'Vercel本番環境',
    },
  ],
});

// ============ エラーハンドリング ============

/**
 * 404 Not Found ハンドラー（API専用）
 */
app.notFound((c) => {
  // APIルートの場合のみJSONエラーを返す
  if (c.req.path.startsWith('/api/')) {
    const errorResponse: ApiError = {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${c.req.method} ${c.req.path} is not found`,
      },
      requestId: c.get('requestId'),
      timestamp: new Date().toISOString(),
    };
    return c.json(errorResponse, 404);
  }

  // 非APIルートは上位でハンドリング（SSRサーバー側）
  throw new HTTPException(404, { message: 'Page not found' });
});

/**
 * エラーハンドラー
 */
app.onError((err, c) => {
  const reqId = c.get('requestId') ?? '-';
  console.error(`[${reqId}] Error:`, err);

  if (err instanceof HTTPException) {
    if (c.req.path.startsWith('/api/')) {
      const errorResponse: ApiError = {
        success: false,
        error: {
          code: 'HTTP_ERROR',
          message: err.message,
        },
        requestId: reqId,
        timestamp: new Date().toISOString(),
      };
      return c.json(errorResponse, err.status);
    }
  }

  // APIルート以外のエラーは上位でハンドリング
  throw err;
});

/**
 * APIルートのみをエクスポート（dev.tsで使用）
 */
export const apiRoutes = healthRoutes;

/**
 * 完全なアプリケーション（production.tsで使用）
 */
export { app };
