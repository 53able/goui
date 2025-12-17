import {
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  ListFilter,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { type FC, type FormEvent, type KeyboardEvent, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';
import { useTodoStore } from '@/stores';
import type { Todo, TodoPriority } from '../../../shared/schemas';

/**
 * フィルター種別
 */
type FilterType = 'all' | 'active' | 'completed';

/**
 * ソート種別
 */
type SortType = 'priority' | 'createdAt';

/**
 * ソート順序
 */
type SortOrder = 'asc' | 'desc';

/**
 * 優先度に応じたスタイルを取得
 */
const getPriorityStyles = (priority: TodoPriority) => {
  const styles = {
    low: {
      badge:
        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      border: 'border-l-slate-400',
      label: '低',
      value: 1,
    },
    medium: {
      badge:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      border: 'border-l-amber-400',
      label: '中',
      value: 2,
    },
    high: {
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
      border: 'border-l-rose-500',
      label: '高',
      value: 3,
    },
  };
  return styles[priority];
};

/**
 * フィルターボタンコンポーネント
 */
const FilterButton: FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}> = ({ active, onClick, children, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5',
      active
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'bg-white dark:bg-slate-800/50 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800',
    )}
  >
    {children}
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full',
        active ? 'bg-primary-foreground/20' : 'bg-slate-200 dark:bg-slate-700',
      )}
    >
      {count}
    </span>
  </button>
);

/**
 * ソートボタンコンポーネント
 */
const SortButton: FC<{
  active: boolean;
  order: SortOrder;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, order, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5',
      active
        ? 'bg-secondary text-secondary-foreground'
        : 'bg-white dark:bg-slate-800/50 text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800',
    )}
  >
    {children}
    {active &&
      (order === 'asc' ? (
        <ArrowUpAZ className="w-3.5 h-3.5" />
      ) : (
        <ArrowDownAZ className="w-3.5 h-3.5" />
      ))}
  </button>
);

/**
 * TODOリストコンポーネント
 * @description タスク管理のためのTODOリスト画面（UX改善版）
 */
export const TodoList: FC = () => {
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompleted } =
    useTodoStore();
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [selectedPriority, setSelectedPriority] =
    useState<TodoPriority>('medium');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deleteTarget, setDeleteTarget] = useState<Todo | null>(null);

  const completedCount = todos.filter((t) => t.completed).length;
  const activeCount = todos.length - completedCount;

  /**
   * フィルタリングとソートを適用したTODOリスト
   */
  const filteredAndSortedTodos = todos
    .filter((todo) => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .toSorted((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'priority') {
        const priorityA = getPriorityStyles(a.priority).value;
        const priorityB = getPriorityStyles(b.priority).value;
        return (priorityB - priorityA) * multiplier;
      }
      // createdAt
      return (
        (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) *
        multiplier
      );
    });

  /**
   * ソート切り替えハンドラ
   */
  const handleSortChange = (newSortBy: SortType) => {
    if (sortBy === newSortBy) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  /**
   * TODOを追加するハンドラ
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim() === '') return;

    addTodo({
      title: newTodoTitle.trim(),
      completed: false,
      priority: selectedPriority,
    });
    setNewTodoTitle('');
    toast.success('タスクを追加しました', {
      description: newTodoTitle.trim(),
    });
  };

  /**
   * Enterキーで追加
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as unknown as FormEvent);
    }
  };

  /**
   * TODOの完了状態を切り替え
   */
  const handleToggle = (todo: Todo) => {
    toggleTodo(todo.id);
    if (!todo.completed) {
      toast.success('タスクを完了しました！', {
        description: todo.title,
      });
    }
  };

  /**
   * TODO削除を実行
   */
  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteTodo(deleteTarget.id);
    toast.success('タスクを削除しました', {
      description: deleteTarget.title,
    });
    setDeleteTarget(null);
  };

  /**
   * 完了済みを一括削除
   */
  const handleClearCompleted = () => {
    clearCompleted();
    toast.success(`${completedCount}件の完了済みタスクを削除しました`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
        {/* ヘッダー */}
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              TODO リスト
            </h1>
          </div>
          <p className="text-muted-foreground">
            タスクを整理して生産性を高めよう
          </p>
        </header>

        {/* 統計 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 text-center shadow-sm border border-border">
            <p className="text-3xl font-bold text-foreground">{todos.length}</p>
            <p className="text-sm text-muted-foreground">全タスク</p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 text-center shadow-sm border border-border">
            <p className="text-3xl font-bold text-amber-600">{activeCount}</p>
            <p className="text-sm text-muted-foreground">進行中</p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 text-center shadow-sm border border-border">
            <p className="text-3xl font-bold text-emerald-600">
              {completedCount}
            </p>
            <p className="text-sm text-muted-foreground">完了</p>
          </div>
        </div>

        {/* 入力フォーム */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-xl p-4 shadow-sm border border-border">
            <div className="flex gap-3 mb-3">
              <Input
                type="text"
                placeholder="新しいタスクを入力..."
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="submit" disabled={newTodoTitle.trim() === ''}>
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            </div>
            {/* 優先度選択 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">優先度:</span>
              {(['low', 'medium', 'high'] as const).map((p) => {
                const style = getPriorityStyles(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPriority(p)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-full transition-all',
                      style.badge,
                      selectedPriority === p
                        ? 'ring-2 ring-ring ring-offset-2'
                        : 'opacity-60 hover:opacity-100',
                    )}
                  >
                    {p === 'high' && <Flame className="w-3 h-3 inline mr-1" />}
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* フィルター＆ソート */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          {/* フィルター */}
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-muted-foreground" />
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              count={todos.length}
            >
              すべて
            </FilterButton>
            <FilterButton
              active={filter === 'active'}
              onClick={() => setFilter('active')}
              count={activeCount}
            >
              進行中
            </FilterButton>
            <FilterButton
              active={filter === 'completed'}
              onClick={() => setFilter('completed')}
              count={completedCount}
            >
              完了
            </FilterButton>
          </div>

          {/* ソート */}
          <div className="flex items-center gap-2">
            <SortButton
              active={sortBy === 'priority'}
              order={sortOrder}
              onClick={() => handleSortChange('priority')}
            >
              <Flame className="w-3.5 h-3.5" />
              優先度
            </SortButton>
            <SortButton
              active={sortBy === 'createdAt'}
              order={sortOrder}
              onClick={() => handleSortChange('createdAt')}
            >
              <Clock className="w-3.5 h-3.5" />
              日時
            </SortButton>
          </div>
        </div>

        {/* TODOリスト */}
        <div className="space-y-3">
          {filteredAndSortedTodos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Circle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">
                {filter === 'all'
                  ? 'タスクがありません'
                  : filter === 'active'
                    ? '進行中のタスクがありません'
                    : '完了したタスクがありません'}
              </p>
              <p className="text-sm">
                {filter === 'all'
                  ? '上のフォームから新しいタスクを追加しよう！'
                  : 'フィルターを変更してみてね'}
              </p>
            </div>
          ) : (
            filteredAndSortedTodos.map((todo) => {
              const priorityStyle = getPriorityStyles(todo.priority);
              return (
                <div
                  key={todo.id}
                  className={cn(
                    'group bg-white dark:bg-slate-800/50 rounded-xl p-4 shadow-sm border border-border border-l-4 transition-all hover:shadow-md',
                    priorityStyle.border,
                    todo.completed && 'opacity-60',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* チェックボタン */}
                    <button
                      type="button"
                      onClick={() => handleToggle(todo)}
                      className="shrink-0 transition-transform hover:scale-110"
                      aria-label={
                        todo.completed
                          ? 'タスクを未完了に戻す'
                          : 'タスクを完了にする'
                      }
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground hover:text-primary" />
                      )}
                    </button>

                    {/* タイトル */}
                    <span
                      className={cn(
                        'flex-1 text-foreground transition-all',
                        todo.completed && 'line-through text-muted-foreground',
                      )}
                    >
                      {todo.title}
                    </span>

                    {/* 優先度バッジ */}
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        priorityStyle.badge,
                      )}
                    >
                      {priorityStyle.label}
                    </span>

                    {/* 削除ボタン（確認ダイアログ付き） */}
                    <AlertDialog
                      open={deleteTarget?.id === todo.id}
                      onOpenChange={(open) => {
                        if (!open) setDeleteTarget(null);
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(todo)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="タスクを削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            タスクを削除しますか？
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            「{todo.title}
                            」を削除します。この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* フッター */}
        {completedCount > 0 && (
          <div className="mt-8 text-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-muted-foreground hover:text-destructive hover:border-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  完了済みを削除 ({completedCount}件)
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    完了済みタスクを削除しますか？
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {completedCount}件の完了済みタスクをすべて削除します。
                    この操作は取り消せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearCompleted}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};
