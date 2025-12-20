import { Hono } from 'hono';

/**
 * Vercel Functions向けのHonoアプリケーション（軽量版）
 * @description Edge Runtime の制約により、最小限の実装
 * @note モノレポのワークスペースパッケージ(@goui/*)はVercel Functionsで解決できないため使用しない
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

  return app;
};

export default createApp();
