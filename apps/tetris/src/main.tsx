import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

/**
 * サーバーから注入された初期データの型定義
 */
interface InitialData {
  title: string;
  description: string;
  timestamp: string;
}

/**
 * グローバルな初期データを型安全に取得
 */
declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
  }
}

/**
 * アプリケーションのエントリーポイント
 * @description SSRされたHTMLがある場合はハイドレーション、ない場合は通常のレンダリング
 */
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// サーバーから注入された初期データを取得
const initialData = window.__INITIAL_DATA__ || {
  title: 'UI Sample Admin',
  description: 'エンタープライズ級管理画面のボイラープレート',
  timestamp: new Date().toISOString(),
};

const appElement = (
  <StrictMode>
    <App initialData={initialData} />
  </StrictMode>
);

/**
 * SSRされたHTMLが実際に存在するか判定
 * @description hasChildNodes() は空白やコメントも含むため、
 * 実際のElement子要素の存在を確認する
 */
const hasSSRContent = (): boolean => {
  // Element要素（空白やコメントを除く）が存在するかチェック
  const hasElementChildren = rootElement.children.length > 0;
  // または、サーバーから初期データが注入されているか
  const hasInitialData = typeof window.__INITIAL_DATA__ !== 'undefined';
  return hasElementChildren || hasInitialData;
};

// SSRされたHTMLがある場合はハイドレーション
// そうでない場合は通常のレンダリング（CSR）
if (hasSSRContent()) {
  console.log('🔄 Hydrating React app...');
  hydrateRoot(rootElement, appElement, {
    onRecoverableError: (error) => {
      console.error('⚠️ Hydration recoverable error:', error);
    },
  });
} else {
  console.log('⚡ Rendering React app (CSR)...');
  createRoot(rootElement).render(appElement);
}
