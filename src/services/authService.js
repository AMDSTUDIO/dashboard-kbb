// Service to manage authentication, centralized VPS server sync, RBAC (Superadmin & 4 Role Tiers), account approval workflow, and user activity logs

const STORAGE_SESSION_KEY = 'kbb_dashboard_auth';
const STORAGE_USERS_KEY = 'kbb_dashboard_users_v3';
const STORAGE_LOGS_KEY = 'kbb_dashboard_activity_logs';
const STORAGE_NET_INFO_KEY = 'kbb_dashboard_net_info';
const MAX_LOGS_COUNT = 500;

const LEGACY_KEYS_TO_REMOVE = [
  'kbb_dashboard_users',
  'kbb_dashboard_superadmin'
];

/**
 * Definisi Hak Akses & Pembatasan Tampilan untuk setiap Role
 */
export const ROLE_PERMISSIONS = {
  'Superadmin': {
    level: 0,
    badgeColor: '#fbbf24',
    allowedTabs: ['overview', 'jabatan', 'pensiun', 'promotion', 'master'],
    canSyncData: true,
    canQuickSearch: true,
    canManageAccounts: true,
    description: 'Akses penuh ke seluruh 5 Tab Dashboard, Kelola & Approval Akun, serta Log Aktivitas.'
  },
  'Pimpinan / Kepala Badan': {
    level: 1,
    badgeColor: '#38bdf8',
    allowedTabs: ['overview', 'jabatan', 'pensiun', 'promotion'],
    canSyncData: false,
    canQuickSearch: true,
    canManageAccounts: false,
    description: 'Melihat Ringkasan Eksekutif, Rekap Jabatan Fungsional, Proyeksi Pensiun BUP, & Proyeksi Naik Jenjang.'
  },
  'Admin Eksekutif BKPSDM': {
    level: 2,
    badgeColor: '#34d399',
    allowedTabs: ['overview', 'jabatan', 'pensiun', 'promotion', 'master'],
    canSyncData: true,
    canQuickSearch: true,
    canManageAccounts: false,
    description: 'Melihat seluruh 5 Tab Kepegawaian (termasuk tabel penuh Master Data Pegawai) & fitur Sync Data.'
  },
  'Pengawas Kepegawaian': {
    level: 3,
    badgeColor: '#a855f7',
    allowedTabs: ['overview', 'pensiun', 'promotion', 'master'],
    canSyncData: false,
    canQuickSearch: true,
    canManageAccounts: false,
    description: 'Melihat Ringkasan Eksekutif, Proyeksi Pensiun BUP, Proyeksi Naik Jenjang, & Master Data Pegawai.'
  },
  'Staf Analis Kepegawaian': {
    level: 4,
    badgeColor: '#94a3b8',
    allowedTabs: ['overview', 'jabatan', 'promotion'],
    canSyncData: false,
    canQuickSearch: false,
    canManageAccounts: false,
    description: 'Melihat Ringkasan Eksekutif, Rekap Jabatan Fungsional, & Proyeksi Naik Jenjang (tanpa Master Data penuh).'
  }
};

let cachedNetworkInfo = null;
let networkFetchPromise = null;

/**
 * Helper to detect detailed device type, OS, browser, and screen info from userAgent
 */
function getDeviceInfo() {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent || '';

  let deviceType = 'Desktop / PC';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)) {
    deviceType = 'Tablet (iPad/Android)';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) {
    deviceType = 'Smartphone (Mobile)';
  }

  let modelHint = '';
  if (ua.includes('iPhone')) modelHint = 'iPhone';
  else if (ua.includes('iPad')) modelHint = 'iPad';
  else if (ua.includes('Macintosh')) modelHint = 'Mac';
  else if (ua.includes('Android')) {
    const match = ua.match(/Android\s+[\d.]+;\s*([^;)]+)/i);
    if (match && match[1]) {
      const cleanedModel = match[1].replace(/Build\/.*$/i, '').trim();
      if (cleanedModel && cleanedModel !== 'K') {
        modelHint = cleanedModel;
      }
    }
  }

  let os = 'OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) {
    const ver = ua.match(/Android\s+([\d.]+)/i);
    os = ver ? `Android ${ver[1]}` : 'Android';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    const ver = ua.match(/OS\s+([\d_]+)/i);
    os = ver ? `iOS ${ver[1].replace(/_/g, '.')}` : 'iOS';
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }

  let browser = 'Browser';
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);

  if (edgeMatch) browser = `Edge ${edgeMatch[1]}`;
  else if (chromeMatch) browser = `Chrome ${chromeMatch[1]}`;
  else if (firefoxMatch) browser = `Firefox ${firefoxMatch[1]}`;
  else if (safariMatch) browser = `Safari ${safariMatch[1]}`;

  const modelPart = modelHint ? ` (${modelHint})` : '';
  return `${deviceType}${modelPart} • ${os} • ${browser}`;
}

function getCachedNetworkInfo() {
  if (cachedNetworkInfo) return cachedNetworkInfo;
  try {
    const raw = sessionStorage.getItem(STORAGE_NET_INFO_KEY);
    if (raw) {
      cachedNetworkInfo = JSON.parse(raw);
      return cachedNetworkInfo;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function fetchClientNetworkInfo() {
  const existing = getCachedNetworkInfo();
  if (existing && existing.ip && existing.ip !== 'Mendeteksi...') {
    return existing;
  }

  if (networkFetchPromise) return networkFetchPromise;

  networkFetchPromise = (async () => {
    let result = null;

    // Provider 1: ipwho.is
    try {
      const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false && data.ip) {
          const locParts = [data.city, data.region, data.country].filter(Boolean);
          result = {
            ip: data.ip,
            location: locParts.join(', ') || 'Lokasi Terdeteksi',
            isp: data.connection?.isp || data.connection?.org || ''
          };
        }
      }
    } catch {
      // Fallback
    }

    // Provider 2: ipapi.co/json
    if (!result) {
      try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ip) {
            const locParts = [data.city, data.region, data.country_name].filter(Boolean);
            result = {
              ip: data.ip,
              location: locParts.join(', ') || 'Lokasi Terdeteksi',
              isp: data.org || ''
            };
          }
        }
      } catch {
        // Fallback
      }
    }

    // Provider 3: api.ipify.org
    if (!result) {
      try {
        const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.ip) {
            result = {
              ip: data.ip,
              location: 'Indonesia (Jaringan Lokal)',
              isp: ''
            };
          }
        }
      } catch {
        // Offline
      }
    }

    if (!result) {
      result = {
        ip: 'Lokal / Offline',
        location: 'Jaringan Internal',
        isp: ''
      };
    }

    cachedNetworkInfo = result;
    try {
      sessionStorage.setItem(STORAGE_NET_INFO_KEY, JSON.stringify(result));
    } catch {
      // ignore
    }

    // Backfill any recent log entries that still had placeholder IP/location
    try {
      const rawLogs = localStorage.getItem(STORAGE_LOGS_KEY);
      if (rawLogs) {
        const parsedLogs = JSON.parse(rawLogs);
        let changed = false;
        const updated = parsedLogs.map((item) => {
          if (!item.ipAddress || item.ipAddress === 'Mendeteksi...' || item.ipAddress === '-') {
            changed = true;
            return {
              ...item,
              ipAddress: result.ip,
              location: result.location,
              isp: result.isp || item.isp || ''
            };
          }
          return item;
        });
        if (changed) {
          localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updated));
          pushStateToServer({ logs: updated, replaceLogs: false });
        }
      }
    } catch {
      // ignore
    }

    networkFetchPromise = null;
    return result;
  })();

  return networkFetchPromise;
}

let resolvedApiBase = null;

function getSessionActorHeaders() {
  try {
    const raw =
      localStorage.getItem(STORAGE_SESSION_KEY) ||
      sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return {
      'X-KBB-Actor-Id': parsed.id || '',
      'X-KBB-Actor-Role': parsed.isSuperAdmin || parsed.role === 'Superadmin' ? 'Superadmin' : (parsed.role || '')
    };
  } catch {
    return {};
  }
}

/**
 * Smart API Fetcher:
 * Tries same-origin `/api/*` first with internal security headers.
 */
async function apiFetchJson(endpoint, options = {}) {
  if (typeof window === 'undefined') return null;

  const host = window.location.hostname || 'localhost';
  const proto = window.location.protocol === 'https:' ? 'https:' : 'http:';

  const candidates = resolvedApiBase !== null
    ? [resolvedApiBase, '', `${proto}//${host}:3001`, `${proto}//${host}:4173`]
    : ['', `${proto}//${host}:3001`, `${proto}//${host}:4173`, `http://${host}:3001`];

  const uniqueCandidates = Array.from(new Set(candidates));
  const actorHeaders = getSessionActorHeaders();

  for (const base of uniqueCandidates) {
    try {
      const res = await fetch(`${base}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-KBB-App-Key': 'kbb-bkpsdm-internal-2026',
          ...actorHeaders,
          ...(options.headers || {})
        }
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        resolvedApiBase = base;
        return await res.json();
      }
    } catch {
      // Try next candidate port
    }
  }

  return null;
}

/**
 * Push local state changes to centralized VPS server (`/api/state`)
 */
async function pushStateToServer({ users, logs, replaceUsers = false, replaceLogs = false }) {
  if (typeof window === 'undefined') return null;
  try {
    const data = await apiFetchJson('/api/state', {
      method: 'POST',
      body: JSON.stringify({
        users,
        logs,
        replaceUsers,
        replaceLogs
      })
    });
    if (data && data.success) {
      if (Array.isArray(data.users)) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(data.users));
      }
      if (Array.isArray(data.logs)) {
        localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(data.logs));
      }
      return data;
    }
  } catch {
    // Fallback silently to localStorage if static host has no /api/state
  }
  return null;
}

/**
 * Sync local storage with centralized VPS server (`/api/state`)
 * Also migrates any accounts created earlier in localStorage up to the server DB!
 */
export async function syncWithServer() {
  if (typeof window === 'undefined') return null;
  try {
    const localUsers = authService.getAllUsers();
    const localLogs = authService.getActivityLogs();

    const data = await apiFetchJson('/api/state', {
      method: 'POST',
      body: JSON.stringify({
        users: localUsers,
        logs: localLogs,
        replaceUsers: false,
        replaceLogs: false
      })
    });

    if (data && data.success) {
      if (Array.isArray(data.users)) {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(data.users));
      }
      if (Array.isArray(data.logs)) {
        localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(data.logs));
      }
      return data;
    }
  } catch {
    // Fallback to localStorage if /api/state is not reachable
  }
  return null;
}

if (typeof window !== 'undefined') {
  fetchClientNetworkInfo();
  syncWithServer();
}

function cleanupLegacyStorage() {
  try {
    LEGACY_KEYS_TO_REMOVE.forEach((k) => localStorage.removeItem(k));

    const v3Raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!v3Raw) {
      const v2Raw = localStorage.getItem('kbb_dashboard_users_v2');
      if (v2Raw) {
        const parsed = JSON.parse(v2Raw);
        const filtered = Array.isArray(parsed)
          ? parsed
              .filter(
                (u) =>
                  !u.isDefault &&
                  u.id !== '1' &&
                  u.id !== '2' &&
                  u.id !== 'superadmin_master'
              )
              .map((u) => ({
                ...u,
                status: u.status || 'APPROVED'
              }))
          : [];
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(filtered));
      } else {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify([]));
      }
      localStorage.removeItem('kbb_dashboard_users_v2');
    }
  } catch (e) {
    console.error('Failed to cleanup legacy storage', e);
  }
}

export const authService = {
  /**
   * Sync with centralized VPS server
   */
  syncWithServer,

  /**
   * Get role permissions object for a given user or role name
   */
  getRolePermissions: (userOrRole) => {
    if (!userOrRole) return ROLE_PERMISSIONS['Staf Analis Kepegawaian'];
    if (typeof userOrRole === 'object') {
      if (userOrRole.isSuperAdmin || userOrRole.role === 'Superadmin') {
        return ROLE_PERMISSIONS['Superadmin'];
      }
      return ROLE_PERMISSIONS[userOrRole.role] || ROLE_PERMISSIONS['Admin Eksekutif BKPSDM'];
    }
    return ROLE_PERMISSIONS[userOrRole] || ROLE_PERMISSIONS['Admin Eksekutif BKPSDM'];
  },

  /**
   * Check whether a user object has Superadmin privileges
   */
  isSuperAdmin: (user) => {
    if (!user) return false;
    return Boolean((user.isSuperAdmin || user.role === 'Superadmin') && user.status !== 'PENDING');
  },

  /**
   * Check if at least one approved Superadmin account exists
   */
  hasRegisteredSuperAdmin: () => {
    const users = authService.getAllUsers();
    return users.some((u) => authService.isSuperAdmin(u));
  },

  /**
   * Get all users (both APPROVED and PENDING)
   */
  getAllUsers: () => {
    cleanupLegacyStorage();
    try {
      const raw = localStorage.getItem(STORAGE_USERS_KEY);
      const users = raw ? JSON.parse(raw) : [];
      return Array.isArray(users)
        ? users
            .filter(
              (u) =>
                !u.isDefault &&
                u.id !== '1' &&
                u.id !== '2' &&
                u.id !== 'superadmin_master'
            )
            .map((u) => ({
              ...u,
              status: u.status || 'APPROVED'
            }))
        : [];
    } catch (e) {
      console.error('Failed to read users from localStorage', e);
      return [];
    }
  },

  /**
   * Get only APPROVED users
   */
  getApprovedUsers: () => {
    return authService.getAllUsers().filter((u) => u.status === 'APPROVED');
  },

  /**
   * Get only PENDING registration requests
   */
  getPendingUsers: () => {
    return authService.getAllUsers().filter((u) => u.status === 'PENDING');
  },

  /**
   * Record an activity log entry with IP address, Location, and Device Info
   */
  logActivity: ({ user, category = 'AUTH', action, description, metadata = {} }) => {
    try {
      const logs = authService.getActivityLogs();
      const actor = user || authService.getCurrentUser() || {
        id: 'anonymous',
        username: metadata.attemptedIdentifier || 'unknown',
        name: metadata.attemptedIdentifier
          ? `Percobaan (${metadata.attemptedIdentifier})`
          : 'Tidak Dikenal',
        nip: '-',
        role: 'Unauthenticated',
        opd: '-',
        avatar: '??'
      };

      const netInfo = getCachedNetworkInfo();

      const newEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: actor.id,
        username: actor.username,
        userName: actor.name,
        userNip: actor.nip || '-',
        userRole: actor.role || '-',
        userOpd: actor.opd || '-',
        userAvatar: actor.avatar || 'US',
        category,
        action,
        description,
        deviceInfo: getDeviceInfo(),
        ipAddress: netInfo?.ip || 'Mendeteksi...',
        location: netInfo?.location || 'Mendeteksi lokasi...',
        isp: netInfo?.isp || '',
        metadata
      };

      const updatedLogs = [newEntry, ...logs].slice(0, MAX_LOGS_COUNT);
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updatedLogs));

      pushStateToServer({ logs: [newEntry], replaceLogs: false });

      if (!netInfo) {
        fetchClientNetworkInfo();
      }

      return newEntry;
    } catch (e) {
      console.error('Failed to record activity log', e);
      return null;
    }
  },

  /**
   * Retrieve all recorded activity logs
   */
  getActivityLogs: () => {
    try {
      const raw = localStorage.getItem(STORAGE_LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read activity logs', e);
      return [];
    }
  },

  /**
   * Clear activity logs (only allowed by Superadmin)
   */
  clearActivityLogs: (actorUser) => {
    const current = actorUser || authService.getCurrentUser();
    if (!authService.isSuperAdmin(current)) {
      throw new Error('Akses ditolak. Hanya Superadmin yang dapat menghapus riwayat log.');
    }
    localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify([]));
    const resetLog = authService.logActivity({
      user: current,
      category: 'ACCOUNT',
      action: 'CLEAR_LOGS',
      description: 'Superadmin membersihkan seluruh riwayat log aktivitas sistem.'
    });
    pushStateToServer({ logs: resetLog ? [resetLog] : [], replaceLogs: true });
  },

  /**
   * WhatsApp Server API helpers
   */
  getWaStatus: async () => {
    const data = await apiFetchJson('/api/wa/status', { method: 'GET' });
    if (data) return data;
    return {
      status: 'DISCONNECTED',
      config: {},
      backendOffline: true
    };
  },

  saveWaConfig: async (configPayload) => {
    const data = await apiFetchJson('/api/wa/config', {
      method: 'POST',
      body: JSON.stringify(configPayload)
    });
    if (!data) {
      throw new Error(
        'Server Backend WA (server.js) belum aktif di VPS. Jalankan perintah: pm2 start server.js --name dashboard-kbb'
      );
    }
    return data;
  },

  connectWaServer: async (forceNewQr = false) => {
    const data = await apiFetchJson('/api/wa/connect', {
      method: 'POST',
      body: JSON.stringify({ forceNewQr })
    });
    if (!data) {
      throw new Error(
        'Layanan Backend WA (server.js) belum berjalan di VPS Anda. Di terminal VPS, jalankan: npm install && pm2 start server.js --name dashboard-kbb'
      );
    }
    return data;
  },

  disconnectWaServer: async () => {
    const data = await apiFetchJson('/api/wa/disconnect', {
      method: 'POST'
    });
    return data || { status: 'DISCONNECTED' };
  },

  sendTestWaMessage: async (phone) => {
    const data = await apiFetchJson('/api/wa/test', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
    if (!data) {
      return {
        success: false,
        reason: 'Layanan Backend WA (server.js) belum berjalan di VPS.'
      };
    }
    return data;
  },

  sendCredentialsToWa: async (userObj) => {
    try {
      const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const data = await apiFetchJson('/api/wa/notify-approve', {
        method: 'POST',
        body: JSON.stringify({ user: userObj, originUrl })
      });
      if (!data) {
        return {
          success: false,
          reason: 'Server WA (server.js) belum aktif di VPS.'
        };
      }
      return data;
    } catch (err) {
      return { success: false, reason: err.message || 'Gagal menghubungi server WA.' };
    }
  },

  /**
   * Submit a public registration request from LoginPage (creates account with status: 'PENDING')
   * Also triggers automatic WA notification to Superadmin & Applicant
   */
  requestAccountRegistration: (userData) => {
    const { username, nip, name, role, password, opd, jabatan, noHp } = userData;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanNip = (nip || '').replace(/\s+/g, '').trim();
    const cleanPhone = String(noHp || '').replace(/\s+/g, '').trim();

    if (!cleanUsername) throw new Error('Username wajib diisi.');
    if (cleanUsername.length < 3) throw new Error('Username minimal 3 karakter.');
    if (!cleanNip) throw new Error('NIP Pegawai wajib diisi.');
    if (!name?.trim()) throw new Error('Nama Lengkap wajib diisi.');
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 9) {
      throw new Error('Nomor WhatsApp aktif wajib diisi agar sistem dapat mengirimkan detail akun saat disetujui.');
    }
    if (!password || password.length < 6) {
      throw new Error('Kata sandi wajib diisi (minimal 6 karakter).');
    }

    const allUsers = authService.getAllUsers();

    const existing = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.nip === cleanNip
    );

    if (existing) {
      if (existing.status === 'PENDING') {
        throw new Error(
          `Pengajuan akun untuk @${cleanUsername} atau NIP ${cleanNip} sudah terdaftar dan sedang menunggu persetujuan Superadmin.`
        );
      }
      throw new Error(`Username @${cleanUsername} atau NIP ${cleanNip} sudah terdaftar dalam sistem.`);
    }

    const cleanName = name.trim();
    const initials = cleanName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

    const requestedRole =
      role && role !== 'Superadmin' ? role : 'Staf Analis Kepegawaian';

    const pendingUser = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      nip: cleanNip,
      name: cleanName,
      noHp: cleanPhone,
      role: requestedRole,
      jabatan: jabatan || '-',
      password: password,
      avatar: initials || cleanUsername.substring(0, 2).toUpperCase(),
      email: `${cleanUsername}@bandungbaratkab.go.id`,
      opd: (opd || '').trim() || 'BKPSDM Kabupaten Bandung Barat',
      isSuperAdmin: false,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      createdBy: 'self-registration'
    };

    allUsers.push(pendingUser);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));
    pushStateToServer({ users: allUsers, replaceUsers: false });

    // Trigger WA Server notification to Superadmin & Applicant in background
    if (typeof window !== 'undefined') {
      apiFetchJson('/api/wa/notify-register', {
        method: 'POST',
        body: JSON.stringify({
          user: pendingUser,
          originUrl: window.location.origin
        })
      }).catch(() => {});
    }

    authService.logActivity({
      user: pendingUser,
      category: 'ACCOUNT',
      action: 'REGISTER_REQUEST',
      description: `Mengajukan pendaftaran akun baru: ${pendingUser.name} (@${pendingUser.username} • NIP. ${pendingUser.nip} • WA: ${pendingUser.noHp}) — Menunggu Approval Superadmin.`,
      metadata: { targetUserId: pendingUser.id, targetUsername: pendingUser.username, noHp: pendingUser.noHp }
    });

    return pendingUser;
  },

  /**
   * Approve a pending user account (Only Superadmin) and automatically send full account details to registered WhatsApp
   */
  approveUser: async (userId, assignedRole = null) => {
    const currentActor = authService.getCurrentUser();
    if (!authService.isSuperAdmin(currentActor)) {
      throw new Error('Akses ditolak. Hanya Superadmin yang dapat menyetujui pendaftaran akun.');
    }

    const allUsers = authService.getAllUsers();
    const idx = allUsers.findIndex((u) => u.id === userId);
    if (idx === -1) {
      throw new Error('Data pengajuan akun tidak ditemukan.');
    }

    const target = allUsers[idx];
    const finalRole = assignedRole || target.role || 'Staf Analis Kepegawaian';

    allUsers[idx] = {
      ...target,
      role: finalRole,
      isSuperAdmin: finalRole === 'Superadmin',
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: currentActor.username,
      updatedAt: new Date().toISOString()
    };

    const approvedAccount = allUsers[idx];

    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));
    await pushStateToServer({ users: allUsers, replaceUsers: true });

    // Automatically send complete account credentials via Server WhatsApp
    let waDelivery = { success: false, reason: 'Tidak ada nomor WA' };
    if (approvedAccount.noHp) {
      waDelivery = await authService.sendCredentialsToWa(approvedAccount);
    }

    authService.logActivity({
      user: currentActor,
      category: 'ACCOUNT',
      action: 'APPROVE_USER',
      description: `Menyetujui (Approve) pendaftaran akun ${target.name} (@${target.username}) dengan hak akses "${finalRole}". ${
        waDelivery.success
          ? `Detail akun terkirim otomatis ke WA (${approvedAccount.noHp}).`
          : ''
      }`,
      metadata: {
        targetUserId: target.id,
        targetUsername: target.username,
        waSent: waDelivery.success,
        noHp: approvedAccount.noHp || '-'
      }
    });

    return { user: approvedAccount, waDelivery };
  },

  /**
   * Reject & remove a pending user registration request (Only Superadmin)
   */
  rejectUser: (userId) => {
    const currentActor = authService.getCurrentUser();
    if (!authService.isSuperAdmin(currentActor)) {
      throw new Error('Akses ditolak. Hanya Superadmin yang dapat menolak pengajuan akun.');
    }

    const allUsers = authService.getAllUsers();
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return;

    const updated = allUsers.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
    pushStateToServer({ users: updated, replaceUsers: true });

    if (typeof window !== 'undefined' && target.noHp) {
      apiFetchJson('/api/wa/notify-reject', {
        method: 'POST',
        body: JSON.stringify({ user: target })
      }).catch(() => {});
    }

    authService.logActivity({
      user: currentActor,
      category: 'ACCOUNT',
      action: 'REJECT_USER',
      description: `Menolak (Reject) pengajuan pendaftaran akun: ${target.name} (@${target.username} • NIP. ${target.nip}).`,
      metadata: { targetUserId: target.id, targetUsername: target.username }
    });
  },

  /**
   * Register a new user account manually (Only Superadmin)
   */
  registerUser: (userData, isInitialSetup = false) => {
    const currentActor = authService.getCurrentUser();
    const hasSuperAdmin = authService.hasRegisteredSuperAdmin();

    if (!isInitialSetup && hasSuperAdmin && !authService.isSuperAdmin(currentActor)) {
      throw new Error('Akses ditolak. Hanya Superadmin yang memiliki izin membuat akun.');
    }

    const { username, nip, name, role, password, opd, jabatan, noHp } = userData;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanNip = (nip || '').replace(/\s+/g, '').trim();
    const cleanPhone = String(noHp || '').replace(/\s+/g, '').trim();

    if (!cleanUsername) throw new Error('Username wajib diisi.');
    if (cleanUsername.length < 3) throw new Error('Username minimal 3 karakter.');
    if (!cleanNip) throw new Error('NIP wajib diisi.');
    if (!name?.trim()) throw new Error('Nama Lengkap wajib diisi.');
    if (!password || password.length < 6) {
      throw new Error('Kata sandi wajib diisi (minimal 6 karakter).');
    }

    const allUsers = authService.getAllUsers();

    const existing = allUsers.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.nip === cleanNip
    );

    if (existing) {
      throw new Error(`Username @${cleanUsername} atau NIP ${cleanNip} sudah terdaftar dalam sistem.`);
    }

    const cleanName = name.trim();
    const initials = cleanName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

    const finalRole = isInitialSetup ? 'Superadmin' : (role || 'Admin Eksekutif BKPSDM');

    const newUser = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      nip: cleanNip,
      name: cleanName,
      noHp: cleanPhone,
      role: finalRole,
      jabatan: jabatan || '-',
      password: password,
      avatar: initials || cleanUsername.substring(0, 2).toUpperCase(),
      email: `${cleanUsername}@bandungbaratkab.go.id`,
      opd: (opd || '').trim() || 'BKPSDM Kabupaten Bandung Barat',
      isSuperAdmin: finalRole === 'Superadmin',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      createdBy: currentActor?.username || cleanUsername
    };

    allUsers.push(newUser);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));
    pushStateToServer({ users: allUsers, replaceUsers: true });

    if (!isInitialSetup && newUser.noHp) {
      authService.sendCredentialsToWa(newUser).catch(() => {});
    }

    authService.logActivity({
      user: currentActor || newUser,
      category: 'ACCOUNT',
      action: 'CREATE_USER',
      description: `Membuat akun baru: ${newUser.name} (@${newUser.username}) dengan role "${newUser.role}".`,
      metadata: { targetUserId: newUser.id, targetUsername: newUser.username }
    });

    return newUser;
  },

  /**
   * Update an account's password (Only Superadmin)
   */
  updateUserPassword: (userId, newPassword) => {
    const currentActor = authService.getCurrentUser();
    if (!authService.isSuperAdmin(currentActor)) {
      throw new Error('Akses ditolak. Hanya Superadmin yang dapat mengubah kata sandi akun.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Kata sandi baru minimal harus 6 karakter.');
    }

    const allUsers = authService.getAllUsers();
    const targetIndex = allUsers.findIndex((u) => u.id === userId);
    if (targetIndex === -1) {
      throw new Error('Akun pengguna tidak ditemukan.');
    }

    const targetUser = allUsers[targetIndex];
    allUsers[targetIndex] = {
      ...targetUser,
      password: newPassword,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));
    pushStateToServer({ users: allUsers, replaceUsers: true });

    authService.logActivity({
      user: currentActor,
      category: 'ACCOUNT',
      action: 'UPDATE_PASSWORD',
      description: `Mengubah kata sandi untuk akun ${targetUser.name} (@${targetUser.username}).`,
      metadata: { targetUserId: targetUser.id, targetUsername: targetUser.username }
    });

    return allUsers[targetIndex];
  },

  /**
   * Delete any user account (Only Superadmin)
   */
  deleteUser: (userId) => {
    const currentActor = authService.getCurrentUser();
    if (!authService.isSuperAdmin(currentActor)) {
      throw new Error('Akses ditolak. Hanya Superadmin yang dapat menghapus akun.');
    }

    const allUsers = authService.getAllUsers();
    const targetUser = allUsers.find((u) => u.id === userId);
    if (!targetUser) return;

    const updated = allUsers.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
    pushStateToServer({ users: updated, replaceUsers: true });

    authService.logActivity({
      user: currentActor,
      category: 'ACCOUNT',
      action: 'DELETE_USER',
      description: `Menghapus akun pengguna: ${targetUser.name} (@${targetUser.username} • NIP. ${targetUser.nip}).`,
      metadata: { targetUserId: targetUser.id, targetUsername: targetUser.username }
    });
  },

  /**
   * Get current authenticated user session
   */
  getCurrentUser: () => {
    cleanupLegacyStorage();
    try {
      const saved =
        localStorage.getItem(STORAGE_SESSION_KEY) ||
        sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        const sessionUser = JSON.parse(saved);
        if (
          sessionUser.id === '1' ||
          sessionUser.id === '2' ||
          sessionUser.id === 'custom-1' ||
          sessionUser.id === 'superadmin_master' ||
          sessionUser.isDefault
        ) {
          localStorage.removeItem(STORAGE_SESSION_KEY);
          sessionStorage.removeItem(STORAGE_SESSION_KEY);
          return null;
        }

        const allUsers = authService.getAllUsers();
        const registered = allUsers.find(
          (u) => u.id === sessionUser.id && u.status === 'APPROVED'
        );
        if (!registered) {
          localStorage.removeItem(STORAGE_SESSION_KEY);
          sessionStorage.removeItem(STORAGE_SESSION_KEY);
          return null;
        }

        const { password: _, ...safeUser } = registered;
        return {
          ...safeUser,
          loggedInAt: sessionUser.loggedInAt
        };
      }
    } catch (e) {
      console.error('Failed to read auth state from storage', e);
    }
    return null;
  },

  /**
   * Perform strict login against registered & approved users (syncs with centralized server first)
   */
  login: async (identifier, password, rememberMe = true) => {
    await Promise.all([
      syncWithServer(),
      Promise.race([
        fetchClientNetworkInfo(),
        new Promise((resolve) => setTimeout(resolve, 600))
      ])
    ]);

    const cleanId = (identifier || '').trim().toLowerCase();

    if (!cleanId) {
      throw new Error('NIP / Username tidak boleh kosong.');
    }

    if (!password) {
      throw new Error('Kata sandi tidak boleh kosong.');
    }

    const allUsers = authService.getAllUsers();

    // Find user by username or NIP
    let user = allUsers.find(
      (u) => u.username.toLowerCase() === cleanId || u.nip.toLowerCase() === cleanId
    );

    // Bootstrap Superadmin fallback if 0 Superadmins exist yet on a brand-new server
    if (!user && !authService.hasRegisteredSuperAdmin() && cleanId === 'superadmin' && password === 'SuperAdmin@KBB2026') {
      user = authService.registerUser(
        {
          name: 'Superadmin BKPSDM',
          nip: '199001012020011001',
          username: 'superadmin',
          password: 'SuperAdmin@KBB2026',
          role: 'Superadmin',
          opd: 'BKPSDM Kabupaten Bandung Barat',
          jabatan: 'Super Administrator'
        },
        true
      );
    }

    if (!user) {
      authService.logActivity({
        user: null,
        category: 'AUTH',
        action: 'LOGIN_FAILED',
        description: `Percobaan login gagal: Akun "${cleanId}" tidak terdaftar dalam sistem.`,
        metadata: { attemptedIdentifier: cleanId, reason: 'USER_NOT_FOUND' }
      });
      throw new Error('Akun tidak ditemukan. Silakan ajukan pendaftaran akun pada tab Daftar Akun.');
    }

    if (user.password !== password) {
      authService.logActivity({
        user,
        category: 'AUTH',
        action: 'LOGIN_FAILED',
        description: `Percobaan login gagal pada akun @${user.username}: Kata sandi salah.`,
        metadata: { attemptedIdentifier: cleanId, reason: 'WRONG_PASSWORD' }
      });
      throw new Error('Kata sandi yang Anda masukkan salah.');
    }

    if (user.status === 'PENDING') {
      authService.logActivity({
        user,
        category: 'AUTH',
        action: 'LOGIN_FAILED',
        description: `Percobaan login ditolak: Akun @${user.username} masih berstatus Menunggu Persetujuan (Pending) Superadmin.`,
        metadata: { attemptedIdentifier: cleanId, reason: 'PENDING_APPROVAL' }
      });
      throw new Error(
        `Akun @${user.username} sudah terdaftar namun masih menunggu persetujuan (Approval) dari Superadmin.`
      );
    }

    const nowIso = new Date().toISOString();
    const netInfo = getCachedNetworkInfo();

    const latestUsers = authService.getAllUsers();
    const idx = latestUsers.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      latestUsers[idx] = {
        ...latestUsers[idx],
        lastLoginAt: nowIso,
        lastIp: netInfo?.ip || '-',
        lastLocation: netInfo?.location || '-',
        lastDevice: getDeviceInfo(),
        loginCount: (latestUsers[idx].loginCount || 0) + 1
      };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(latestUsers));
      pushStateToServer({ users: latestUsers, replaceUsers: false });
    }

    const { password: _, ...safeUser } = user;
    const sessionData = {
      ...safeUser,
      lastLoginAt: nowIso,
      loggedInAt: nowIso
    };

    const storage = rememberMe ? localStorage : sessionStorage;
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    storage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));

    authService.logActivity({
      user: sessionData,
      category: 'AUTH',
      action: 'LOGIN_SUCCESS',
      description: `${sessionData.name} (@${sessionData.username}) berhasil masuk ke Dashboard Eksekutif.`
    });

    return sessionData;
  },

  /**
   * Perform logout and record activity
   */
  logout: () => {
    const current = authService.getCurrentUser();
    if (current) {
      authService.logActivity({
        user: current,
        category: 'AUTH',
        action: 'LOGOUT',
        description: `${current.name} (@${current.username}) keluar (logout) dari sesi Dashboard.`
      });
    }
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
  }
};
