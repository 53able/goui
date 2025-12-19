import { Hono } from 'hono';

/**
 * Vercel Functions向けのHonoアプリケーション（切り分け用）
 * @description まずは起動を最優先し、/api/debug/import で依存のimport可否をHTTPで確認する
 * @see https://hono.dev/docs/getting-started/vercel
 */
const createApp = () => {
  const app = new Hono();

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/health', (c) => c.json({ status: 'ok' }));

  app.get('/api/debug/import', async (c) => {
    const url = new URL(c.req.url);
    const target = url.searchParams.get('target');

    const allowedTargets = [
      '@goui/shared',
      '@hono/zod-openapi',
      'hono/secure-headers',
      './routes/health.js',
      './routes/users/index.js',
    ] as const;

    const isAllowed = (value: string): value is (typeof allowedTargets)[number] =>
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

  return app;
};

export default createApp();


