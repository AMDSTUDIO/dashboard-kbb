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

async function requestHandler(req, res) {
  // 1. Handle /api/* endpoints for centralized account, activity log & WhatsApp Server
  const handled = await handleApiRequest(req, res);
  if (handled) return;

  // 2. Serve built static files from dist/
  const cleanUrl = (req.url || '/').split('?')[0];
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
    res.end('Build folder (dist/) not found. Please run "npm run build" first.');
  }
}

function tryListenOnPort(port, isPrimary = false) {
  const srv = http.createServer(requestHandler);
  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (isPrimary) {
        console.log(`[Info] Port ${port} sedang digunakan oleh web server lain (mis. Nginx/Apache). API Server tetap aktif pada port cadangan.`);
      }
    } else {
      console.error(`Server error on port ${port}:`, err.message);
    }
  });
  srv.listen(port, '0.0.0.0', () => {
    console.log(`✅ Dashboard KBB & WhatsApp Server aktif di http://0.0.0.0:${port}`);
  });
}

const primaryPort = Number(process.env.PORT) || 8090;
const candidatePorts = Array.from(new Set([primaryPort, 3001, 4173]));

candidatePorts.forEach((port, idx) => {
  tryListenOnPort(port, idx === 0);
});
