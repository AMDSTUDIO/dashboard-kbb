import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import pino from 'pino';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const WA_CONFIG_FILE = path.join(DATA_DIR, 'wa-config.json');
const WA_AUTH_DIR = path.join(DATA_DIR, 'wa-auth');

const ROLE_DESCRIPTIONS = {
  'Superadmin': 'Akses penuh ke seluruh 5 Tab Dashboard, Kelola & Approval Akun, serta Log Aktivitas.',
  'Pimpinan / Kepala Badan': 'Melihat Ringkasan Eksekutif, Rekap Jabatan Fungsional, Proyeksi Pensiun BUP, & Proyeksi Naik Jenjang.',
  'Admin Eksekutif BKPSDM': 'Melihat seluruh 5 Tab Kepegawaian (termasuk tabel penuh Master Data Pegawai) & fitur Sync Data.',
  'Pengawas Kepegawaian': 'Melihat Ringkasan Eksekutif, Proyeksi Pensiun BUP, Proyeksi Naik Jenjang, & Master Data Pegawai.',
  'Staf Analis Kepegawaian': 'Melihat Ringkasan Eksekutif, Rekap Jabatan Fungsional, & Proyeksi Naik Jenjang.'
};

const ROLE_SHORTCUTS = {
  '1': 'Pimpinan / Kepala Badan',
  '2': 'Admin Eksekutif BKPSDM',
  '3': 'Pengawas Kepegawaian',
  '4': 'Staf Analis Kepegawaian',
  '5': 'Superadmin'
};

const DEFAULT_CONFIG = {
  enabled: true,
  provider: 'baileys', // 'baileys' (Scan QR Server Mandiri) | 'gateway' (Fonnte / Wablas / Custom API)
  superadminPhone: '',
  allowWaCommandApproval: true,
  notifyApplicantOnRegister: true,
  notifyApplicantOnApprove: true,
  notifyApplicantOnReject: true,
  dashboardUrl: '',
  gatewayProvider: 'fonnte', // 'fonnte' | 'wablas' | 'custom'
  gatewayApiUrl: 'https://api.fonnte.com/send',
  gatewayToken: ''
};

let waSocket = null;
let connectionState = {
  status: 'DISCONNECTED', // 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED'
  qrDataUrl: null,
  connectedPhone: null,
  connectedName: null,
  lastError: null,
  updatedAt: new Date().toISOString()
};
let isStartingSocket = false;
let reconnectTimer = null;

// Callback injected by apiHandler.js to read/write DB when WA Bot receives ACC / TOLAK commands
let dbHandlers = {
  readDb: null,
  writeDb: null
};

export function registerDbHandlers(handlers) {
  dbHandlers = { ...dbHandlers, ...handlers };
}

export function normalizeWaPhone(rawPhone) {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return digits;
}

function ensureConfigFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WA_CONFIG_FILE)) {
    fs.writeFileSync(WA_CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }
}

export function getWaConfig() {
  try {
    ensureConfigFile();
    const raw = fs.readFileSync(WA_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveWaConfig(partialConfig) {
  const current = getWaConfig();
  const updated = {
    ...current,
    ...partialConfig
  };
  if (typeof updated.superadminPhone === 'string') {
    updated.superadminPhone = updated.superadminPhone
      .split(',')
      .map((p) => normalizeWaPhone(p.trim()))
      .filter(Boolean)
      .join(', ');
  }
  ensureConfigFile();
  fs.writeFileSync(WA_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export function getWaStatus() {
  const config = getWaConfig();
  return {
    ...connectionState,
    config: {
      ...config,
      // Mask token only partially if needed, or return so Superadmin can edit
      gatewayToken: config.gatewayToken || ''
    }
  };
}

/**
 * Initialize or connect Built-in Baileys WhatsApp Server socket
 */
export async function startWaServerSocket(forceNewQr = false) {
  if (isStartingSocket) {
    return getWaStatus();
  }

  if (forceNewQr) {
    await disconnectWaServerSocket(true);
  }

  if (waSocket && connectionState.status === 'CONNECTED') {
    return getWaStatus();
  }

  isStartingSocket = true;
  connectionState = {
    ...connectionState,
    status: 'CONNECTING',
    lastError: null,
    updatedAt: new Date().toISOString()
  };

  try {
    if (!fs.existsSync(WA_AUTH_DIR)) {
      fs.mkdirSync(WA_AUTH_DIR, { recursive: true });
    }

    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default?.default || baileys.default || baileys.makeWASocket;
    const useMultiFileAuthState = baileys.useMultiFileAuthState;
    const DisconnectReason = baileys.DisconnectReason;
    const fetchLatestBaileysVersion = baileys.fetchLatestBaileysVersion;

    const { state, saveCreds } = await useMultiFileAuthState(WA_AUTH_DIR);

    let version = [2, 3000, 1015901307];
    try {
      if (fetchLatestBaileysVersion) {
        const latest = await Promise.race([
          fetchLatestBaileysVersion(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500))
        ]);
        if (latest && latest.version) {
          version = latest.version;
        }
      }
    } catch {
      // Use fallback WA web version
    }

    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: ['Server BKPSDM KBB', 'Chrome', '1.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: false
    });

    waSocket = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 280
          });
          connectionState = {
            ...connectionState,
            status: 'QR_READY',
            qrDataUrl,
            lastError: null,
            updatedAt: new Date().toISOString()
          };
        } catch (qrErr) {
          console.error('Failed to generate QR data URL:', qrErr);
        }
      }

      if (connection === 'open') {
        const rawJid = sock.user?.id || '';
        const phonePart = rawJid.split(':')[0].split('@')[0];
        connectionState = {
          status: 'CONNECTED',
          qrDataUrl: null,
          connectedPhone: phonePart || 'Terhubung',
          connectedName: sock.user?.name || 'WA Server BKPSDM KBB',
          lastError: null,
          updatedAt: new Date().toISOString()
        };
      }

      if (connection === 'close') {
        const statusCode =
          lastDisconnect?.error?.output?.statusCode ||
          lastDisconnect?.error?.data?.statusCode ||
          0;
        const shouldReconnect = statusCode !== DisconnectReason?.loggedOut && statusCode !== 401;

        waSocket = null;

        if (statusCode === DisconnectReason?.loggedOut || statusCode === 401) {
          // Clear expired auth session
          try {
            fs.rmSync(WA_AUTH_DIR, { recursive: true, force: true });
          } catch {
            // ignore
          }
          connectionState = {
            status: 'DISCONNECTED',
            qrDataUrl: null,
            connectedPhone: null,
            connectedName: null,
            lastError: 'Sesi WhatsApp Server telah keluar (Logged Out). Silakan klik Tautkan QR kembali.',
            updatedAt: new Date().toISOString()
          };
        } else if (shouldReconnect) {
          connectionState = {
            ...connectionState,
            status: 'CONNECTING',
            qrDataUrl: null,
            lastError: 'Menyambungkan ulang ke server WhatsApp...',
            updatedAt: new Date().toISOString()
          };
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            startWaServerSocket(false);
          }, 4000);
        } else {
          connectionState = {
            status: 'DISCONNECTED',
            qrDataUrl: null,
            connectedPhone: null,
            connectedName: null,
            lastError: lastDisconnect?.error?.message || 'Koneksi terputus.',
            updatedAt: new Date().toISOString()
          };
        }
      }
    });

    // Listen for incoming WhatsApp messages for 2-Way Superadmin Bot Commands (ACC / TOLAK / PENDING)
    sock.ev.on('messages.upsert', async (event) => {
      try {
        if (event.type !== 'notify') return;
        for (const msg of event.messages || []) {
          if (!msg.message || msg.key.fromMe) continue;

          const remoteJid = msg.key.remoteJid || '';
          if (remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') continue;

          const senderPhone = normalizeWaPhone(remoteJid.split('@')[0].split(':')[0]);
          const textBody =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.ephemeralMessage?.message?.extendedTextMessage?.text ||
            msg.message.ephemeralMessage?.message?.conversation ||
            '';

          if (textBody && senderPhone) {
            await processIncomingWaCommand({
              senderPhone,
              text: textBody.trim()
            });
          }
        }
      } catch (err) {
        console.error('Error processing incoming WA message:', err);
      }
    });
  } catch (err) {
    connectionState = {
      status: 'DISCONNECTED',
      qrDataUrl: null,
      connectedPhone: null,
      connectedName: null,
      lastError: err.message || 'Gagal memulai layanan WhatsApp Server.',
      updatedAt: new Date().toISOString()
    };
  } finally {
    isStartingSocket = false;
  }

  return getWaStatus();
}

export async function disconnectWaServerSocket(clearCredentials = true) {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (waSocket) {
    try {
      if (clearCredentials) {
        await waSocket.logout();
      } else {
        waSocket.end(undefined);
      }
    } catch {
      // ignore
    }
    waSocket = null;
  }
  if (clearCredentials && fs.existsSync(WA_AUTH_DIR)) {
    try {
      fs.rmSync(WA_AUTH_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  connectionState = {
    status: 'DISCONNECTED',
    qrDataUrl: null,
    connectedPhone: null,
    connectedName: null,
    lastError: null,
    updatedAt: new Date().toISOString()
  };
  return getWaStatus();
}

/**
 * Send a WhatsApp message using the active provider (Baileys or Gateway API)
 */
export async function sendWhatsAppMessage(targetPhone, messageText) {
  const config = getWaConfig();
  if (!config.enabled) {
    return {
      success: false,
      reason: 'Fitur pengiriman WhatsApp Server sedang dinonaktifkan di pengaturan.'
    };
  }

  const normalizedPhone = normalizeWaPhone(targetPhone);
  if (!normalizedPhone || normalizedPhone.length < 9) {
    return {
      success: false,
      reason: `Nomor WhatsApp tujuan tidak valid (${targetPhone || 'kosong'}).`
    };
  }

  // Provider 1: Gateway API (Fonnte / Wablas / Custom) if selected OR if Gateway Token is configured and Baileys isn't connected
  const useGateway =
    config.provider === 'gateway' ||
    (config.gatewayToken && connectionState.status !== 'CONNECTED');

  if (useGateway) {
    if (!config.gatewayToken) {
      return {
        success: false,
        reason: 'Token API WhatsApp Gateway belum diisi pada Pengaturan WA Server.'
      };
    }

    try {
      const apiUrl = config.gatewayApiUrl || 'https://api.fonnte.com/send';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': config.gatewayToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: normalizedPhone,
          phone: normalizedPhone,
          message: messageText,
          countryCode: '62'
        })
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.status !== false) {
        return {
          success: true,
          provider: 'gateway',
          target: normalizedPhone,
          response: data
        };
      }
      return {
        success: false,
        provider: 'gateway',
        target: normalizedPhone,
        reason: data.reason || data.message || `Gateway HTTP ${response.status}`
      };
    } catch (err) {
      return {
        success: false,
        provider: 'gateway',
        target: normalizedPhone,
        reason: err.message || 'Gagal menghubungi server WhatsApp Gateway.'
      };
    }
  }

  // Provider 2: Built-in Baileys WA Server
  if (!waSocket || connectionState.status !== 'CONNECTED') {
    return {
      success: false,
      provider: 'baileys',
      target: normalizedPhone,
      reason: 'Nomor WA Server belum terhubung. Buka Kelola Akun -> WA Server untuk Scan QR atau isi Token Gateway.'
    };
  }

  try {
    const jid = `${normalizedPhone}@s.whatsapp.net`;
    await waSocket.sendMessage(jid, { text: messageText });
    return {
      success: true,
      provider: 'baileys',
      target: normalizedPhone
    };
  } catch (err) {
    return {
      success: false,
      provider: 'baileys',
      target: normalizedPhone,
      reason: err.message || 'Gagal mengirim pesan melalui WA Server.'
    };
  }
}

/**
 * Helper to get all Superadmin target phone numbers (from config + Superadmin user profiles)
 */
function getSuperadminPhones() {
  const config = getWaConfig();
  const phones = new Set();

  if (config.superadminPhone) {
    config.superadminPhone
      .split(',')
      .map((p) => normalizeWaPhone(p.trim()))
      .filter((p) => p.length >= 9)
      .forEach((p) => phones.add(p));
  }

  if (dbHandlers.readDb) {
    const db = dbHandlers.readDb();
    (db.users || []).forEach((u) => {
      if ((u.isSuperAdmin || u.role === 'Superadmin') && u.status === 'APPROVED' && u.noHp) {
        const clean = normalizeWaPhone(u.noHp);
        if (clean.length >= 9) phones.add(clean);
      }
    });
  }

  return Array.from(phones);
}

/**
 * Format & send notifications when a new account registration is requested
 */
export async function sendRegistrationNotifications(pendingUser, originUrl = '') {
  const config = getWaConfig();
  const portalUrl = config.dashboardUrl || originUrl || 'Portal Dashboard Eksekutif KBB';
  const results = {
    applicantNotified: null,
    superadminNotified: []
  };

  // 1. Notify Applicant (Pegawai) that registration is received and waiting for approval
  if (config.notifyApplicantOnRegister && pendingUser.noHp) {
    const applicantMsg = [
      '*⏳ PENGAJUAN AKUN DITERIMA — BKPSDM KBB*',
      '',
      `Yth. *${pendingUser.name}*,`,
      'Pengajuan pendaftaran akun Anda pada *Dashboard Eksekutif Kepegawaian BKPSDM Kabupaten Bandung Barat* telah tercatat di sistem dan sedang *Menunggu Persetujuan (Approval) Superadmin*.',
      '',
      '*📋 RINGKASAN PENGAJUAN:*',
      `• *Nama:* ${pendingUser.name}`,
      `• *NIP:* ${pendingUser.nip}`,
      `• *Username:* ${pendingUser.username}`,
      `• *Usulan Role:* ${pendingUser.role}`,
      `• *OPD:* ${pendingUser.opd || '-'}`,
      '',
      'Sistem akan mengirimkan detail akun lengkap (Username & Kata Sandi) secara otomatis ke nomor WhatsApp ini segera setelah disetujui oleh Superadmin.',
      '',
      '_— Pesan Otomatis Server Kepegawaian BKPSDM KBB_'
    ].join('\n');

    results.applicantNotified = await sendWhatsAppMessage(pendingUser.noHp, applicantMsg);
  }

  // 2. Notify Superadmin(s) with quick WA command instructions (ACC / TOLAK)
  const adminPhones = getSuperadminPhones();
  if (adminPhones.length > 0) {
    const commandBlock = config.allowWaCommandApproval
      ? [
          '',
          '*⚡ TINDAKAN CEPAT VIA BALASAN WHATSAPP:*',
          `✅ Balas *ACC ${pendingUser.username}* untuk Menyetujui (sesuai usulan role)`,
          `✅ Balas *ACC ${pendingUser.username} [1-4]* untuk Menyetujui & Ubah Role:`,
          '   _(1=Pimpinan, 2=Admin BKPSDM, 3=Pengawas, 4=Staf Analis)_',
          `❌ Balas *TOLAK ${pendingUser.username}* untuk Menolak pengajuan`,
          '📋 Balas *PENDING* untuk melihat daftar antrean akun'
        ].join('\n')
      : '';

    const adminMsg = [
      '*🔔 PENGAJUAN AKUN BARU — DASHBOARD BKPSDM KBB*',
      '',
      'Terdapat pengajuan pendaftaran akun ASN baru yang menunggu persetujuan (*Approval*) Anda:',
      '',
      `• *Nama Pegawai:* ${pendingUser.name}`,
      `• *NIP:* ${pendingUser.nip}`,
      `• *Jabatan:* ${pendingUser.jabatan || '-'}`,
      `• *OPD:* ${pendingUser.opd || '-'}`,
      `• *Username:* ${pendingUser.username}`,
      `• *Usulan Hak Akses:* ${pendingUser.role}`,
      `• *No. WA Pegawai:* ${pendingUser.noHp || '-'}`,
      commandBlock,
      '',
      `🌐 *Atau kelola melalui Dashboard:* ${portalUrl}`
    ]
      .filter((line) => line !== '')
      .join('\n');

    for (const adminPhone of adminPhones) {
      const res = await sendWhatsAppMessage(adminPhone, adminMsg);
      results.superadminNotified.push({ phone: adminPhone, ...res });
    }
  }

  return results;
}

/**
 * Format & send full account credentials to the user's WhatsApp when Approved!
 */
export async function sendApprovalNotification(approvedUser, originUrl = '') {
  const config = getWaConfig();
  if (!config.notifyApplicantOnApprove) {
    return { success: false, reason: 'Notifikasi WA saat Approve dinonaktifkan di pengaturan.' };
  }

  if (!approvedUser?.noHp) {
    return {
      success: false,
      reason: `Akun @${approvedUser?.username || ''} tidak memiliki nomor WhatsApp terdaftar.`
    };
  }

  const portalUrl = config.dashboardUrl || originUrl || 'https://dashboard-kbb.id';
  const roleDesc =
    ROLE_DESCRIPTIONS[approvedUser.role] ||
    ROLE_DESCRIPTIONS['Admin Eksekutif BKPSDM'];

  const message = [
    '*🏛️ AKTIVASI AKUN DASHBOARD EKSEKUTIF*',
    '*BKPSDM KABUPATEN BANDUNG BARAT*',
    '',
    `Yth. *${approvedUser.name}*,`,
    'Selamat! Pengajuan akun Anda pada *Sistem Informasi & Infografik Kepegawaian Eksekutif KBB* telah *DISETUJUI (APPROVED)* oleh Superadmin.',
    '',
    '*🔐 DETAIL KREDENSIAL AKUN LENGKAP ANDA:*',
    `• *Nama Lengkap:* ${approvedUser.name}`,
    `• *NIP:* ${approvedUser.nip}`,
    `• *Jabatan / OPD:* ${approvedUser.jabatan && approvedUser.jabatan !== '-' ? `${approvedUser.jabatan} — ` : ''}${approvedUser.opd || 'BKPSDM KBB'}`,
    `• *Username Login:* ${approvedUser.username}`,
    `• *Kata Sandi:* ${approvedUser.password}`,
    `• *Hak Akses (Role):* ${approvedUser.role}`,
    `• *Cakupan Akses:* ${roleDesc}`,
    '',
    '*🔗 TAUTAN PORTAL LOGIN:*',
    `${portalUrl}`,
    '',
    '_⚠️ Harap simpan informasi kredensial ini dengan aman dan tidak membagikannya kepada pihak yang tidak berwenang._',
    '_— Pesan Otomatis Server Kepegawaian BKPSDM KBB_'
  ].join('\n');

  return await sendWhatsAppMessage(approvedUser.noHp, message);
}

/**
 * Format & send notification when a registration request is Rejected
 */
export async function sendRejectionNotification(rejectedUser) {
  const config = getWaConfig();
  if (!config.notifyApplicantOnReject || !rejectedUser?.noHp) {
    return { success: false, reason: 'Nomor WA kosong atau notifikasi tolak nonaktif.' };
  }

  const message = [
    '*❌ PENGAJUAN AKUN DITOLAK — BKPSDM KBB*',
    '',
    `Yth. *${rejectedUser.name}*,`,
    `Mohon maaf, pengajuan pendaftaran akun Dashboard Eksekutif Anda (*@${rejectedUser.username}* / NIP. ${rejectedUser.nip}) belum dapat disetujui oleh Administrator BKPSDM Kabupaten Bandung Barat.`,
    '',
    'Silakan hubungi Administrator Kepegawaian BKPSDM KBB apabila memerlukan informasi lebih lanjut.',
    '',
    '_— Pesan Otomatis Server Kepegawaian BKPSDM KBB_'
  ].join('\n');

  return await sendWhatsAppMessage(rejectedUser.noHp, message);
}

/**
 * Process incoming 2-Way WhatsApp command from Superadmin (via Baileys socket or Gateway Webhook)
 * Supported commands:
 * - ACC <username> [1-5]
 * - SETUJU <username> [1-5]
 * - APPROVE <username> [1-5]
 * - TOLAK <username>
 * - REJECT <username>
 * - PENDING / LIST
 */
export async function processIncomingWaCommand({ senderPhone, text }) {
  const config = getWaConfig();
  if (!config.enabled || !config.allowWaCommandApproval) {
    return { handled: false, reason: 'WA command approval disabled' };
  }

  if (!dbHandlers.readDb || !dbHandlers.writeDb) {
    return { handled: false, reason: 'DB handlers not initialized' };
  }

  const cleanSender = normalizeWaPhone(senderPhone);
  const authorizedPhones = getSuperadminPhones();

  if (!authorizedPhones.includes(cleanSender)) {
    return { handled: false, reason: 'Sender is not an authorized Superadmin phone' };
  }

  const trimmed = String(text || '').trim();
  const parts = trimmed.split(/\s+/);
  const cmd = (parts[0] || '').toUpperCase();

  // Command 1: List pending accounts
  if (cmd === 'PENDING' || cmd === 'LIST' || cmd === 'ANTREAN') {
    const db = dbHandlers.readDb();
    const pendingList = (db.users || []).filter((u) => u.status === 'PENDING');
    if (pendingList.length === 0) {
      await sendWhatsAppMessage(
        cleanSender,
        '*✅ ANTREAN KOSONG*\nTidak ada pengajuan pendaftaran akun yang menunggu persetujuan saat ini.'
      );
      return { handled: true, command: 'PENDING', count: 0 };
    }

    const lines = [
      `*📋 DAFTAR ANTREAN APPROVAL AKUN (${pendingList.length} Akun)*`,
      ''
    ];
    pendingList.forEach((u, idx) => {
      lines.push(
        `${idx + 1}. *${u.name}* (@${u.username})\n   NIP: ${u.nip} • Usulan: ${u.role}\n   WA: ${u.noHp || '-'}\n   👉 Ketik *ACC ${u.username}* atau *TOLAK ${u.username}*`
      );
    });

    await sendWhatsAppMessage(cleanSender, lines.join('\n'));
    return { handled: true, command: 'PENDING', count: pendingList.length };
  }

  // Command 2: Approve account -> ACC <username> [roleCode]
  if (cmd === 'ACC' || cmd === 'SETUJU' || cmd === 'APPROVE') {
    const rawTarget = (parts[1] || '').replace(/^@/, '').toLowerCase();
    if (!rawTarget) {
      await sendWhatsAppMessage(
        cleanSender,
        '⚠️ Format perintah: *ACC [username]*\nContoh: *ACC budisantoso* atau *ACC budisantoso 2*'
      );
      return { handled: true, error: 'Missing username' };
    }

    const roleArg = parts.slice(2).join(' ').trim();
    const db = dbHandlers.readDb();
    const users = db.users || [];
    const idx = users.findIndex(
      (u) =>
        (String(u.username || '').toLowerCase() === rawTarget ||
          String(u.nip || '') === rawTarget) &&
        u.status === 'PENDING'
    );

    if (idx === -1) {
      await sendWhatsAppMessage(
        cleanSender,
        `❌ Pengajuan akun dengan username/NIP *${rawTarget}* tidak ditemukan dalam antrean Pending.`
      );
      return { handled: true, error: 'Pending user not found' };
    }

    const targetUser = users[idx];
    const assignedRole =
      ROLE_SHORTCUTS[roleArg] ||
      (ROLE_DESCRIPTIONS[roleArg] ? roleArg : null) ||
      targetUser.role ||
      'Staf Analis Kepegawaian';

    const approvedUser = {
      ...targetUser,
      role: assignedRole,
      isSuperAdmin: assignedRole === 'Superadmin',
      status: 'APPROVED',
      approvedAt: new Date().toISOString(),
      approvedBy: `WA Superadmin (${cleanSender})`,
      updatedAt: new Date().toISOString()
    };

    users[idx] = approvedUser;

    const newLog = {
      id: `log_${Date.now()}_wa`,
      timestamp: new Date().toISOString(),
      userId: 'superadmin_wa',
      username: 'superadmin',
      userName: 'Superadmin (Via WhatsApp Bot)',
      userNip: '-',
      userRole: 'Superadmin',
      userOpd: 'BKPSDM Kabupaten Bandung Barat',
      userAvatar: 'SA',
      category: 'ACCOUNT',
      action: 'APPROVE_USER',
      description: `Menyetujui (Approve via Balasan WA) pendaftaran akun ${approvedUser.name} (@${approvedUser.username}) dengan role "${assignedRole}".`,
      deviceInfo: 'WhatsApp Bot Command (Server)',
      ipAddress: `WA:${cleanSender}`,
      location: 'WhatsApp Server Automation'
    };

    dbHandlers.writeDb({
      users,
      logs: [newLog, ...(db.logs || [])]
    });

    const sendRes = await sendApprovalNotification(approvedUser, config.dashboardUrl);

    await sendWhatsAppMessage(
      cleanSender,
      [
        `*✅ BERHASIL APPROVE AKUN (@${approvedUser.username})*`,
        '',
        `• *Nama:* ${approvedUser.name}`,
        `• *Role Ditetapkan:* ${assignedRole}`,
        `• *Pengiriman Akun ke WA Pegawai (${approvedUser.noHp || '-'}):* ${
          sendRes.success ? 'Terkirim Otomatis ✅' : `Gagal (${sendRes.reason})`
        }`
      ].join('\n')
    );

    return { handled: true, command: 'ACC', user: approvedUser.username };
  }

  // Command 3: Reject account -> TOLAK <username>
  if (cmd === 'TOLAK' || cmd === 'REJECT') {
    const rawTarget = (parts[1] || '').replace(/^@/, '').toLowerCase();
    if (!rawTarget) {
      await sendWhatsAppMessage(
        cleanSender,
        '⚠️ Format perintah: *TOLAK [username]*\nContoh: *TOLAK budisantoso*'
      );
      return { handled: true, error: 'Missing username' };
    }

    const db = dbHandlers.readDb();
    const users = db.users || [];
    const targetUser = users.find(
      (u) =>
        (String(u.username || '').toLowerCase() === rawTarget ||
          String(u.nip || '') === rawTarget) &&
        u.status === 'PENDING'
    );

    if (!targetUser) {
      await sendWhatsAppMessage(
        cleanSender,
        `❌ Pengajuan akun *${rawTarget}* tidak ditemukan dalam antrean Pending.`
      );
      return { handled: true, error: 'Pending user not found' };
    }

    const remainingUsers = users.filter((u) => u.id !== targetUser.id);
    const newLog = {
      id: `log_${Date.now()}_wa`,
      timestamp: new Date().toISOString(),
      userId: 'superadmin_wa',
      username: 'superadmin',
      userName: 'Superadmin (Via WhatsApp Bot)',
      userNip: '-',
      userRole: 'Superadmin',
      userOpd: 'BKPSDM Kabupaten Bandung Barat',
      userAvatar: 'SA',
      category: 'ACCOUNT',
      action: 'REJECT_USER',
      description: `Menolak (Reject via Balasan WA) pengajuan pendaftaran akun ${targetUser.name} (@${targetUser.username}).`,
      deviceInfo: 'WhatsApp Bot Command (Server)',
      ipAddress: `WA:${cleanSender}`,
      location: 'WhatsApp Server Automation'
    };

    dbHandlers.writeDb({
      users: remainingUsers,
      logs: [newLog, ...(db.logs || [])]
    });

    await sendRejectionNotification(targetUser);

    await sendWhatsAppMessage(
      cleanSender,
      `*🗑️ PENGAJUAN DITOLAK*\nPengajuan akun *${targetUser.name}* (@${targetUser.username}) telah ditolak dan dihapus dari antrean.`
    );

    return { handled: true, command: 'TOLAK', user: targetUser.username };
  }

  return { handled: false };
}

// Auto-resume Baileys session on server startup if credentials exist in server/data/wa-auth
if (fs.existsSync( path.join(WA_AUTH_DIR, 'creds.json') )) {
  startWaServerSocket(false).catch(() => {});
}

