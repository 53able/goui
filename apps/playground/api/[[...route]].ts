import { handle } from 'hono/vercel';
import app from '../server/app';

/**
 * Vercel Functions用ハンドラー（Node.js Runtime）
 * @description 全てのAPIリクエストをHonoアプリにルーティング
 * @note 認証は middleware.ts（Edge Middleware）で適用
 */
export default handle(app);
