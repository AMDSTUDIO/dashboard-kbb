import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './server/apiHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

async function requestHandler(req, res) {
  applySecurityHeaders(res);

  // 1. Handle /api/* endpoints for centralized account, activity log & WhatsApp Server
  const handled = await handleApiRequest(req, res);
  if (handled) return;

  // 2. Block hidden or sensitive files from direct probing (Shodan / scanners)
  const cleanUrl = decodeURIComponent((req.url || '/').split('?')[0]);
  if (
    cleanUrl.includes('..') ||
    /\/\.(env|git|svn|htaccess|user\.ini)/i.test(cleanUrl) ||
    /^\/(server|package\.json|package-lock\.json|vite\.config\.js)/i.test(cleanUrl)
  ) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // 3. Serve built static files from dist/
  let filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);

  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.statusCode = 404;
    res.end('Not Found');
  }
}

function tryListenOnPort(port, isPrimary = false) {
  const srv = http.createServer(requestHandler);
  // Primary port (8090) listens on 0.0.0.0 if not behind Nginx;
  // Fallback internal proxy ports (3001, 4173) bind ONLY to 127.0.0.1 so Shodan cannot scan them externally
  const bindHost = isPrimary ? (process.env.HOST || '0.0.0.0') : (process.env.API_HOST || '127.0.0.1');

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (isPrimary) {
        console.log(`[Info] Port ${port} sedang digunakan oleh web server depan (Nginx). API Server dikunci aman pada localhost (127.0.0.1).`);
      }
    } else {
      console.error(`Server error on port ${port}:`, err.message);
    }
  });
  srv.listen(port, bindHost, () => {
    console.log(`✅ Dashboard KBB & WhatsApp Server aktif di http://${bindHost}:${port}`);
  });
}

const primaryPort = Number(process.env.PORT) || 8090;
const candidatePorts = Array.from(new Set([primaryPort, 3001, 4173]));

candidatePorts.forEach((port, idx) => {
  tryListenOnPort(port, idx === 0);
});
