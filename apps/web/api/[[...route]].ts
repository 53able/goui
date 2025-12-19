import { Hono } from 'hono';
import { handle } from 'hono/vercel';

/**
 * Vercel Serverless Functions用ハンドラー（Node.js Runtime）
 * @description テスト用シンプルHonoアプリ
 */
export const config = {
  runtime: 'edge',
};

// テスト用シンプルアプリ（basePath を使用）
const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0-test',
  });
});

app.get('/test', (c) => {
  return c.json({ message: 'Hello from Hono on Vercel!' });
});

export default handle(app);
