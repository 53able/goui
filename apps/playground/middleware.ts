import { next } from '@vercel/edge';

/**
 * Vercel Edge Middleware - API認証のみ
 * @description /api/v1/* のみBasic認証を適用
 */
export const config = {
  matcher: ['/api/v1/:path*'],
};

/**
 * Basic認証のクレデンシャルを検証
 */
const verifyCredentials = (authHeader: string | null): boolean => {
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = atob(base64Credentials);
  const [username, password] = credentials.split(':');

  const expectedUsername = process.env.BASIC_AUTH_USERNAME ?? 'admin';
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD ?? 'admin';

  return username === expectedUsername && password === expectedPassword;
};

/**
 * 401 Unauthorized レスポンスを返す
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
