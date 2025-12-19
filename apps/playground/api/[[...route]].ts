import { handle } from 'hono/vercel';
import app from '../server/app.js';

/**
 * Vercel Serverless Functions用ハンドラー
 * @description 全てのリクエストをHonoアプリにルーティング
 * @note 認証は middleware.ts で適用
 */
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

export default handle(app);
