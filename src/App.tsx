import type { FC } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * メインアプリケーションコンポーネント
 */
export const App: FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">UI Sample Admin</h1>
        <p className="text-muted-foreground">
          React 19 + shadcn/ui + Hono で構築された管理画面ボイラープレート
        </p>
        <div className="flex gap-4 justify-center">
          <Button>はじめる</Button>
          <Button variant="outline">ドキュメント</Button>
        </div>
      </div>
    </div>
  );
};
