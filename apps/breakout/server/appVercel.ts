import * as shared from '@goui/shared';
import { Hono } from 'hono';

/**
 * Vercel Functions向けのHonoアプリケーション（軽量版）
 * @description Edge Runtime の制約により、最小限の実装
 * @see https://hono.dev/docs/getting-started/vercel
 */
const createApp = () => {
  const app = new Hono();

  // ヘルスチェック
  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  // デバッグ用: 依存関係のimport確認
  app.get('/api/debug/import', async (c) => {
    const url = new URL(c.req.url);
    const target = url.searchParams.get('target');

    const allowedTargets = [
      '@goui/shared',
      '@hono/zod-openapi',
      'hono/secure-headers',
      './routes/health.js',
    ] as const;

    const isAllowed = (
      value: string,
    ): value is (typeof allowedTargets)[number] =>
      (allowedTargets as readonly string[]).includes(value);

    if (!target || !isAllowed(target)) {
      return c.json(
        {
          ok: false,
          error: 'invalid_target',
          allowedTargets,
        },
        400,
      );
    }

    try {
      const imported = await import(target);
      const keys = Object.keys(imported as Record<string, unknown>);
      return c.json({ ok: true, target, keys });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      return c.json(
        {
          ok: false,
          target,
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        500,
      );
    }
  });

  // デバッグ用: 静的インポート確認
  app.get('/api/debug/static', (c) => {
    const keys = Object.keys(shared as Record<string, unknown>);
    return c.json({ ok: true, keys });
  });

  return app;
};

export default createApp();
