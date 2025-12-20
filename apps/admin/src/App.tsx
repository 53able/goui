import { Button, cn } from '@goui/ui';
import type { FC } from 'react';

/**
 * 初期データの型定義
 */
interface InitialData {
  title: string;
  description: string;
  timestamp: string;
}

/**
 * App コンポーネントの Props
 */
interface AppProps {
  initialData?: InitialData;
}

/**
 * 管理画面メインコンポーネント
 * @description サーバーサイドレンダリング対応
 */
export const App: FC<AppProps> = ({ initialData }) => {
  return (
    <div className={cn('min-h-screen bg-background p-8')}>
      {/* SSRデバッグ情報（開発環境のみ表示） */}
      {process.env.NODE_ENV === 'development' && initialData && (
        <div className="fixed top-0 right-0 m-4 p-4 bg-black/80 text-white text-xs rounded shadow-lg max-w-xs z-50">
          <div className="font-bold mb-2">🚀 SSR Debug Info</div>
          <div>Title: {initialData.title}</div>
          <div>
            Rendered: {new Date(initialData.timestamp).toLocaleString()}
          </div>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-4">
        @goui/ui パッケージのコンポーネントを使用しています
      </p>
      <Button onClick={() => alert('Hello from Admin!')}>クリックしてね</Button>
    </div>
  );
};
