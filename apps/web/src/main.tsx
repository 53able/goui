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

// SSRされたHTMLがある場合（rootに子要素がある）はハイドレーション
// そうでない場合は通常のレンダリング
if (rootElement.hasChildNodes()) {
  console.log('🔄 Hydrating React app...');
  try {
    hydrateRoot(rootElement, appElement);
    console.log('✅ Hydration successful!');
  } catch (error) {
    console.error('❌ Hydration failed:', error);
    // ハイドレーション失敗時はcreateRootにフォールバック
    rootElement.innerHTML = '';
    createRoot(rootElement).render(appElement);
  }
} else {
  console.log('⚡ Rendering React app...');
  createRoot(rootElement).render(appElement);
}
