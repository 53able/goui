import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * breakout アプリケーションの Vite 設定
 * @description SSRビルド対応
 */
export default defineConfig({
  plugins: [
    react({
      // SSR環境でのFast Refresh preambleエラーを回避
      jsxRuntime: 'automatic',
      // モノレポ内の共有パッケージではpreambleチェックをスキップ
      include: /\.(tsx?|jsx?)$/,
      exclude: /node_modules/,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  // ⬇️ SSR設定（重要！）
  ssr: {
    noExternal: [],
    // react と react-dom はNode.jsネイティブで処理
    external: ['react', 'react-dom'],
  },
  build: {
    manifest: true, // マニフェストを生成（SSRでアセットパスを取得するため）
    ssrManifest: true, // SSR用マニフェストを生成
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined, // SSRではチャンク分割を無効化
      },
    },
  },
});
