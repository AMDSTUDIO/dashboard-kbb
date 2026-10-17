// Service to manage authentication, session storage, RBAC (Superadmin), account approval workflow, and user activity logs for KBB Executive Dashboard

const STORAGE_SESSION_KEY = 'kbb_dashboard_auth';
const STORAGE_USERS_KEY = 'kbb_dashboard_users_v3';
const STORAGE_LOGS_KEY = 'kbb_dashboard_activity_logs';
const MAX_LOGS_COUNT = 500;

// Legacy storage keys to clean up old built-in/demo accounts
const LEGACY_KEYS_TO_REMOVE = [
  'kbb_dashboard_users',
  'kbb_dashboard_superadmin'
];

/**
 * Helper to detect browser & OS info from userAgent
 */
function getDeviceInfo() {
  if (typeof navigator === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent || '';

  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';

  let os = 'OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} • ${os}`;
}

function cleanupLegacyStorage() {
  try {
    LEGACY_KEYS_TO_REMOVE.forEach((k) => localStorage.removeItem(k));

    // Migrate only genuine user-created accounts from v2 (excluding any built-in/default accounts)
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
   * Check whether a user object has Superadmin privileges
   */
  isSuperAdmin: (user) => {
    if (!user) return false;
    return Boolean((user.isSuperAdmin || user.role === 'Superadmin') && user.status !== 'PENDING');
  },

  /**
   * Check if at least one approved Superadmin account exists in the database
   */
  hasRegisteredSuperAdmin: () => {
    const users = authService.getAllUsers();
    return users.some((u) => authService.isSuperAdmin(u));
  },

  /**
   * Get all users (both APPROVED and PENDING, 100% custom created accounts, no built-in system accounts)
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
   * Record an activity log entry
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
        category, // 'AUTH' | 'ACCOUNT' | 'NAVIGATION' | 'DATA'
        action,
        description,
        deviceInfo: getDeviceInfo(),
        metadata
      };

      const updatedLogs = [newEntry, ...logs].slice(0, MAX_LOGS_COUNT);
      localStorage.setItem(STORAGE_LOGS_KEY, JSON.stringify(updatedLogs));
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
    authService.logActivity({
      user: current,
      category: 'ACCOUNT',
      action: 'CLEAR_LOGS',
      description: 'Superadmin membersihkan seluruh riwayat log aktivitas sistem.'
    });
  },

  /**
   * Submit a public registration request from LoginPage (creates account with status: 'PENDING')
   */
  requestAccountRegistration: (userData) => {
    const { username, nip, name, role, password, opd, jabatan } = userData;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanNip = (nip || '').replace(/\s+/g, '').trim();

    if (!cleanUsername) throw new Error('Username wajib diisi.');
    if (cleanUsername.length < 3) throw new Error('Username minimal 3 karakter.');
    if (!cleanNip) throw new Error('NIP Pegawai wajib diisi.');
    if (!name?.trim()) throw new Error('Nama Lengkap wajib diisi.');
    if (!password || password.length < 6) {
      throw new Error('Kata sandi wajib diisi (minimal 6 karakter).');
    }

    const allUsers = authService.getAllUsers();

    // Check duplicate username or NIP
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

    authService.logActivity({
      user: pendingUser,
      category: 'ACCOUNT',
      action: 'REGISTER_REQUEST',
      description: `Mengajukan pendaftaran akun baru: ${pendingUser.name} (@${pendingUser.username} • NIP. ${pendingUser.nip}) — Menunggu Approval Superadmin.`,
      metadata: { targetUserId: pendingUser.id, targetUsername: pendingUser.username }
    });

    return pendingUser;
  },

  /**
   * Approve a pending user account (Only Superadmin)
   */
  approveUser: (userId, assignedRole = null) => {
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
      approvedBy: currentActor.username
    };

    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));

    authService.logActivity({
      user: currentActor,
      category: 'ACCOUNT',
      action: 'APPROVE_USER',
      description: `Menyetujui (Approve) pendaftaran akun ${target.name} (@${target.username}) dengan hak akses "${finalRole}".`,
      metadata: { targetUserId: target.id, targetUsername: target.username }
    });

    return allUsers[idx];
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

    authService.logActivity({
      user: currentActor,
      category: 'ACCOUNT',
      action: 'REJECT_USER',
      description: `Menolak (Reject) pengajuan pendaftaran akun: ${target.name} (@${target.username} • NIP. ${target.nip}).`,
      metadata: { targetUserId: target.id, targetUsername: target.username }
    });
  },

  /**
   * Register a new user account manually (Allowed for Superadmin, or during initial first-time Superadmin setup when no Superadmin exists yet)
   */
  registerUser: (userData, isInitialSetup = false) => {
    const currentActor = authService.getCurrentUser();
    const hasSuperAdmin = authService.hasRegisteredSuperAdmin();

    if (!isInitialSetup && hasSuperAdmin && !authService.isSuperAdmin(currentActor)) {
      throw new Error('Akses ditolak. Hanya Superadmin yang memiliki izin membuat akun.');
    }

    const { username, nip, name, role, password, opd, jabatan } = userData;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanNip = (nip || '').replace(/\s+/g, '').trim();

    if (!cleanUsername) throw new Error('Username wajib diisi.');
    if (cleanUsername.length < 3) throw new Error('Username minimal 3 karakter.');
    if (!cleanNip) throw new Error('NIP wajib diisi.');
    if (!name?.trim()) throw new Error('Nama Lengkap wajib diisi.');
    if (!password || password.length < 6) {
      throw new Error('Kata sandi wajib diisi (minimal 6 karakter).');
    }

    const allUsers = authService.getAllUsers();

    // Check duplicate username or NIP
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

    authService.logActivity({
      user: currentActor || newUser,
      category: 'ACCOUNT',
      action: 'CREATE_USER',
      description: isInitialSetup
        ? `Inisialisasi akun Superadmin utama: ${newUser.name} (@${newUser.username}).`
        : `Membuat akun baru: ${newUser.name} (@${newUser.username}) dengan role "${newUser.role}".`,
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
        // Reject any legacy built-in/default session IDs
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

        // Verify user still exists and is APPROVED
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
   * Perform strict login against registered & approved users only
   */
  login: async (identifier, password, rememberMe = true) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const cleanId = (identifier || '').trim().toLowerCase();

    if (!cleanId) {
      throw new Error('NIP / Username tidak boleh kosong.');
    }

    if (!password) {
      throw new Error('Kata sandi tidak boleh kosong.');
    }

    const allUsers = authService.getAllUsers();

    // Find user by username or NIP
    const user = allUsers.find(
      (u) => u.username.toLowerCase() === cleanId || u.nip.toLowerCase() === cleanId
    );

    if (!user) {
      authService.logActivity({
        user: null,
        category: 'AUTH',
        action: 'LOGIN_FAILED',
        description: `Percobaan login gagal: Akun "${cleanId}" tidak terdaftar dalam sistem.`,
        metadata: { attemptedIdentifier: cleanId, reason: 'USER_NOT_FOUND' }
      });
      throw new Error('Akun tidak ditemukan. Silakan ajukan pendaftaran akun terlebih dahulu.');
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

    const idx = allUsers.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      allUsers[idx] = {
        ...allUsers[idx],
        lastLoginAt: nowIso,
        loginCount: (allUsers[idx].loginCount || 0) + 1
      };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(allUsers));
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
