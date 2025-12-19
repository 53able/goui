import { Hono } from 'hono';
import { handle } from 'hono/vercel';

/**
 * Vercel Edge Functions用ハンドラー
 * @description シンプルなHonoアプリ（Edge Runtime）
 * @note Node.js Runtime ではタイムアウトするため Edge を使用
 */
export const config = {
  runtime: 'edge',
};

// シンプルなHonoアプリ
const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
});

export default handle(app);
