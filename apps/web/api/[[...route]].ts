import { handle } from 'hono/vercel';
import app from '../server/app.js';

/**
 * Vercel Edge Functions用ハンドラー
 * @description 全てのAPIリクエストをHonoアプリにルーティング
 * @note 認証は middleware.ts で全体適用済み
 */
export const config = {
  runtime: 'edge',
};

export default handle(app);
