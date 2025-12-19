import { handle } from 'hono/vercel';
import app from '../server/app.js';

/**
 * Vercel Serverless Functions用ハンドラー（Node.js Runtime）
 * @description 全てのAPIリクエストをHonoアプリにルーティング
 * @note 認証は middleware.ts で全体適用済み
 */
export const config = {
  runtime: 'nodejs18.x',
  maxDuration: 30,
};

export default handle(app);
