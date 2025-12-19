import { Hono } from 'hono';
import { handle } from 'hono/vercel';

/**
 * Vercel Serverless Functions用ハンドラー（Node.js Runtime）
 * @description テスト用シンプルHonoアプリ
 */
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

// テスト用シンプルアプリ
const app = new Hono();

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0-test',
  });
});

app.get('/api/test', (c) => {
  return c.json({ message: 'Hello from Hono on Vercel!' });
});

export default handle(app);
