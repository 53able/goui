import { Button, cn } from '@goui/ui';
import type { FC } from 'react';

/**
 * 管理画面メインコンポーネント
 */
export const App: FC = () => {
  return (
    <div className={cn('min-h-screen bg-background p-8')}>
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-4">
        @goui/ui パッケージのコンポーネントを使用しています
      </p>
      <Button onClick={() => alert('Hello from Admin!')}>クリックしてね</Button>
    </div>
  );
};
