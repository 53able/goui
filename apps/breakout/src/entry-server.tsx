import { createElement, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

/**
 * サーバーから注入される初期データの型定義
 */
interface InitialData {
  title: string;
  description: string;
  timestamp: string;
}

/**
 * 本番環境SSR用のレンダリング関数
 * @description Vite SSRビルドで使用されるエントリーポイント
 * @param _url - リクエストURL
 * @param _manifest - Vite SSRマニフェスト（アセット解決用）
 * @returns レンダリングされたHTML文字列と初期データ
 */
export const render = async (
  _url: string,
  _manifest: Record<string, string[]>,
) => {
  // URLに基づいて初期データを生成
  const initialData: InitialData = {
    title: 'Breakout Game',
    description: 'ブロック崩しゲーム',
    timestamp: new Date().toISOString(),
  };

  // Reactコンポーネントを文字列としてレンダリング
  const appHtml = renderToString(
    createElement(StrictMode, {}, createElement(App, { initialData })),
  );

  return { html: appHtml, initialData };
};
