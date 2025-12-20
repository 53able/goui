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
 * breakout アプリケーションのルートコンポーネント
 * @description Pancake Stack パターンでフルスクリーンレイアウト
 */
export const App: FC<AppProps> = ({ initialData }) => {
  return (
    <div
      className={cn(
        // Pancake Stack: Header(auto) + Main(1fr) + Footer(auto)
        'min-h-svh bg-background text-foreground',
        'grid grid-rows-[auto_1fr_auto]',
        // Safe Area対応
        'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
        'px-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]',
      )}
    >
      {/* ヘッダー（コンパクト） */}
      <header className="py-2 sm:py-3 text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-primary drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
          {initialData?.title || 'Breakout'}
        </h1>
      </header>

      {/* メインコンテンツ（フルエリア） */}
      <main className="grid place-items-center overflow-hidden">
        <Breakout />
      </main>

      {/* フッター */}
      <footer className="py-2 text-center text-xs text-muted-foreground">
        <span className="sm:hidden">
          スワイプでパドル操作 • タップでスタート
        </span>
        <span className="hidden sm:inline">
          ← → キーでパドル操作 • スペースでスタート
        </span>
      </footer>
    </div>
  );
};
