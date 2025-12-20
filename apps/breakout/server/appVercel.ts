import * as shared from '@goui/shared';
import { Hono } from 'hono';

/**
 * Vercel Functions向けのHonoアプリケーション（軽量版）
 * @description Node.js Serverless Functions として動作
 * @see https://hono.dev/docs/getting-started/vercel
 */
const createApp = () => {
  const app = new Hono();

  // ヘルスチェック
  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  // API情報
  app.get('/api/info', (c) =>
    c.json({
      name: 'Breakout API',
      version: '1.0.0',
      environment: process.env.VERCEL_ENV ?? 'unknown',
    }),
  );

  // デバッグ用: @goui/shared のインポート確認
  app.get('/api/debug/static', (c) => {
    const keys = Object.keys(shared as Record<string, unknown>);
    return c.json({ ok: true, keys });
  });

  return app;
};

export default createApp();
