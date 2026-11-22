import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Legacy / single-tenant fallback URL
const legacyBackendUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://lang-learn-inference-predictor.lang-learn.svc.cluster.local';

// Multi-tenant silo routing (Plan 1: local lang-learn-api + shared platform inference)
const schoolApiUrl = process.env.SCHOOL_API_URL || legacyBackendUrl;
const sharedInferenceUrl = process.env.INFERENCE_API_URL || schoolApiUrl;
const tenantNamespace = process.env.TENANT_NAMESPACE || 'lang-learn';

// LLM/streaming paths routed to shared central inference when INFERENCE_API_URL is distinct
const SHARED_LLM_PATHS = new Set([
  '/scenario_dialogue',
  '/scenario_dialogue_stream',
  '/explain_word',
  '/explain_word_stream',
  '/practice_check',
  '/stt',
]);

export function resolveApiTarget(reqUrl) {
  const pathOnly = (reqUrl || '/').split('?')[0];
  const normalized = pathOnly.startsWith('/api') ? pathOnly.slice(4) || '/' : pathOnly;
  if (SHARED_LLM_PATHS.has(normalized) && process.env.INFERENCE_API_URL) {
    return sharedInferenceUrl;
  }
  return schoolApiUrl;
}

console.log(`[Server] Starting frontend server on port ${PORT} (tenant=${tenantNamespace})`);
console.log(`[Server] School Core API (/api/*): ${schoolApiUrl}`);
console.log(`[Server] Shared LLM Inference API: ${sharedInferenceUrl}`);

// Proxy API requests (supports SSE streaming)
app.use(
  '/api',
  createProxyMiddleware({
    target: schoolApiUrl,
    router: (req) => resolveApiTarget(req.url),
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // Remove '/api' prefix when forwarding to backend service
    },
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-Tenant-Namespace', tenantNamespace);
        console.log(`[Proxy] Forwarding ${req.method} ${req.url} -> ${resolveApiTarget(req.url)}`);
      },
      proxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy] Received status ${proxyRes.statusCode} from backend`);
        const contentType = proxyRes.headers['content-type'] || '';
        if (contentType.includes('text/event-stream') || contentType.includes('text/plain')) {
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('X-Accel-Buffering', 'no');
          proxyRes.headers['cache-control'] = 'no-cache';
          proxyRes.headers['connection'] = 'keep-alive';
        }
      },
      error: (err, req, res) => {
        console.error('[Proxy Error]', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Proxy failed to reach backend service', details: err.message });
        }
      },
    },
  })
);

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));

// Wildcard route to handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Running successfully at http://localhost:${PORT}`);
  });
}
