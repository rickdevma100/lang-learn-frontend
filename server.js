import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve KServe BentoML URL
const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
  process.env.API_URL || 
  'http://lang-learn-inference-predictor.lang-learn.svc.cluster.local';

console.log(`[Server] Starting frontend server on port ${PORT}`);
console.log(`[Server] Proxying API calls (/api/*) to: ${backendUrl}`);

// Proxy API requests
app.use(
  '/api',
  createProxyMiddleware({
    target: backendUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // Remove '/api' prefix when forwarding to BentoML
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[Proxy] Forwarding ${req.method} ${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[Proxy] Received status ${proxyRes.statusCode} from backend`);
    },
    onError: (err, req, res) => {
      console.error('[Proxy Error]', err);
      res.status(500).json({ error: 'Proxy failed to reach backend service', details: err.message });
    }
  })
);

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));

// Wildcard route to handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Server] Running successfully at http://localhost:${PORT}`);
});
