import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
 * Node HTTP / Connect / Vite middleware for `/api/auth-sync`
 */
export async function handleApiRequest(req, res, next) {
  const url = req.url ? req.url.split('?')[0] : '';
  if (!url.startsWith('/api/')) {
    if (next) return next();
    return false;
  }

  const clientIp = getClientIp(req);

  // GET /api/state -> returns shared users, logs, and detected clientIp
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

  // POST /api/state -> syncs or updates users and logs on the server
  if (url === '/api/state' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const db = readDb();

    let nextUsers = db.users;
    let nextLogs = db.logs;

    // If replaceUsers is explicitly true (e.g. user creation, approval, password update, deletion), save authoritative list
    if (body.replaceUsers && Array.isArray(body.users)) {
      nextUsers = body.users;
    } else if (Array.isArray(body.users) && body.users.length > 0) {
      // Merge any local browser accounts into server DB if not present by username/id
      const mapById = new Map(db.users.map((u) => [u.id, u]));
      const mapByUsername = new Map(db.users.map((u) => [String(u.username || '').toLowerCase(), u]));

      body.users.forEach((incoming) => {
        if (!incoming || !incoming.username) return;
        const uname = String(incoming.username).toLowerCase();
        if (!mapById.has(incoming.id) && !mapByUsername.has(uname)) {
          mapById.set(incoming.id, incoming);
          mapByUsername.set(uname, incoming);
        } else if (mapById.has(incoming.id)) {
          // Update if incoming has newer updatedAt or lastLoginAt
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

    // Handle logs update
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

  if (next) return next();
  return false;
}

