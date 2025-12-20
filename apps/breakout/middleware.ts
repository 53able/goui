import { next } from '@vercel/edge';

/**
 * Vercel Edge Middleware
 * @description Basic認証は無効化済み - すべてのリクエストを通過させる
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

/**
 * Vercel Edge Middleware エントリーポイント
 * @description 現在は認証なしで全リクエストを許可
 */
export default async function middleware(_request: Request) {
  return next();
}
