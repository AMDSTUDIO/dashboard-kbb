import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

export default function AdminUserModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'list'
  const [usersList, setUsersList] = useState([]);
  
  // Form State
  const [nama, setNama] = useState('');
  const [nip, setNip] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin Eksekutif BKPSDM');
  const [opd, setOpd] = useState('BKPSDM Kabupaten Bandung Barat');

  const [message, setMessage] = useState({ type: '', text: '' });

  const loadUsers = () => {
    setUsersList(authService.getAllUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
        opd
      });

      setMessage({ 
        type: 'success', 
        text: `Akun untuk ${newUser.name} (@${newUser.username}) berhasil dibuat!` 
      });

      // Clear form
      setNama('');
      setNip('');
      setUsername('');
      setPassword('');

      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal membuat akun baru.' });
    }
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun ${userName}?`)) {
      authService.deleteUser(userId);
      loadUsers();
      setMessage({ type: 'success', text: `Akun ${userName} telah dihapus.` });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              padding: '6px', 
              borderRadius: '8px', 
              background: 'rgba(56, 189, 248, 0.12)', 
              color: '#38bdf8',
              flexShrink: 0
            }}>
              <UserPlus style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
                Manajemen & Pembuatan Akun
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                Kelola akun admin atau pimpinan secara manual
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px', borderRadius: '50%', border: 'none', flexShrink: 0 }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Modal Sub Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(15, 23, 42, 0.4)' }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              background: activeTab === 'create' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'create' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.785rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'create' ? '2px solid #38bdf8' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <UserPlus style={{ width: '14px', height: '14px' }} />
            Buat Akun Baru
          </button>

          <button
            onClick={() => setActiveTab('list')}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: 'none',
              background: activeTab === 'list' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
              color: activeTab === 'list' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              fontSize: '0.785rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'list' ? '2px solid #38bdf8' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Users style={{ width: '14px', height: '14px' }} />
            Daftar Akun ({usersList.length})
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '65vh' }}>
          
          {/* Notification Alert Message */}
          {message.text && (
            <div style={{ 
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)', 
              border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`, 
              borderRadius: '12px', 
              padding: '12px 16px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              {message.type === 'success' ? (
                <Check style={{ color: '#34d399', width: '20px', height: '20px' }} />
              ) : (
                <AlertCircle style={{ color: '#f43f5e', width: '20px', height: '20px' }} />
              )}
              <div style={{ fontSize: '0.85rem', color: message.type === 'success' ? '#a7f3d0' : '#fda4af' }}>
                {message.text}
              </div>
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleSubmitCreate} className="responsive-grid-2col" style={{ gap: '16px' }}>
              
              {/* Nama Lengkap */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
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

              {/* NIP */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  NIP Pegawai *
                </label>
                <input 
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  placeholder="198501012010011001"
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Kata Sandi (Password) *
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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

              {/* Role */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
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
                </select>
              </div>

              {/* OPD */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
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
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                  <UserPlus style={{ width: '18px', height: '18px' }} />
                  Simpan & Buat Akun Pengguna
                </button>
              </div>

            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {usersList.map((usr) => (
                <div 
                  key={usr.id} 
                  style={{
                    padding: '14px 16px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem'
                    }}>
                      {usr.avatar || 'US'}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
                        {usr.name} {usr.isDefault && <span style={{ fontSize: '0.65rem', color: '#38bdf8', marginLeft: '6px' }}>(Bawaan Sistem)</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>@{usr.username}</span> • NIP. {usr.nip}
                      </div>
                      <div style={{ fontSize: '0.725rem', color: '#cbd5e1', marginTop: '2px' }}>
                        {usr.role} • {usr.opd}
                      </div>
                    </div>
                  </div>

                  {!usr.isDefault && (
                    <button
                      onClick={() => handleDeleteUser(usr.id, usr.name)}
                      className="btn-secondary"
                      style={{ padding: '8px', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)', borderRadius: '8px' }}
                      title="Hapus Akun Pengguna"
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
