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
    { id: 'overview', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
    { id: 'jabatan', label: 'Rekap Jabatan Fungsional', icon: Users },
    { id: 'pensiun', label: 'Proyeksi Pensiun BUP', icon: CalendarX },
    { id: 'promotion', label: 'Proyeksi Naik Jenjang', icon: TrendingUp },
    { id: 'master', label: 'Master Data Pegawai', icon: Database },
  ];

  const formattedTime = lastSynced ? new Date(lastSynced).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) : '-';

  return (
    <>
      <header className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1640px', margin: '0 auto', padding: '12px 16px' }}>
          
          {/* Top Header Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: '12px', 
            marginBottom: '12px' 
          }}>
            
            {/* Brand & Emblem BKPSDM (Left) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ 
                padding: '4px 8px', 
                borderRadius: '10px', 
                background: '#ffffff', 
                border: '1px solid rgba(255, 255, 255, 0.9)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                flexShrink: 0
              }}>
                <img 
                  src="/logo-bkpsdm.png" 
                  alt="Logo BKPSDM KBB" 
                  style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap' }}>
                    DASHBOARD KEPEGAWAIAN <span style={{ color: '#38bdf8' }}>EKSEKUTIF</span>
                  </h1>
                  <span className="badge badge-sky" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                    <Sparkles style={{ width: '9px', height: '9px' }} /> LIVE
                  </span>
                </div>
                <p style={{ fontSize: '0.725rem', color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Pemerintah Kabupaten Bandung Barat
                </p>
              </div>
            </div>

            {/* Controls, User & Admin Actions (Right) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
              
              {/* Live Indicator */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: 'rgba(15, 23, 42, 0.7)', 
                  padding: '5px 10px', 
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
                title={`Update Terakhir: ${formattedTime} ${source === 'cache' ? '(Cache)' : '(Live)'}`}
              >
                <div className="pulse-dot" />
                <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                  <strong style={{ color: '#f8fafc' }}>{formattedTime}</strong>
                </div>
              </div>

              {/* Total Records Counter */}
              {totalRecords > 0 && (
                <div className="badge badge-sky" style={{ fontSize: '0.68rem', padding: '4px 8px' }}>
                  {totalRecords.toLocaleString('id-ID')} Data
                </div>
              )}

              {/* Admin Action: Create New Account */}
              {currentUser && (
                <button
                  onClick={onOpenAdminUserModal}
                  className="btn-secondary"
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '10px',
                    fontSize: '0.775rem',
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
                style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.775rem' }}
                title="Sinkronkan data terbaru dari Google Sheets"
              >
                <RefreshCw className={isSyncing ? 'spin-icon' : ''} style={{ width: '14px', height: '14px' }} />
                {isSyncing ? 'Sync...' : 'Live Sync'}
              </button>

              {/* Current User Profile Badge */}
              {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '6px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '3px 8px', borderRadius: '10px' }}>
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
                      <div style={{ fontSize: '0.625rem', color: '#38bdf8' }}>
                        {currentUser.role}
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
                      borderRadius: '8px',
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

          {/* Tab Bar Navigation & QuickSearch Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '12px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            paddingTop: '10px',
            flexWrap: 'wrap'
          }}>
            {/* Left: Nav Tab Buttons (Touch scrollable horizontal container) */}
            <div className="tab-scroll-container" style={{ flex: 1, minWidth: '280px' }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn-tab ${isActive ? 'active' : ''}`}
                  >
                    <Icon style={{ width: '16px', height: '16px', color: isActive ? '#38bdf8' : '#94a3b8' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Quick Search Box */}
            <div style={{ width: '100%', maxWidth: '340px' }}>
              <QuickSearch 
                employees={employees} 
                onSelectEmployee={onSelectEmployee} 
                onOpenMasterSearch={onOpenMasterSearch} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal - Rendered outside header to prevent fixed positioning bug caused by backdrop-filter */}
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

