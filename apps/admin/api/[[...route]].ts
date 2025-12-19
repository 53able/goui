import { handle } from 'hono/vercel';
import app from '../server/app.js';

/**
 * Vercel Serverless Functions用ハンドラー（Node.js Runtime）
 * @description 全てのリクエストをHonoアプリにルーティング
 * @note 認証は middleware.ts で全体適用済み
 * @note Edge Runtime では @goui/shared 等がサポートされないため nodejs を使用
 */
export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};

export default handle(app);
