import { next } from '@vercel/edge';
import { Hono } from 'hono';
import { basicAuth } from 'hono/basic-auth';

/**
 * Vercel Edge Middleware - Basic認証（Hono版）
 * @description アプリ全体にBasic認証を適用（静的ファイル含む）
 * @note Honoの basicAuth ミドルウェアを使用し、認証後は next() で続行
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
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

// 認証成功時は 200 を返す（この後 next() に切り替える）
authApp.all('*', (c) => c.text('ok'));

/**
 * Vercel Edge Middleware エントリーポイント
 */
export default async function middleware(request: Request) {
  const url = new URL(request.url);

  // ヘルスチェックは認証スキップ
  if (url.pathname === '/health') {
    return next();
  }

  // Hono で Basic 認証チェック
  const authResponse = await authApp.fetch(request);

  // 認証失敗（401）ならそのまま返す
  if (authResponse.status === 401) {
    return authResponse;
  }

  // 認証成功なら元のリクエストを続行
  return next();
}
