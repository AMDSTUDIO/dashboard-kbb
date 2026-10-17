import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Activity,
  LogIn,
  LogOut,
  UserPlus,
  Trash2,
  KeyRound,
  RefreshCw,
  Search,
  Filter,
  Clock,
  Monitor,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  Database,
  LayoutDashboard,
  X,
  Globe,
  MapPin
} from 'lucide-react';
import { authService, fetchClientNetworkInfo } from '../services/authService';

const ACTION_CONFIG = {
  LOGIN_SUCCESS: {
    label: 'Login Berhasil',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: LogIn
  },
  LOGIN_FAILED: {
    label: 'Login Gagal',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.14)',
    border: 'rgba(244, 63, 94, 0.35)',
    icon: XCircle
  },
  LOGOUT: {
    label: 'Logout Keluar',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: LogOut
  },
  CREATE_USER: {
    label: 'Buat Akun',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: UserPlus
  },
  REGISTER_REQUEST: {
    label: 'Pengajuan Akun',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.35)',
    icon: Clock
  },
  APPROVE_USER: {
    label: 'Approve Akun',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.35)',
    icon: CheckCircle2
  },
  REJECT_USER: {
    label: 'Tolak Akun',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.14)',
    border: 'rgba(244, 63, 94, 0.35)',
    icon: XCircle
  },
  DELETE_USER: {
    label: 'Hapus Akun',
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.14)',
    border: 'rgba(244, 63, 94, 0.35)',
    icon: Trash2
  },
  UPDATE_PASSWORD: {
    label: 'Ubah Sandi',
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.14)',
    border: 'rgba(168, 85, 247, 0.35)',
    icon: KeyRound
  },
  CLEAR_LOGS: {
    label: 'Reset Log',
    color: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.14)',
    border: 'rgba(251, 146, 60, 0.35)',
    icon: Trash2
  },
  SYNC_DATA: {
    label: 'Sync Data',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.35)',
    icon: Database
  },
  VIEW_TAB: {
    label: 'Navigasi Tab',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.14)',
    border: 'rgba(148, 163, 184, 0.3)',
    icon: LayoutDashboard
  },
  VIEW_EMPLOYEE: {
    label: 'Detail Pegawai',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.14)',
    border: 'rgba(96, 165, 250, 0.35)',
    icon: Eye
  },
  VIEW_JABATAN: {
    label: 'Rincian Jabatan',
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.14)',
    border: 'rgba(129, 140, 248, 0.35)',
    icon: Users
  }
};

function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '-';
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return 'Belum pernah login';
  try {
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} hari lalu`;
  } catch {
    return '-';
  }
}

export default function ActivityLogPanel({
  currentUser,
  selectedAccountFilter,
  onSelectAccountFilter,
  onOpenAdminUserModal,
  onClose
}) {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [accountFilter, setAccountFilter] = useState(selectedAccountFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadAuditData = () => {
    setLogs(authService.getActivityLogs());
    setUsers(authService.getAllUsers());
  };

  useEffect(() => {
    loadAuditData();
    fetchClientNetworkInfo().then(() => {
      loadAuditData();
    });
  }, []);

  useEffect(() => {
    if (selectedAccountFilter) {
      setAccountFilter(selectedAccountFilter);
    }
  }, [selectedAccountFilter]);

  const handleAccountSelect = (usernameOrAll) => {
    setAccountFilter(usernameOrAll);
    if (onSelectAccountFilter) {
      onSelectAccountFilter(usernameOrAll === 'ALL' ? null : usernameOrAll);
    }
  };

  // Summary metrics per user account
  const accountSummaries = useMemo(() => {
    return users.map((u) => {
      const userLogs = logs.filter(
        (l) => l.userId === u.id || (l.username && l.username.toLowerCase() === u.username.toLowerCase())
      );
      const loginSuccessCount = userLogs.filter((l) => l.action === 'LOGIN_SUCCESS').length;
      const lastLoginLog = userLogs.find((l) => l.action === 'LOGIN_SUCCESS');
      const lastActivityLog = userLogs[0];

      return {
        ...u,
        totalActivities: userLogs.length,
        loginCount: Math.max(u.loginCount || 0, loginSuccessCount),
        lastLoginAt: u.lastLoginAt || lastLoginLog?.timestamp || null,
        lastActivityAt: lastActivityLog?.timestamp || u.lastLoginAt || null,
        lastIp: u.lastIp || lastActivityLog?.ipAddress || lastLoginLog?.ipAddress || '-',
        lastLocation: u.lastLocation || lastActivityLog?.location || lastLoginLog?.location || '-',
        lastDevice: u.lastDevice || lastActivityLog?.deviceInfo || lastLoginLog?.deviceInfo || '-'
      };
    });
  }, [users, logs]);

  // Global KPI counts
  const kpiStats = useMemo(() => {
    const totalLogs = logs.length;
    const totalLogins = logs.filter((l) => l.action === 'LOGIN_SUCCESS').length;
    const failedLogins = logs.filter((l) => l.action === 'LOGIN_FAILED').length;
    const totalNavAndData = logs.filter(
      (l) => l.category === 'NAVIGATION' || l.category === 'DATA'
    ).length;

    return { totalLogs, totalLogins, failedLogins, totalNavAndData };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'NAV_DATA') {
          if (log.category !== 'NAVIGATION' && log.category !== 'DATA') return false;
        } else if (log.category !== categoryFilter) {
          return false;
        }
      }

      if (accountFilter !== 'ALL') {
        const matchUsername = (log.username || '').toLowerCase() === accountFilter.toLowerCase();
        if (!matchUsername) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inName = (log.userName || '').toLowerCase().includes(q);
        const inUser = (log.username || '').toLowerCase().includes(q);
        const inNip = (log.userNip || '').toLowerCase().includes(q);
        const inDesc = (log.description || '').toLowerCase().includes(q);
        const inDevice = (log.deviceInfo || '').toLowerCase().includes(q);
        const inIp = (log.ipAddress || '').toLowerCase().includes(q);
        const inLoc = (log.location || '').toLowerCase().includes(q);
        if (!inName && !inUser && !inNip && !inDesc && !inDevice && !inIp && !inLoc) return false;
      }

      return true;
    });
  }, [logs, categoryFilter, accountFilter, searchQuery]);

  if (!authService.isSuperAdmin(currentUser)) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '1120px', width: '95vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div
          style={{
            padding: '16px 22px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(2, 132, 199, 0.18) 100%)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                flexShrink: 0
              }}
            >
              <Activity style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 'clamp(1rem, 3.5vw, 1.2rem)', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Log Aktivitas & Audit Akun
                </h2>
                <span
                  className="badge"
                  style={{
                    background: 'rgba(245, 158, 11, 0.18)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    fontSize: '0.65rem',
                    fontWeight: 800
                  }}
                >
                  KHUSUS SUPERADMIN
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Pantau riwayat login, aktivitas navigasi & data, serta manajemen seluruh akun pengguna/admin.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={loadAuditData}
              className="btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.76rem', borderRadius: '8px' }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} />
              Muat Ulang
            </button>

            <button
              onClick={() => {
                if (onClose) onClose();
                if (onOpenAdminUserModal) onOpenAdminUserModal();
              }}
              className="btn-primary"
              style={{ padding: '7px 14px', fontSize: '0.76rem', borderRadius: '8px' }}
            >
              <UserPlus style={{ width: '14px', height: '14px' }} />
              Kelola Akun
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '6px', borderRadius: '50%', border: 'none', flexShrink: 0 }}
                title="Tutup Log Aktivitas"
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
          {/* KPI Summary Row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total Aktivitas Tercatat</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            {kpiStats.totalLogs.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '4px' }}>
            Seluruh event sistem & user
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Total Login Berhasil</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            {kpiStats.totalLogins.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#6ee7b7', marginTop: '4px' }}>
            Sesi masuk terautentikasi
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Percobaan Login Gagal</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
            {kpiStats.failedLogins.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#fda4af', marginTop: '4px' }}>
            Deteksi salah sandi / akun asing
          </div>
        </div>

        <div className="glass-card" style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Aktivitas Navigasi & Data</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {kpiStats.totalNavAndData.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
            Sinkronisasi, buka tab & detail pegawai
          </div>
        </div>
      </div>

      {/* Per-Account Activity Cards */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Rekapitulasi & Filter Log per Akun ({accountSummaries.length} Akun)
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
              Klik pada salah satu kartu akun di bawah untuk memfilter log aktivitas khusus akun tersebut.
            </p>
          </div>

          {accountFilter !== 'ALL' && (
            <button
              onClick={() => handleAccountSelect('ALL')}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.75rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
            >
              Tampilkan Semua Akun
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '12px'
          }}
        >
          {accountSummaries.map((acc) => {
            const isSelected = accountFilter.toLowerCase() === acc.username.toLowerCase();
            return (
              <div
                key={acc.id}
                onClick={() => handleAccountSelect(isSelected ? 'ALL' : acc.username)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(56, 189, 248, 0.14)' : 'rgba(15, 23, 42, 0.65)',
                  border: isSelected
                    ? '1.5px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: acc.isSuperAdmin ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}
                  >
                    {acc.avatar || 'US'}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {acc.name}
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                      @{acc.username} • {acc.role}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.72rem'
                  }}
                >
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Total Masuk / Log</span>
                    <strong style={{ color: '#f8fafc' }}>
                      {acc.loginCount}x Login ({acc.totalActivities} Aksi)
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block' }}>Terakhir Masuk</span>
                    <strong style={{ color: acc.lastLoginAt ? '#34d399' : '#94a3b8' }}>
                      {formatRelativeTime(acc.lastLoginAt)}
                    </strong>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '2px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Globe style={{ width: '12px', height: '12px', color: '#38bdf8', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>{acc.lastIp}</span>
                      <span>• {acc.lastLocation}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '0.68rem' }}>
                      <Monitor style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.lastDevice}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Table & Filter Bar */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {[
              { id: 'ALL', label: 'Semua Aktivitas' },
              { id: 'AUTH', label: 'Autentikasi (Login/Logout)' },
              { id: 'NAV_DATA', label: 'Navigasi & Data' },
              { id: 'ACCOUNT', label: 'Manajemen Akun' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border:
                    categoryFilter === cat.id
                      ? '1px solid #38bdf8'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  background:
                    categoryFilter === cat.id
                      ? 'rgba(56, 189, 248, 0.16)'
                      : 'rgba(15, 23, 42, 0.6)',
                  color: categoryFilter === cat.id ? '#38bdf8' : '#94a3b8'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Account Select & Clear */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <select
              value={accountFilter}
              onChange={(e) => handleAccountSelect(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            >
              <option value="ALL">Semua Akun Pengguna</option>
              {users.map((u) => (
                <option key={u.id} value={u.username}>
                  @{u.username} — {u.name}
                </option>
              ))}
            </select>

            <div style={{ position: 'relative' }}>
              <Search
                style={{
                  width: '14px',
                  height: '14px',
                  color: '#64748b',
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aktivitas / user / NIP..."
                style={{
                  padding: '7px 12px 7px 30px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  outline: 'none',
                  minWidth: '200px'
                }}
              />
            </div>

            {logs.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="btn-secondary"
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.76rem',
                  color: '#f43f5e',
                  borderColor: 'rgba(244, 63, 94, 0.3)'
                }}
              >
                <Trash2 style={{ width: '14px', height: '14px' }} />
                Bersihkan Log
              </button>
            )}
          </div>
        </div>

        {/* Log Entries List */}
        {filteredLogs.length === 0 ? (
          <div
            style={{
              padding: '48px 20px',
              textAlign: 'center',
              color: '#64748b',
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.08)'
            }}
          >
            <Clock style={{ width: '36px', height: '36px', marginBottom: '8px', opacity: 0.5 }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8' }}>
              Belum ada catatan aktivitas yang sesuai dengan filter.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    WAKTU KEJADIAN
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    AKUN PENGGUNA
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    STATUS / JENIS AKSI
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    RINCIAN AKTIVITAS
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    IP & LOKASI
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    PERANGKAT & BROWSER
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    color: '#38bdf8',
                    bg: 'rgba(56, 189, 248, 0.14)',
                    border: 'rgba(56, 189, 248, 0.35)',
                    icon: Activity
                  };
                  const ActionIcon = cfg.icon;

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ color: '#f8fafc', fontWeight: 600 }}>
                          {formatDateTime(log.timestamp)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {formatRelativeTime(log.timestamp)}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background:
                                log.userRole === 'Superadmin'
                                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                  : '#0284c7',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              flexShrink: 0
                            }}
                          >
                            {log.userAvatar || 'US'}
                          </div>
                          <div>
                            <div style={{ color: '#ffffff', fontWeight: 700, lineHeight: 1.2 }}>
                              {log.userName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                              @{log.username} • <span style={{ color: '#94a3b8' }}>{log.userRole}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: cfg.color,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`
                          }}
                        >
                          <ActionIcon style={{ width: '12px', height: '12px' }} />
                          {cfg.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#cbd5e1', maxWidth: '340px' }}>
                        {log.description}
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 700 }}>
                          <Globe style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                          {log.ipAddress || '-'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '0.7rem', marginTop: '2px' }}>
                          <MapPin style={{ width: '11px', height: '11px', color: '#64748b', flexShrink: 0 }} />
                          <span>{log.location || '-'}</span>
                          {log.isp ? <span style={{ color: '#64748b' }}>({log.isp})</span> : null}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#cbd5e1', fontSize: '0.75rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Monitor style={{ width: '13px', height: '13px', color: '#38bdf8', flexShrink: 0 }} />
                          <span>{log.deviceInfo || '-'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Logs Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '420px', padding: '24px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Bersihkan Seluruh Log Aktivitas?
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '20px' }}>
              Tindakan ini akan menghapus seluruh riwayat catatan aktivitas saat ini dan menyisakan satu catatan audit pembersihan log.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Batal
              </button>
              <button
                onClick={() => {
                  authService.clearActivityLogs(currentUser);
                  setShowClearConfirm(false);
                  loadAuditData();
                }}
                style={{
                  flex: 1,
                  background: '#f43f5e',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Ya, Hapus Log
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

