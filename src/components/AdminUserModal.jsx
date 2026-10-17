import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Trash2,
  X,
  Check,
  AlertCircle,
  KeyRound,
  Activity,
  Eye,
  EyeOff,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Loader2
} from 'lucide-react';
import { authService } from '../services/authService';
import { findEmployeeByNip } from '../services/sheetsService';

export default function AdminUserModal({ onClose, onViewAccountLogs, onAccountDeleted, onAccountsUpdated }) {
  const [approvedList, setApprovedList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'pending' | 'list' | 'create'

  // Role selection state for pending approvals: { [userId]: roleString }
  const [pendingRoles, setPendingRoles] = useState({});

  // Create Form State
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [role, setRole] = useState('Admin Eksekutif BKPSDM');
  const [opd, setOpd] = useState('BKPSDM Kabupaten Bandung Barat');
  const [jabatan, setJabatan] = useState('');
  const [isCheckingNip, setIsCheckingNip] = useState(false);

  // Password Reset Inline State
  const [editingPasswordUserId, setEditingPasswordUserId] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);

  const [message, setMessage] = useState({ type: '', text: '' });

  const loadUsers = (autoSwitchToPending = false) => {
    const approved = authService.getApprovedUsers();
    const pending = authService.getPendingUsers();
    setApprovedList(approved);
    setPendingList(pending);

    const roleMap = {};
    pending.forEach((u) => {
      roleMap[u.id] = u.role || 'Staf Analis Kepegawaian';
    });
    setPendingRoles(roleMap);

    if (autoSwitchToPending && pending.length > 0) {
      setActiveTab('pending');
    }
    if (onAccountsUpdated) {
      onAccountsUpdated();
    }
  };

  useEffect(() => {
    loadUsers(true);
  }, []);

  const handleLookupNipCreate = async () => {
    const clean = String(nip || '').replace(/\s+/g, '').trim();
    if (!clean) return;
    setIsCheckingNip(true);
    setMessage({ type: '', text: '' });
    try {
      const emp = await findEmployeeByNip(clean);
      if (emp) {
        setNama(emp.nama || '');
        setOpd(emp.opd || 'BKPSDM Kabupaten Bandung Barat');
        setJabatan(emp.jabatan || '');
        if (!username) {
          setUsername(
            (emp.nama || '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .substring(0, 14)
          );
        }
        setMessage({
          type: 'success',
          text: `Data NIP ditemukan: ${emp.nama} (${emp.jabatan})`
        });
      } else {
        setMessage({
          type: 'error',
          text: 'NIP tidak ditemukan pada Master Data Pegawai KBB. Anda tetap bisa mengisi manual.'
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Gagal melakukan pencarian NIP.' });
    } finally {
      setIsCheckingNip(false);
    }
  };

  const handleSubmitCreate = (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const newUser = authService.registerUser({
        name: nama,
        nip,
        username,
        password,
        role,
        opd,
        jabatan
      });

      setMessage({
        type: 'success',
        text: `Akun aktif untuk ${newUser.name} (@${newUser.username}) berhasil dibuat!`
      });

      setNama('');
      setNip('');
      setUsername('');
      setPassword('');
      setJabatan('');
      loadUsers(false);
      setActiveTab('list');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal membuat akun baru.' });
    }
  };

  const handleApprove = (user) => {
    setMessage({ type: '', text: '' });
    try {
      const selectedRole = pendingRoles[user.id] || user.role || 'Staf Analis Kepegawaian';
      authService.approveUser(user.id, selectedRole);
      loadUsers(false);
      setMessage({
        type: 'success',
        text: `Akun ${user.name} (@${user.username}) telah disetujui (Approved) sebagai "${selectedRole}".`
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyetujui akun.' });
    }
  };

  const handleReject = (user) => {
    if (window.confirm(`Tolak dan hapus pengajuan pendaftaran akun dari ${user.name} (@${user.username})?`)) {
      try {
        authService.rejectUser(user.id);
        loadUsers(false);
        setMessage({
          type: 'success',
          text: `Pengajuan akun ${user.name} (@${user.username}) telah ditolak.`
        });
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Gagal menolak pengajuan akun.' });
      }
    }
  };

  const handleDeleteUser = (userId, userName) => {
    const currentUser = authService.getCurrentUser();
    const isDeletingSelf = currentUser && currentUser.id === userId;

    const confirmMsg = isDeletingSelf
      ? `Anda sedang menggunakan akun ${userName}. Menghapus akun ini akan mengeluarkan Anda dari sesi saat ini. Lanjutkan?`
      : `Apakah Anda yakin ingin menghapus akun ${userName} secara permanen?`;

    if (window.confirm(confirmMsg)) {
      try {
        authService.deleteUser(userId);
        if (isDeletingSelf && onAccountDeleted) {
          onAccountDeleted();
          return;
        }
        loadUsers(false);
        setMessage({ type: 'success', text: `Akun ${userName} telah dihapus dari sistem.` });
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Gagal menghapus akun.' });
      }
    }
  };

  const handleSaveNewPassword = (user) => {
    setMessage({ type: '', text: '' });
    try {
      authService.updateUserPassword(user.id, newPasswordValue);
      setEditingPasswordUserId(null);
      setNewPasswordValue('');
      loadUsers(false);
      setMessage({
        type: 'success',
        text: `Kata sandi untuk akun ${user.name} (@${user.username}) berhasil diperbarui.`
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui kata sandi.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '760px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.85)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '7px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                flexShrink: 0
              }}
            >
              <ShieldCheck style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3
                  style={{
                    fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)',
                    fontWeight: 800,
                    color: '#ffffff',
                    margin: 0,
                    lineHeight: 1.2
                  }}
                >
                  Manajemen & Approval Akun
                </h3>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(245, 158, 11, 0.18)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.4)'
                  }}
                >
                  SUPERADMIN
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Setujui pengajuan akun baru, buat akun manual, ubah sandi, atau hapus akses
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '50%', border: 'none', flexShrink: 0 }}
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Modal Sub Tab Bar */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.4)'
          }}
        >
          <button
            onClick={() => {
              setActiveTab('pending');
              setMessage({ type: '', text: '' });
            }}
            style={{
              flex: 1,
              padding: '11px 8px',
              border: 'none',
              background: activeTab === 'pending' ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
              color: activeTab === 'pending' ? '#fbbf24' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'pending' ? '2px solid #fbbf24' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Clock style={{ width: '14px', height: '14px' }} />
            Approval Akun
            {pendingList.length > 0 && (
              <span
                style={{
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '999px'
                }}
              >
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('list');
              setMessage({ type: '', text: '' });
            }}
            style={{
              flex: 1,
              padding: '11px 8px',
              border: 'none',
              background: activeTab === 'list' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'list' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'list' ? '2px solid #38bdf8' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Users style={{ width: '14px', height: '14px' }} />
            Akun Aktif ({approvedList.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('create');
              setMessage({ type: '', text: '' });
            }}
            style={{
              flex: 1,
              padding: '11px 8px',
              border: 'none',
              background: activeTab === 'create' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'create' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'create' ? '2px solid #38bdf8' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus style={{ width: '14px', height: '14px' }} />
            + Buat Manual
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '68vh' }}>
          {/* Notification Alert Message */}
          {message.text && (
            <div
              style={{
                background:
                  message.type === 'success'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(244, 63, 94, 0.12)',
                border: `1px solid ${
                  message.type === 'success'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(244, 63, 94, 0.3)'
                }`,
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {message.type === 'success' ? (
                <Check style={{ color: '#34d399', width: '20px', height: '20px', flexShrink: 0 }} />
              ) : (
                <AlertCircle style={{ color: '#f43f5e', width: '20px', height: '20px', flexShrink: 0 }} />
              )}
              <div
                style={{
                  fontSize: '0.84rem',
                  color: message.type === 'success' ? '#a7f3d0' : '#fda4af'
                }}
              >
                {message.text}
              </div>
            </div>
          )}

          {/* TAB 1: PENDING APPROVAL LIST */}
          {activeTab === 'pending' ? (
            pendingList.length === 0 ? (
              <div
                style={{
                  padding: '44px 20px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)'
                }}
              >
                <CheckCircle2 style={{ width: '36px', height: '36px', marginBottom: '10px', color: '#34d399', opacity: 0.7 }} />
                <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                  Tidak Ada Antrean Persetujuan Akun
                </div>
                <p style={{ fontSize: '0.8rem', margin: 0 }}>
                  Semua pengajuan pendaftaran akun dari halaman Login telah diproses.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingList.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '16px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                            color: '#fbbf24',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          {req.avatar || 'US'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff' }}>
                              {req.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.65rem',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                fontWeight: 800
                              }}
                            >
                              MENUNGGU APPROVAL
                            </span>
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '2px' }}>
                            <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>@{req.username}</span> • NIP. {req.nip}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#cbd5e1', marginTop: '2px' }}>
                            {req.jabatan && req.jabatan !== '-' ? `${req.jabatan} • ` : ''}{req.opd}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Diajukan: {req.createdAt ? new Date(req.createdAt).toLocaleString('id-ID') : '-'}
                      </div>
                    </div>

                    {/* Role Assignment + Approve / Reject Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                          Tetapkan Role:
                        </span>
                        <select
                          value={pendingRoles[req.id] || req.role}
                          onChange={(e) =>
                            setPendingRoles((prev) => ({
                              ...prev,
                              [req.id]: e.target.value
                            }))
                          }
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            background: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            outline: 'none'
                          }}
                        >
                          <option value="Staf Analis Kepegawaian">Staf Analis Kepegawaian</option>
                          <option value="Pengawas Kepegawaian">Pengawas Kepegawaian</option>
                          <option value="Admin Eksekutif BKPSDM">Admin Eksekutif BKPSDM</option>
                          <option value="Pimpinan / Kepala Badan">Pimpinan / Kepala Badan</option>
                          <option value="Superadmin">Superadmin</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleApprove(req)}
                          className="btn-primary"
                          style={{
                            padding: '7px 14px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #10b981, #059669)'
                          }}
                        >
                          <CheckCircle2 style={{ width: '15px', height: '15px' }} />
                          Setujui (Approve)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(req)}
                          className="btn-secondary"
                          style={{
                            padding: '7px 12px',
                            fontSize: '0.78rem',
                            borderRadius: '8px',
                            color: '#f43f5e',
                            borderColor: 'rgba(244, 63, 94, 0.35)'
                          }}
                        >
                          <XCircle style={{ width: '15px', height: '15px' }} />
                          Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'create' ? (
            /* TAB 2: MANUAL CREATE USER FORM */
            <form
              onSubmit={handleSubmitCreate}
              className="responsive-grid-2col"
              style={{ gap: '16px' }}
            >
              {/* NIP + Auto-fill Lookup */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  NIP Pegawai (Klik Cek NIP untuk isi Nama & OPD otomatis) *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="198501012010011001"
                    required
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleLookupNipCreate}
                    disabled={isCheckingNip}
                    className="btn-secondary"
                    style={{
                      padding: '0 14px',
                      borderRadius: '10px',
                      color: '#38bdf8',
                      borderColor: 'rgba(56, 189, 248, 0.35)',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    {isCheckingNip ? <Loader2 className="spin-icon" style={{ width: '15px', height: '15px' }} /> : <Search style={{ width: '15px', height: '15px' }} />}
                    Cek NIP
                  </button>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  Nama Lengkap (beserta Gelar) *
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Drs. H. Rahmat Hidayat, M.Si"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Username */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  Username Login *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="rahmathidayat"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  Kata Sandi (Minimal 6 Karakter) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCreatePass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePass(!showCreatePass)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {showCreatePass ? (
                      <EyeOff style={{ width: '16px', height: '16px' }} />
                    ) : (
                      <Eye style={{ width: '16px', height: '16px' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  Role Hak Akses *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="Admin Eksekutif BKPSDM">Admin Eksekutif BKPSDM</option>
                  <option value="Pimpinan / Kepala Badan">Pimpinan / Kepala Badan</option>
                  <option value="Pengawas Kepegawaian">Pengawas Kepegawaian</option>
                  <option value="Staf Analis Kepegawaian">Staf Analis Kepegawaian</option>
                  <option value="Superadmin">Superadmin (Akses Penuh & Audit Log)</option>
                </select>
              </div>

              {/* OPD */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  OPD / Instansi
                </label>
                <input
                  type="text"
                  value={opd}
                  onChange={(e) => setOpd(e.target.value)}
                  placeholder="BKPSDM Kabupaten Bandung Barat"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Submit */}
              <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                  <UserPlus style={{ width: '18px', height: '18px' }} />
                  Simpan & Aktifkan Akun Pengguna
                </button>
              </div>
            </form>
          ) : approvedList.length === 0 ? (
            /* TAB 3: APPROVED USERS LIST (EMPTY) */
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#94a3b8',
                background: 'rgba(15, 23, 42, 0.4)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
              }}
            >
              <Users style={{ width: '36px', height: '36px', marginBottom: '10px', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                Belum Ada Akun Aktif Terdaftar
              </div>
              <p style={{ fontSize: '0.8rem', margin: '0 0 14px 0' }}>
                Silakan setujui pengajuan akun baru atau buat akun secara manual.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="btn-primary"
                style={{ margin: '0 auto' }}
              >
                <UserPlus style={{ width: '16px', height: '16px' }} />
                Buat Akun Manual
              </button>
            </div>
          ) : (
            /* TAB 3: APPROVED USERS LIST */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {approvedList.map((usr) => {
                const isEditingPass = editingPasswordUserId === usr.id;

                return (
                  <div
                    key={usr.id}
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: usr.isSuperAdmin
                        ? '1px solid rgba(245, 158, 11, 0.35)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: usr.isSuperAdmin
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                              : '#0284c7',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            flexShrink: 0
                          }}
                        >
                          {usr.avatar || 'US'}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                              {usr.name}
                            </span>
                            {usr.isSuperAdmin && (
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '2px 7px',
                                  borderRadius: '999px',
                                  background: 'rgba(245, 158, 11, 0.18)',
                                  color: '#fbbf24',
                                  fontWeight: 700
                                }}
                              >
                                Superadmin
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                              @{usr.username}
                            </span>{' '}
                            • NIP. {usr.nip}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '2px' }}>
                            {usr.role} • {usr.opd}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {onViewAccountLogs && (
                          <button
                            onClick={() => {
                              onViewAccountLogs(usr.username);
                              onClose();
                            }}
                            className="btn-secondary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.74rem',
                              color: '#38bdf8',
                              borderColor: 'rgba(56, 189, 248, 0.3)',
                              borderRadius: '8px'
                            }}
                            title="Lihat Log Aktivitas Akun Ini"
                          >
                            <Activity style={{ width: '14px', height: '14px' }} />
                            Log Akun
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (isEditingPass) {
                              setEditingPasswordUserId(null);
                              setNewPasswordValue('');
                            } else {
                              setEditingPasswordUserId(usr.id);
                              setNewPasswordValue('');
                            }
                          }}
                          className="btn-secondary"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.74rem',
                            color: '#fbbf24',
                            borderColor: 'rgba(245, 158, 11, 0.3)',
                            borderRadius: '8px'
                          }}
                          title="Ubah / Reset Kata Sandi"
                        >
                          <KeyRound style={{ width: '14px', height: '14px' }} />
                          Ubah Sandi
                        </button>

                        <button
                          onClick={() => handleDeleteUser(usr.id, usr.name)}
                          className="btn-secondary"
                          style={{
                            padding: '6px 8px',
                            color: '#f43f5e',
                            borderColor: 'rgba(244, 63, 94, 0.3)',
                            borderRadius: '8px'
                          }}
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 style={{ width: '15px', height: '15px' }} />
                        </button>
                      </div>
                    </div>

                    {/* Inline Password Change Box */}
                    {isEditingPass && (
                      <div
                        style={{
                          paddingTop: '10px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                          <input
                            type={showResetPass ? 'text' : 'password'}
                            value={newPasswordValue}
                            onChange={(e) => setNewPasswordValue(e.target.value)}
                            placeholder={`Kata sandi baru untuk @${usr.username} (min. 6 karakter)`}
                            style={{
                              width: '100%',
                              padding: '8px 34px 8px 12px',
                              background: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              borderRadius: '8px',
                              color: '#ffffff',
                              fontSize: '0.8rem',
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowResetPass(!showResetPass)}
                            style={{
                              position: 'absolute',
                              right: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer'
                            }}
                          >
                            {showResetPass ? (
                              <EyeOff style={{ width: '15px', height: '15px' }} />
                            ) : (
                              <Eye style={{ width: '15px', height: '15px' }} />
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveNewPassword(usr)}
                          className="btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.78rem', borderRadius: '8px' }}
                        >
                          Simpan Sandi
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPasswordUserId(null);
                            setNewPasswordValue('');
                          }}
                          className="btn-secondary"
                          style={{ padding: '8px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
