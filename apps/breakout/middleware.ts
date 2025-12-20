import { next } from '@vercel/edge';

/**
 * Vercel Edge Middleware - API認証のみ（純粋JS版）
 * @description /api/v1/* のみBasic認証を適用
 * @note Honoモジュールは Edge Runtime でサポートされないため純粋JSで実装
 */
export const config = {
  matcher: ['/api/v1/:path*'],
};

/**
 * Basic認証の検証
 */
const verifyCredentials = (authHeader: string | null): boolean => {
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }
  const base64Credentials = authHeader.slice(6);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(':');

  const validUsername = process.env.BASIC_AUTH_USERNAME ?? 'admin';
  const validPassword = process.env.BASIC_AUTH_PASSWORD ?? 'admin';

  return username === validUsername && password === validPassword;
};

/**
 * 401 Unauthorized レスポンス
 */
const unauthorizedResponse = (): Response => {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
};

/**
 * Vercel Edge Middleware エントリーポイント
 */
export default async function middleware(request: Request) {
  // Basic認証チェック
  const authHeader = request.headers.get('Authorization');
  if (!verifyCredentials(authHeader)) {
    return unauthorizedResponse();
  }

  // 認証成功なら元のリクエストを続行
  return next();
}
