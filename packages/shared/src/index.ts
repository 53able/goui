/**
 * @goui/shared - 共有スキーマ・型定義パッケージ
 * @description フロントエンド/バックエンド両方から参照される型の単一ソース
 */
export {
  // 共通エラー・レスポンス
  type ApiError,
  ApiErrorSchema,
  // User関連
  type CreateUser,
  CreateUserSchema,
  createApiSuccessSchema,
  type HealthResponse,
  HealthResponseSchema,
  // Pagination
  type PaginationMeta,
  PaginationMetaSchema,
  type User,
  UserSchema,
  type UserStatus,
  UserStatusSchema,
} from './schemas.js';
