import {
  CreateUserSchema,
  PaginationMetaSchema,
  UserSchema,
} from '@goui/shared';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

/**
 * ユーザー管理ルーター
 */
export const userRoutes = new OpenAPIHono();

/**
 * インメモリユーザーストア（開発用）
 */
const users: z.infer<typeof UserSchema>[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '山田 太郎',
    email: 'yamada@example.com',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '鈴木 花子',
    email: 'suzuki@example.com',
    status: 'active',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: '佐藤 一郎',
    email: 'sato@example.com',
    status: 'pending',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
];

// ============ ルート定義 ============

/**
 * ユーザー一覧取得ルート
 */
const listUsersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Users'],
  summary: 'ユーザー一覧取得',
  description: 'ページネーション付きでユーザー一覧を取得',
  request: {
    query: z.object({
      page: z.coerce.number().int().positive().default(1).optional(),
      limit: z.coerce.number().int().positive().max(100).default(20).optional(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(UserSchema),
            meta: PaginationMetaSchema,
          }),
        },
      },
      description: 'ユーザー一覧',
    },
  },
});

/**
 * ユーザー作成ルート
 */
const createUserRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Users'],
  summary: 'ユーザー作成',
  description: '新規ユーザーを作成',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
      description: '作成されたユーザー',
    },
  },
});

/**
 * ユーザー取得ルート
 */
const getUserRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Users'],
  summary: 'ユーザー取得',
  description: 'IDでユーザーを取得',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserSchema,
        },
      },
      description: 'ユーザー情報',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
      description: 'ユーザーが見つからない',
    },
  },
});

// ============ ハンドラー実装 ============

userRoutes.openapi(listUsersRoute, async (c) => {
  const { page = 1, limit = 20 } = c.req.valid('query');
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedUsers = users.slice(start, end);

  return c.json(
    {
      data: paginatedUsers,
      meta: {
        total: users.length,
        page,
        limit,
        totalPages: Math.ceil(users.length / limit),
      },
    },
    200,
  );
});

userRoutes.openapi(createUserRoute, async (c) => {
  const body = c.req.valid('json');
  const now = new Date();
  const newUser = {
    ...body,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  users.push(newUser);

  return c.json(newUser, 201);
});

userRoutes.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param');
  const user = users.find((u) => u.id === id);

  if (!user) {
    return c.json({ message: 'ユーザーが見つかりません' }, 404);
  }

  return c.json(user, 200);
});
