import { next } from '@vercel/edge';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';

/**
 * Vercel Edge Middleware - API認証のみ（Hono版）
 * @description /api/v1/* のみBasic認証を適用
 */
export const config = {
  matcher: ['/api/v1/:path*'],
};

/**
 * 認証用Honoアプリ
 */
const authApp = new Hono();

authApp.use(
  '*',
  basicAuth({
    username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
    password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
  }),
);

// 認証成功時は 200 を返す
authApp.all('*', (c) => c.text('ok'));

/**
 * Vercel Edge Middleware エントリーポイント
 */
export default async function middleware(request: Request) {
  // Hono で Basic 認証チェック
  const authResponse = await authApp.fetch(request);

  // 認証失敗（401）ならそのまま返す
  if (authResponse.status === 401) {
    return authResponse;
  }

  // 認証成功なら元のリクエストを続行
  return next();
}
