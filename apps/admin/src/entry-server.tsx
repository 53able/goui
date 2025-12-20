import { createElement, StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

/**
 * 初期データの型定義
 */
interface InitialData {
  title: string;
  description: string;
  timestamp: string;
}

/**
 * サーバーサイドレンダリング関数
 * @description 本番環境でAppコンポーネントをHTMLにレンダリング
 */
export const render = (initialData: InitialData): string => {
  return renderToString(
    createElement(StrictMode, {}, createElement(App, { initialData })),
  );
};

/**
 * デフォルトの初期データを生成
 */
export const getInitialData = (): InitialData => ({
  title: 'Admin Dashboard',
  description: '管理画面ダッシュボード',
  timestamp: new Date().toISOString(),
});
