import { serve } from '@hono/node-server';
import { app } from './index';

/**
 * APIサーバー起動設定
 */
const port = Number(process.env.API_PORT) || 3000;

console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📖 Swagger UI: http://localhost:${port}/api/ui`);
console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/doc`);

serve({
  fetch: app.fetch,
  port,
});
