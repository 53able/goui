import { hc } from 'hono/client';
import type { AppType } from '../../api';

/**
 * Basic認証用のクレデンシャルを生成
 * @param username - ユーザー名
 * @param password - パスワード
 * @returns Base64エンコードされたクレデンシャル
 */
const createBasicAuthHeader = (
  username: string,
  password: string,
): { Authorization: string } => ({
  Authorization: `Basic ${btoa(`${username}:${password}`)}`,
});

/**
 * APIクライアント設定
 */
const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';

/**
 * Hono RPCクライアント
 * @description Basic認証付きのAPIクライアント
 */
export const apiClient = hc<AppType>(API_BASE_URL, {
  headers: createBasicAuthHeader(DEFAULT_USERNAME, DEFAULT_PASSWORD),
});
