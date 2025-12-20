import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { OpenAPIHono } from '@hono/zod-openapi';
import { basicAuth } from 'hono/basic-auth';
import { app } from './app.js';

/**
 * SSRモジュールの型定義
 */
interface SSRModule {
  render: (initialData: {
    title: string;
    description: string;
    timestamp: string;
  }) => string;
  getInitialData: () => {
    title: string;
    description: string;
    timestamp: string;
  };
}

/**
 * 本番用SSRサーバー（VPS/セルフホスト用）
 * @description SSR + API、API部分にBasic認証を適用
 * @note Vercelデプロイでは使用しない
 */
const startProductionServer = async () => {
  const port = Number(process.env.PLAYGROUND_PORT) || 3002;
  const distPath = join(process.cwd(), 'dist');

  // SSRモジュールを読み込み
  let ssrModule: SSRModule;
  try {
    ssrModule = await import(join(distPath, 'server', 'entry-server.js'));
  } catch (error) {
    console.error('❌ SSRモジュールの読み込みに失敗しました');
    console.error('💡 `pnpm build` を実行してSSRバンドルを生成してください');
    console.error(error);
    process.exit(1);
  }

  // index.htmlテンプレートを読み込み
  let template: string;
  try {
    template = await readFile(join(distPath, 'index.html'), 'utf-8');
  } catch (error) {
    console.error('❌ index.htmlの読み込みに失敗しました');
    console.error('💡 `pnpm build` を実行してビルドしてください');
    console.error(error);
    process.exit(1);
  }

  const prodApp = new OpenAPIHono();

  // API部分にBasic認証を適用
  prodApp.use('/api/v1/*', async (c, next) => {
    const auth = basicAuth({
      username: process.env.BASIC_AUTH_USERNAME ?? 'admin',
      password: process.env.BASIC_AUTH_PASSWORD ?? 'admin',
    });
    return auth(c, next);
  });

  // APIルートをマウント
  prodApp.route('/', app);

  // 静的ファイル配信（Viteビルド出力）
  prodApp.use(
    '/*',
    serveStatic({
      root: './dist',
    }),
  );

  // SSRフォールバック（HTMLリクエストに対してSSRを実行）
  prodApp.get('*', async (c) => {
    try {
      // 初期データを生成
      const initialData = ssrModule.getInitialData();

      // SSRでReactコンポーネントをレンダリング
      const appHtml = ssrModule.render(initialData);

      // SSR用のHTML変換
      const html = template
        // titleを置換
        .replace(/<title>.*?<\/title>/, `<title>${initialData.title}</title>`)
        // meta descriptionを置換
        .replace(
          /<meta name="description" content=".*?".*?\/>/,
          `<meta name="description" content="${initialData.description}" />`,
        )
        // headの末尾に初期データを挿入
        .replace(
          '</head>',
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script></head>`,
        )
        // rootにSSR HTMLを挿入
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

      return c.html(html);
    } catch (error) {
      console.error('❌ SSR Error:', error);
      // エラー時はテンプレートをそのまま返す（CSRフォールバック）
      return c.html(template, 500);
    }
  });

  console.log('');
  console.log('🚀 Playground Production Server (Self-hosted) with SSR');
  console.log(`🌐 Application: http://localhost:${port}`);
  console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);
  console.log('🔐 API認証: /api/v1/* のみ');
  console.log('⚡ React SSR enabled');
  console.log('');

  serve(
    {
      fetch: prodApp.fetch,
      port,
    },
    (info) => {
      console.log(`✅ Server running at http://localhost:${info.port}`);
    },
  );
};

// サーバー起動
startProductionServer().catch((err) => {
  console.error('❌ Failed to start production server:', err);
  process.exit(1);
});
