import { Hono } from 'hono';
import { handle } from 'hono/vercel';

/**
 * Vercel Serverless Functions用ハンドラー
 * @description シンプルなインラインHonoアプリ（Node.js Runtime テスト）
 */
export const config = {
  runtime: 'nodejs18.x',
  maxDuration: 30,
};

// インラインでシンプルなHonoアプリを定義
const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0-nodejs18x',
  });
});

app.get('/test', (c) => {
  return c.json({ message: 'Hello from Hono on Node.js 18.x!' });
});

export default handle(app);
