/**
 * Vercel Functions エントリポイント
 * @description Hono公式のVercel向け手順に従い、Honoアプリを default export する
 * @see https://hono.dev/docs/getting-started/vercel
 * @note 認証は middleware.ts（Edge Middleware）で適用
 */
export { default } from '../server/app';
