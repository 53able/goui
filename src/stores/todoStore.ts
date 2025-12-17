import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { CreateTodo, Todo, UpdateTodo } from '../../shared/schemas';

/**
 * TODOストアの状態インターフェース
 */
interface TodoStore {
  /** TODO一覧 */
  todos: Todo[];
  /** ローディング状態 */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** TODO一覧を取得 */
  getTodos: () => Todo[];
  /** TODOを追加 */
  addTodo: (todo: CreateTodo) => void;
  /** TODOを更新 */
  updateTodo: (id: string, updates: UpdateTodo) => void;
  /** TODOの完了状態をトグル */
  toggleTodo: (id: string) => void;
  /** TODOを削除 */
  deleteTodo: (id: string) => void;
  /** TODO一覧をセット */
  setTodos: (todos: Todo[]) => void;
  /** ローディング状態をセット */
  setLoading: (isLoading: boolean) => void;
  /** エラーをセット */
  setError: (error: string | null) => void;
  /** 完了済みTODOをすべて削除 */
  clearCompleted: () => void;
}

/**
 * TODO管理用Zustandストア
 */
export const useTodoStore = create<TodoStore>()(
  devtools(
    persist(
      (set, get) => ({
        todos: [],
        isLoading: false,
        error: null,

        getTodos: () => get().todos,

        addTodo: (item) => {
          const now = new Date();
          const newTodo: Todo = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({ todos: [...state.todos, newTodo] }));
        },

        updateTodo: (id, updates) => {
          set((state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id
                ? { ...todo, ...updates, updatedAt: new Date() }
                : todo,
            ),
          }));
        },

        toggleTodo: (id) => {
          set((state) => ({
            todos: state.todos.map((todo) =>
              todo.id === id
                ? { ...todo, completed: !todo.completed, updatedAt: new Date() }
                : todo,
            ),
          }));
        },

        deleteTodo: (id) => {
          set((state) => ({
            todos: state.todos.filter((todo) => todo.id !== id),
          }));
        },

        setTodos: (todos) => set({ todos }),

        setLoading: (isLoading) => set({ isLoading }),

        setError: (error) => set({ error }),

        clearCompleted: () => {
          set((state) => ({
            todos: state.todos.filter((todo) => !todo.completed),
          }));
        },
      }),
      { name: 'todo-store' },
    ),
    { name: 'todo-store' },
  ),
);
