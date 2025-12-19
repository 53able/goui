/**
 * Vercel Functions エントリポイント
 * @description Node.js Serverless Functions (req,res) を Hono (fetch) にブリッジする
 * @note 認証は middleware.ts（Edge Middleware）で適用
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import app from '../server/appVercel';

type NodeReq = IncomingMessage;
type NodeRes = ServerResponse<IncomingMessage>;

const toUrl = (req: NodeReq) => {
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader ?? 'https';

  const hostHeader = req.headers['x-forwarded-host'] ?? req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader ?? 'localhost';

  const path = req.url ?? '/';
  return new URL(path, `${proto}://${host}`);
};

const toHeaders = (req: NodeReq) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    }
  }
  return headers;
};

const readBody = async (req: NodeReq) => {
  const method = req.method ?? 'GET';
  if (method === 'GET' || method === 'HEAD') {
    return undefined;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk);
    chunks.push(buf);
  }
  const body = Buffer.concat(chunks);
  return body.length > 0 ? body : undefined;
};

export default async (req: NodeReq, res: NodeRes) => {
  try {
    const url = toUrl(req);
    const headers = toHeaders(req);
    const body = await readBody(req);

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
    });

    const response = await app.fetch(request);
    res.statusCode = response.status;

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const arrayBuffer = await response.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: false,
        name: error.name,
        message: error.message,
        stack: error.stack,
      }),
    );
  }
};
