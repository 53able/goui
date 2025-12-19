import { handle } from 'hono/vercel';
import app from '../server/app.js';

/**
 * Vercel Edge Functions用ハンドラー
 * @description 全てのリクエストをHonoアプリにルーティング
 * @note 認証は middleware.ts で適用
 */
export const config = {
  runtime: 'edge',
};

export default handle(app);
