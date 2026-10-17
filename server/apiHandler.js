import fs from 'node:fs';
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

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const MAX_LOGS = 500;

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      logs: [],
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
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
    fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
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
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
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

  const clientIp = getClientIp(req);
  const originUrl = getRequestOrigin(req);

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
    });
    return true;
  }

  if (url === '/api/state' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();

    let nextUsers = db.users;
    let nextLogs = db.logs;

    if (body.replaceUsers && Array.isArray(body.users)) {
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
            mapById.set(incoming.id, { ...existing, ...incoming });
          }
        }
      });

      nextUsers = Array.from(mapById.values());
    }

    if (body.replaceLogs && Array.isArray(body.logs)) {
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
    });
    return true;
  }

  // =========================================================================
  // 2. WHATSAPP SERVER AUTOMATION ENDPOINTS (/api/wa/*)
  // =========================================================================

  // GET /api/wa/status -> Get connection state, QR code, and WA config
  if (url === '/api/wa/status' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      ...getWaStatus()
    });
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
    });
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
