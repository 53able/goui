import { cn } from '@goui/ui';
import type { FC } from 'react';
import { Breakout } from './components/Breakout';

/**
 * 初期データの型定義
 */
interface InitialData {
  title: string;
  description: string;
  timestamp: string;
}

/**
 * Appコンポーネントのプロパティ
 */
interface AppProps {
  initialData?: InitialData;
}

/**
 * 🎄 Christmas Breakout - アプリケーションのルートコンポーネント
 * @description 雪降る聖夜にプレゼントを届けよう！
 */
export const App: FC<AppProps> = ({ initialData }) => {
  return (
    <div
      className={cn(
        // Pancake Stack: Header(auto) + Main(1fr) + Footer(auto)
        'h-svh bg-background text-foreground',
        'grid grid-rows-[auto_1fr_auto]',
        // Safe Area対応
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        'px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]',
      )}
    >
      {/* ヘッダー（クリスマス装飾）🎄 */}
      <header className="py-2 sm:py-3 text-center relative overflow-hidden">
        <h1 className="text-xl sm:text-2xl font-bold text-primary drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
          <span className="text-red-500">🎄</span>
          {' '}
          {initialData?.title || 'Christmas Breakout'}
          {' '}
          <span className="text-green-500">🎄</span>
        </h1>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          ❄️ 聖夜のプレゼント大作戦 ❄️
        </p>
      </header>

      {/* メインコンテンツ（フルエリア） */}
      <main className="flex justify-center items-start overflow-hidden w-full">
        <Breakout />
      </main>

      {/* フッター 🎅 */}
      <footer className="py-2 text-center text-xs text-muted-foreground">
        <span className="sm:hidden">
          🛷 スワイプでソリ操作 • タップでスタート
        </span>
        <span className="hidden sm:inline">
          🛷 ← → キーでソリ操作 • スペースでスタート
        </span>
      </footer>
    </div>
  );
};
