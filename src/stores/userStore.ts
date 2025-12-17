import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CreateUser, User } from '../../shared/schemas';

/**
 * ユーザーストアの状態インターフェース
 */
interface UserStore {
  /** ユーザー一覧 */
  users: User[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** ユーザー一覧を取得 */
  getUsers: () => User[];
  /** ユーザーを追加 */
  addUser: (user: CreateUser) => void;
  /** ユーザーを更新 */
  updateUser: (id: string, updates: Partial<User>) => void;
  /** ユーザーを削除 */
  deleteUser: (id: string) => void;
  /** ユーザー一覧をセット */
  setUsers: (users: User[]) => void;
  /** ローディング状態をセット */
  setLoading: (isLoading: boolean) => void;
  /** エラーをセット */
  setError: (error: string | null) => void;
}

/**
 * ユーザー管理用Zustandストア
 */
export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      users: [],
      isLoading: false,
      error: null,

      getUsers: () => get().users,

      addUser: (item) => {
        const now = new Date();
        const newUser: User = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ users: [...state.users, newUser] }));
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id
              ? { ...user, ...updates, updatedAt: new Date() }
              : user,
          ),
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },

      setUsers: (users) => set({ users }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),
    }),
    { name: 'user-store' },
  ),
);


