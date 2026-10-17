import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  registerDbHandlers,
  getWaStatus,
  saveWaConfig,
  startWaServerSocket,
  disconnectWaServerSocket,
  sendWhatsAppMessage,
  sendRegistrationNotifications,
  sendApprovalNotification,
  sendRejectionNotification,
  processIncomingWaCommand
} from './waService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveWritableDataDir() {
  const preferred = path.join(__dirname, 'data');
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true, mode: 0o700 });
    }
    const testDir = path.join(preferred, '.perm-check');
    fs.mkdirSync(testDir, { recursive: true, mode: 0o700 });
    fs.rmSync(testDir, { recursive: true, force: true });
    return preferred;
  } catch {
    const fallback = path.join(os.tmpdir(), 'dashboard-kbb-data');
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true, mode: 0o700 });
    }
    return fallback;
  }
}

const DATA_DIR = resolveWritableDataDir();
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_LOGS = 500;
const APP_CLIENT_KEY = 'kbb-bkpsdm-internal-2026';

// In-memory IP rate limiter to prevent brute-force & Shodan/automated scanner abuse
const rateLimitStore = new Map();

function checkRateLimit(ip, bucket = 'api', maxRequests = 90, windowMs = 60000) {
  const now = Date.now();
  const key = `${bucket}:${ip || 'unknown'}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.start > windowMs) {
    rateLimitStore.set(key, { count: 1, start: now });
    return true;
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return false;
  }
  return true;
}

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      logs: [],
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), { encoding: 'utf-8', mode: 0o600 });
  }
}

export function readDb() {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch (err) {
    console.error('Failed to read server db.json:', err);
    return { users: [], logs: [], updatedAt: new Date().toISOString() };
  }
}

export function writeDb(data) {
  try {
    ensureDbFile();
    const payload = {
      users: Array.isArray(data.users) ? data.users : [],
      logs: Array.isArray(data.logs) ? data.logs.slice(0, MAX_LOGS) : [],
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), { encoding: 'utf-8', mode: 0o600 });
    return payload;
  } catch (err) {
    console.error('Failed to write server db.json:', err);
    return data;
  }
}

// Register DB handlers with waService so 2-way WhatsApp Bot commands (ACC / TOLAK) can update DB directly
registerDbHandlers({ readDb, writeDb });

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = String(forwarded).split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers['x-real-ip'] || req.headers['cf-connecting-ip'];
  if (realIp) return String(realIp).trim();
  const remote = req.socket?.remoteAddress || '';
  return remote.replace(/^::ffff:/, '') || '';
}

function getRequestOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    let aborted = false;
    const maxBytes = 2 * 1024 * 1024; // 2 MB max payload

    req.on('data', (chunk) => {
      if (aborted) return;
      body += chunk.toString();
      if (body.length > maxBytes) {
        aborted = true;
        resolve({});
      }
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, payload, reqOrigin = '*') {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Access-Control-Allow-Origin', reqOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-KBB-App-Key, X-KBB-Actor-Id, X-KBB-Actor-Role'
  );
  res.end(JSON.stringify(payload));
}

function isAuthorizedSuperadmin(req, dbUsers = []) {
  const actorId = req.headers['x-kbb-actor-id'] || '';
  const actorRole = req.headers['x-kbb-actor-role'] || '';
  const approvedSuperadmins = dbUsers.filter(
    (u) => (u.isSuperAdmin || u.role === 'Superadmin') && u.status !== 'PENDING'
  );
  // If no Superadmin has been synced to server DB yet, allow initial Superadmin session
  if (approvedSuperadmins.length === 0) {
    return true;
  }
  if (actorId && approvedSuperadmins.some((u) => u.id === actorId)) {
    return true;
  }
  return actorRole === 'Superadmin';
}

/**
 * Node HTTP / Connect / Vite middleware for `/api/*`
 */
export async function handleApiRequest(req, res, next) {
  const url = req.url ? req.url.split('?')[0] : '';
  if (!url.startsWith('/api/')) {
    if (next) return next();
    return false;
  }

  const reqOrigin = req.headers.origin || '*';

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-KBB-App-Key, X-KBB-Actor-Id, X-KBB-Actor-Role'
    );
    res.end();
    return true;
  }

  const clientIp = getClientIp(req);
  const originUrl = getRequestOrigin(req);

  // Rate limit check per IP
  const isWaEndpoint = url.startsWith('/api/wa/');
  if (!checkRateLimit(clientIp, isWaEndpoint ? 'wa' : 'state', isWaEndpoint ? 30 : 120, 60000)) {
    sendJson(res, 429, {
      error: 'Terlalu banyak permintaan dari IP Anda. Silakan coba lagi setelah 1 menit.'
    }, reqOrigin);
    return true;
  }

  // Block direct Shodan / scanner / curl access that lacks the internal application header
  // (Except /api/wa/webhook which is called externally by Fonnte/Wablas gateway)
  if (url !== '/api/wa/webhook') {
    const appKey = req.headers['x-kbb-app-key'];
    if (appKey !== APP_CLIENT_KEY) {
      sendJson(res, 401, {
        error: 'Akses langsung ke endpoint API ditolak (Unauthorized).'
      }, reqOrigin);
      return true;
    }
  }

  // =========================================================================
  // 1. STATE SYNC ENDPOINTS (/api/state)
  // =========================================================================
  if (url === '/api/state' && req.method === 'GET') {
    const db = readDb();
    sendJson(res, 200, {
      success: true,
      clientIp,
      users: db.users,
      logs: db.logs,
      updatedAt: db.updatedAt
    }, reqOrigin);
    return true;
  }

  if (url === '/api/state' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();
    const canReplace = isAuthorizedSuperadmin(req, db.users);

    let nextUsers = db.users;
    let nextLogs = db.logs;

    if (body.replaceUsers && canReplace && Array.isArray(body.users)) {
      nextUsers = body.users;
    } else if (Array.isArray(body.users) && body.users.length > 0) {
      const mapById = new Map(db.users.map((u) => [u.id, u]));
      const mapByUsername = new Map(db.users.map((u) => [String(u.username || '').toLowerCase(), u]));

      body.users.forEach((incoming) => {
        if (!incoming || !incoming.username) return;
        const uname = String(incoming.username).toLowerCase();
        if (!mapById.has(incoming.id) && !mapByUsername.has(uname)) {
          mapById.set(incoming.id, incoming);
          mapByUsername.set(uname, incoming);
        } else if (mapById.has(incoming.id)) {
          const existing = mapById.get(incoming.id);
          const inTime = new Date(incoming.updatedAt || incoming.lastLoginAt || 0).getTime();
          const exTime = new Date(existing.updatedAt || existing.lastLoginAt || 0).getTime();
          if (inTime >= exTime) {
            mapById.set(incoming.id, {
              ...existing,
              ...incoming,
              password: incoming.password || existing.password
            });
          }
        }
      });

      nextUsers = Array.from(mapById.values());
    }

    if (body.replaceLogs && canReplace && Array.isArray(body.logs)) {
      nextLogs = body.logs.slice(0, MAX_LOGS);
    } else if (Array.isArray(body.logs) && body.logs.length > 0) {
      const logMap = new Map();
      [...body.logs, ...db.logs].forEach((entry) => {
        if (entry && entry.id && !logMap.has(entry.id)) {
          logMap.set(entry.id, entry);
        }
      });
      nextLogs = Array.from(logMap.values())
        .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
        .slice(0, MAX_LOGS);
    }

    const saved = writeDb({ users: nextUsers, logs: nextLogs });
    sendJson(res, 200, {
      success: true,
      clientIp,
      users: saved.users,
      logs: saved.logs,
      updatedAt: saved.updatedAt
    }, reqOrigin);
    return true;
  }

  // =========================================================================
  // 2. WHATSAPP SERVER AUTOMATION ENDPOINTS (/api/wa/*)
  // =========================================================================
  const adminOnlyWaRoutes = ['/api/wa/status', '/api/wa/config', '/api/wa/connect', '/api/wa/disconnect', '/api/wa/test'];
  if (adminOnlyWaRoutes.includes(url)) {
    const db = readDb();
    if (!isAuthorizedSuperadmin(req, db.users)) {
      sendJson(res, 403, {
        error: 'Akses ditolak. Hanya Superadmin yang diizinkan mengelola WhatsApp Server.'
      }, reqOrigin);
      return true;
    }
  }

  // GET /api/wa/status -> Get connection state, QR code, and WA config
  if (url === '/api/wa/status' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      ...getWaStatus()
    }, reqOrigin);
    return true;
  }

  // POST /api/wa/config -> Save WA Server settings (Superadmin phone, Gateway token, toggles)
  if (url === '/api/wa/config' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const updated = saveWaConfig(body);
    sendJson(res, 200, {
      success: true,
      config: updated,
      ...getWaStatus()
    }, reqOrigin);
    return true;
  }

  // POST /api/wa/connect -> Start Baileys QR Code pairing session
  if (url === '/api/wa/connect' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const status = await startWaServerSocket(Boolean(body.forceNewQr));
    sendJson(res, 200, {
      success: true,
      ...status
    });
    return true;
  }

  // POST /api/wa/disconnect -> Disconnect & clear Baileys WA session
  if (url === '/api/wa/disconnect' && req.method === 'POST') {
    const status = await disconnectWaServerSocket(true);
    sendJson(res, 200, {
      success: true,
      ...status
    });
    return true;
  }

  // POST /api/wa/test -> Send a test message from WA Server
  if (url === '/api/wa/test' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const phone = body.phone || getWaStatus().config?.superadminPhone;
    const msg =
      body.message ||
      [
        '*✅ UJI COBA KONEKSI WA SERVER BERHASIL*',
        '*BKPSDM KABUPATEN BANDUNG BARAT*',
        '',
        'Nomor WhatsApp Server Anda telah aktif dan siap mengirimkan:',
        '1. Notifikasi pengajuan pendaftaran akun baru ke WA Superadmin (bisa balas *ACC* / *TOLAK* langsung dari WA).',
        '2. Detail kredensial akun lengkap otomatis ke nomor WA Pegawai saat di-Approve.',
        '',
        `_Waktu Server: ${new Date().toLocaleString('id-ID')}_`
      ].join('\n');

    const result = await sendWhatsAppMessage(phone, msg);
    sendJson(res, 200, result);
    return true;
  }

  // POST /api/wa/notify-register -> Triggered when an ASN submits registration
  if (url === '/api/wa/notify-register' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const result = await sendRegistrationNotifications(
      body.user || {},
      body.originUrl || originUrl
    );
    sendJson(res, 200, {
      success: true,
      result
    });
    return true;
  }

  // POST /api/wa/notify-approve -> Triggered when Superadmin approves or creates an account
  if (url === '/api/wa/notify-approve' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const result = await sendApprovalNotification(
      body.user || {},
      body.originUrl || originUrl
    );
    sendJson(res, 200, result);
    return true;
  }

  // POST /api/wa/notify-reject -> Triggered when Superadmin rejects a registration request
  if (url === '/api/wa/notify-reject' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const result = await sendRejectionNotification(body.user || {});
    sendJson(res, 200, result);
    return true;
  }

  // POST /api/wa/webhook -> Incoming Webhook for Fonnte / Wablas 2-Way WA Commands (ACC / TOLAK)
  if (url === '/api/wa/webhook' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const senderPhone = body.sender || body.phone || body.from || '';
    const messageText = body.message || body.text || body.body || '';
    const result = await processIncomingWaCommand({
      senderPhone,
      text: messageText
    });
    sendJson(res, 200, {
      success: true,
      ...result
    });
    return true;
  }

  if (next) return next();
  return false;
}
