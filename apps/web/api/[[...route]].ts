import { Hono } from 'hono';
import { handle } from 'hono/vercel';

/**
 * Vercel Functions用ハンドラー
 * @description シンプルなインラインHonoアプリ（デフォルトランタイム）
 */

// インラインでシンプルなHonoアプリを定義
const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0-default',
  });
});

app.get('/test', (c) => {
  return c.json({ message: 'Hello from Hono on Vercel!' });
});

export default handle(app);
