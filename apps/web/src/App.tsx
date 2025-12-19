import { Toaster } from '@goui/ui';
import type { FC } from 'react';
import { Tetris } from '@/components/admin/Tetris';

/**
 * メインアプリケーションコンポーネント
 */
export const App: FC = () => (
  <>
    <Tetris />
    <Toaster position="bottom-right" richColors />
  </>
);
