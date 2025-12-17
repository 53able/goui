import type { FC } from 'react';
import { Tetris } from '@/components/admin/Tetris';
import { Toaster } from '@/components/ui/Toaster';

/**
 * メインアプリケーションコンポーネント
 */
export const App: FC = () => (
  <>
    <Tetris />
    <Toaster position="bottom-right" richColors />
  </>
);
