import React, { useState } from 'react';
import { 
  Building2, 
  RefreshCw, 
  LayoutDashboard, 
  Users, 
  CalendarX, 
  TrendingUp, 
  Database,
  Sparkles,
  LogOut,
  UserPlus
} from 'lucide-react';
import QuickSearch from './QuickSearch';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  isSyncing, 
  lastSynced, 
  source,
  totalRecords,
  currentUser,
  onLogout,
  employees = [],
  onSelectEmployee,
  onOpenMasterSearch,
  onOpenAdminUserModal
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Ringkasan Eksekutif', shortLabel: 'Ringkasan', icon: LayoutDashboard },
    { id: 'jabatan', label: 'Rekap Jabatan Fungsional', shortLabel: 'Rekap Jabatan', icon: Users },
    { id: 'pensiun', label: 'Proyeksi Pensiun BUP', shortLabel: 'Pensiun BUP', icon: CalendarX },
    { id: 'promotion', label: 'Proyeksi Naik Jenjang', shortLabel: 'Naik Jenjang', icon: TrendingUp },
    { id: 'master', label: 'Master Data Pegawai', shortLabel: 'Master Data', icon: Database },
  ];

  const formattedTime = lastSynced ? new Date(lastSynced).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '-';

  return (
    <>
      <header className="glass-card main-navbar" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="navbar-container" style={{ maxWidth: '1640px', margin: '0 auto', padding: '10px 14px' }}>
          
          {/* DESKTOP HEADER (Screen > 768px) */}
          <div className="desktop-header-row desktop-only" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            {/* Brand & Emblem BKPSDM (Left) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <div style={{ 
                padding: '4px 8px', 
                borderRadius: '10px', 
                background: '#ffffff', 
                border: '1px solid rgba(255, 255, 255, 0.9)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                flexShrink: 0
              }}>
                <img 
                  src="/logo-bkpsdm.png" 
                  alt="Logo BKPSDM KBB" 
                  style={{ height: '30px', width: 'auto', objectFit: 'contain' }} 
                />
              </div>
              <div>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                  DASHBOARD <span style={{ color: '#38bdf8' }}>EKSEKUTIF</span>
                </h1>
                <p style={{ fontSize: '0.675rem', color: '#94a3b8', margin: 0, whiteSpace: 'nowrap' }}>
                  BKPSDM Kab. Bandung Barat
                </p>
              </div>
            </div>

            {/* Desktop Controls (Right) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              {/* Live Status Pill */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'rgba(15, 23, 42, 0.7)', 
                  padding: '5px 10px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
                title={`Update Terakhir: ${formattedTime} ${source === 'cache' ? '(Cache)' : '(Live)'}`}
              >
                <div className="pulse-dot" />
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  <strong style={{ color: '#f8fafc' }}>{formattedTime}</strong>
                </div>
              </div>

              {/* Total Records Counter */}
              {totalRecords > 0 && (
                <div className="badge badge-sky" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>
                  {totalRecords.toLocaleString('id-ID')} Data
                </div>
              )}

              {/* Admin Action: Create New Account */}
              {currentUser && (
                <button
                  onClick={onOpenAdminUserModal}
                  className="btn-secondary"
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}
                  title="Kelola & Buat Akun Pengguna Manual"
                >
                  <UserPlus style={{ width: '14px', height: '14px' }} />
                  <span>+ Akun</span>
                </button>
              )}

              {/* Live Refresh Button */}
              <button 
                onClick={onRefresh} 
                disabled={isSyncing}
                className="btn-primary"
                style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem' }}
                title="Sinkronkan data terbaru dari Google Sheets"
              >
                <RefreshCw className={isSyncing ? 'spin-icon' : ''} style={{ width: '14px', height: '14px' }} />
                {isSyncing ? 'Sync...' : 'Sync'}
              </button>

              {/* Current User Profile Badge */}
              {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '6px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '3px 8px', borderRadius: '8px' }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: '#0284c7', 
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 800
                    }}>
                      {currentUser.avatar || 'US'}
                    </div>
                    <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                      <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#ffffff', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUser.name}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    className="btn-secondary"
                    style={{
                      padding: '5px 8px',
                      color: '#f43f5e',
                      borderColor: 'rgba(244, 63, 94, 0.3)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Keluar dari akun"
                  >
                    <LogOut style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* MOBILE HEADER (Screen <= 768px) */}
          <div className="mobile-header-row mobile-only" style={{ flexDirection: 'column', width: '100%', marginBottom: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              width: '100%'
            }}>
              {/* Left: Logo Only on Mobile */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ 
                  padding: '3px 8px', 
                  borderRadius: '8px', 
                  background: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}>
                  <img src="/logo-bkpsdm.png" alt="BKPSDM KBB" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                </div>
              </div>

              {/* Right Mobile Compact Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {/* Live Status Pill */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  padding: '3px 6px', 
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '0.65rem'
                }}>
                  <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
                  <span style={{ color: '#f8fafc', fontWeight: 700 }}>{formattedTime}</span>
                </div>

                {/* Sync Icon Button */}
                <button 
                  onClick={onRefresh} 
                  disabled={isSyncing}
                  className="btn-primary"
                  style={{ padding: '5px 8px', borderRadius: '6px', minWidth: 'auto' }}
                  title="Sinkronkan Data"
                >
                  <RefreshCw className={isSyncing ? 'spin-icon' : ''} style={{ width: '13px', height: '13px' }} />
                </button>

                {/* Admin Add User Button */}
                {currentUser && (
                  <button
                    onClick={onOpenAdminUserModal}
                    className="btn-secondary"
                    style={{ padding: '5px 8px', borderRadius: '6px', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.3)' }}
                    title="Tambah Akun"
                  >
                    <UserPlus style={{ width: '13px', height: '13px' }} />
                  </button>
                )}

                {/* Mobile User Avatar & Logout Trigger */}
                {currentUser && (
                  <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{ 
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '50%', 
                      background: '#0284c7', 
                      color: '#ffffff', 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Akun & Keluar"
                  >
                    {currentUser.avatar || 'US'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls & Search Section */}
          <div style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.06)', 
            paddingTop: '8px'
          }}>
            <div className="nav-controls-wrapper">
              {/* Tab Navigation Scroll Container */}
              <div className="tab-scroll-container">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`btn-tab ${isActive ? 'active' : ''}`}
                    >
                      <Icon style={{ width: '14px', height: '14px', flexShrink: 0, color: isActive ? '#38bdf8' : '#94a3b8' }} />
                      <span className="desktop-tab-label">{tab.label}</span>
                      <span className="mobile-tab-label">{tab.shortLabel}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Search */}
              <div className="quick-search-header-container">
                <QuickSearch 
                  employees={employees} 
                  onSelectEmployee={onSelectEmployee} 
                  onOpenMasterSearch={onOpenMasterSearch} 
                  placeholder="Cari Nama / NIP..."
                />
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%', 
              background: 'rgba(244, 63, 94, 0.15)', 
              color: '#f43f5e', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <LogOut style={{ width: '24px', height: '24px' }} />
            </div>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Konfirmasi Keluar
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '24px' }}>
              Apakah Anda yakin ingin keluar dari akun <strong>{currentUser?.name}</strong>? Anda perlu login kembali untuk mengakses data eksekutif.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                style={{ 
                  flex: 1,
                  background: '#f43f5e', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '10px', 
                  padding: '10px 16px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


