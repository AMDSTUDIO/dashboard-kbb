// Service to manage authentication, session storage, and manual user account creation for KBB Executive Dashboard

const STORAGE_SESSION_KEY = 'kbb_dashboard_auth';
const STORAGE_USERS_KEY = 'kbb_dashboard_users';

export const DEFAULT_DEMO_USERS = [
  {
    id: '1',
    username: 'admin',
    nip: '198501012010011001',
    name: 'Drs. H. Ahmad Fauzi, M.Si',
    role: 'Admin Eksekutif BKPSDM',
    avatar: 'AF',
    email: 'ahmad.fauzi@bandungbaratkab.go.id',
    opd: 'BKPSDM Kabupaten Bandung Barat',
    isDefault: true
  },
  {
    id: '2',
    username: 'pimpinan',
    nip: '197805122003121002',
    name: 'Dr. Ir. H. Bambang Sutrisno, M.T.',
    role: 'Pimpinan / Kepala Badan',
    avatar: 'BS',
    email: 'bambang.sutrisno@bandungbaratkab.go.id',
    opd: 'Sekretariat Daerah KBB',
    isDefault: true
  }
];

export const authService = {
  /**
   * Get all registered users (combines defaults + custom created accounts)
   */
  getAllUsers: () => {
    try {
      const customUsersJson = localStorage.getItem(STORAGE_USERS_KEY);
      const customUsers = customUsersJson ? JSON.parse(customUsersJson) : [];
      return [...DEFAULT_DEMO_USERS, ...customUsers];
    } catch (e) {
      console.error('Failed to read users from localStorage', e);
      return DEFAULT_DEMO_USERS;
    }
  },

  /**
   * Register a new user account manually
   */
  registerUser: (userData) => {
    const { username, nip, name, role, password, opd } = userData;

    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanNip = (nip || '').trim();

    if (!cleanUsername) throw new Error('Username wajib diisi.');
    if (!cleanNip) throw new Error('NIP wajib diisi.');
    if (!name?.trim()) throw new Error('Nama Lengkap wajib diisi.');
    if (!password) throw new Error('Password wajib diisi.');

    const allUsers = authService.getAllUsers();
    
    // Check duplicate username or NIP
    const existing = allUsers.find(
      u => u.username.toLowerCase() === cleanUsername || u.nip === cleanNip
    );

    if (existing) {
      throw new Error(`Username @${cleanUsername} atau NIP ${cleanNip} sudah terdaftar dalam sistem.`);
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      username: cleanUsername,
      nip: cleanNip,
      name: name.trim(),
      role: role || 'Pengawas Kepegawaian',
      password: password,
      avatar: name.substring(0, 2).toUpperCase(),
      email: `${cleanUsername}@bandungbaratkab.go.id`,
      opd: opd || 'BKPSDM Kabupaten Bandung Barat',
      createdAt: new Date().toISOString()
    };

    const customUsersJson = localStorage.getItem(STORAGE_USERS_KEY);
    const customUsers = customUsersJson ? JSON.parse(customUsersJson) : [];
    customUsers.push(newUser);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(customUsers));

    return newUser;
  },

  /**
   * Delete a custom created user account
   */
  deleteUser: (userId) => {
    const customUsersJson = localStorage.getItem(STORAGE_USERS_KEY);
    if (!customUsersJson) return;

    const customUsers = JSON.parse(customUsersJson);
    const updated = customUsers.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated));
  },

  /**
   * Get current authenticated user session
   */
  getCurrentUser: () => {
    try {
      const saved = localStorage.getItem(STORAGE_SESSION_KEY) || sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read auth state from storage', e);
    }
    return null;
  },

  /**
   * Perform login
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
      (u) => u.username.toLowerCase() === cleanId || u.nip === cleanId
    );

    // Verify password if user was custom created with custom password
    if (user && user.password && user.password !== password) {
      throw new Error('Kata sandi yang Anda masukkan salah.');
    }

    // Fallback if user is not pre-registered
    const authenticatedUser = user || {
      id: 'custom-1',
      username: cleanId,
      nip: cleanId.match(/^\d+$/) ? cleanId : '199001012015011001',
      name: `Pengguna (${cleanId})`,
      role: 'Pengawas Kepegawaian',
      avatar: cleanId.substring(0, 2).toUpperCase(),
      opd: 'BKPSDM Kabupaten Bandung Barat'
    };

    const sessionData = {
      ...authenticatedUser,
      loggedInAt: new Date().toISOString()
    };

    const storage = rememberMe ? localStorage : sessionStorage;
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    storage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionData));

    return sessionData;
  },

  /**
   * Perform logout
   */
  logout: () => {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
  }
};
