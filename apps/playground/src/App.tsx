import { cn } from '@goui/ui';
import type { FC } from 'react';
import { LifeGame } from './components/LifeGame';

/**
 * playground アプリケーションのルートコンポーネント
 * ライフゲームシミュレーター
 */
export const App: FC = () => {
  return (
    <div className={cn('min-h-screen bg-background')}>
      <LifeGame />
    </div>
  );
};
