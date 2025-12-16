import { z } from 'zod';

/**
 * ユーザーステータスの列挙型
 */
export const UserStatusSchema = z.enum(['active', 'inactive', 'pending']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

/**
 * ユーザースキーマ
 * @description システム内のユーザーを表現
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  status: UserStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

/**
 * ユーザー作成スキーマ（id, createdAt, updatedAtを除外）
 */
export const CreateUserSchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateUser = z.infer<typeof CreateUserSchema>;

/**
 * ユーザー更新スキーマ（部分更新可能）
 */
export const UpdateUserSchema = CreateUserSchema.partial();
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

/**
 * API共通レスポンススキーマ
 */
export const ApiErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * ページネーションスキーマ
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

/**
 * ページネーションメタ情報スキーマ
 */
export const PaginationMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
