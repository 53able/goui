/**
 * Vercel Functions エントリポイント
 * @description Hono公式推奨のゼロコンフィグデプロイ
 * @see https://hono.dev/docs/getting-started/vercel
 * @note 認証は middleware.ts（Edge Middleware）で適用
 */
import app from '../server/appVercel.js';

export default app;
