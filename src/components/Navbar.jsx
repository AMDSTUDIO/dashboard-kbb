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
        <div style={{ maxWidth: '1640px', margin: '0 auto', padding: '10px 14px' }}>
          
          {/* Top Header Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: '8px', 
            marginBottom: '8px' 
          }}>
            
            {/* Brand & Emblem BKPSDM (Left) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{ 
                padding: '3px 6px', 
                borderRadius: '8px', 
                background: '#ffffff', 
                border: '1px solid rgba(255, 255, 255, 0.9)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                flexShrink: 0
              }}>
                <img 
                  src="/logo-bkpsdm.png" 
                  alt="Logo BKPSDM KBB" 
                  style={{ height: '30px', width: 'auto', objectFit: 'contain' }} 
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <h1 style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1.15rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    DASHBOARD <span style={{ color: '#38bdf8' }}>EKSEKUTIF</span>
                  </h1>
                </div>
                <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  BKPSDM Kab. Bandung Barat
                </p>
              </div>
            </div>

            {/* Controls, User & Admin Actions (Right) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginLeft: 'auto' }}>
              
              {/* Live Status Pill */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  background: 'rgba(15, 23, 42, 0.7)', 
                  padding: '4px 8px', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
                title={`Update Terakhir: ${formattedTime} ${source === 'cache' ? '(Cache)' : '(Live)'}`}
              >
                <div className="pulse-dot" />
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  <strong style={{ color: '#f8fafc' }}>{formattedTime}</strong>
                </div>
              </div>

              {/* Total Records Counter */}
              {totalRecords > 0 && (
                <div className="badge badge-sky" style={{ fontSize: '0.65rem', padding: '3px 7px' }}>
                  {totalRecords.toLocaleString('id-ID')} Data
                </div>
              )}

              {/* Admin Action: Create New Account */}
              {currentUser && (
                <button
                  onClick={onOpenAdminUserModal}
                  className="btn-secondary"
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    borderColor: 'rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    borderRadius: '8px',
                    fontSize: '0.725rem',
                    fontWeight: 700
                  }}
                  title="Kelola & Buat Akun Pengguna Manual"
                >
                  <UserPlus style={{ width: '13px', height: '13px' }} />
                  <span>+ Akun</span>
                </button>
              )}

              {/* Live Refresh Button */}
              <button 
                onClick={onRefresh} 
                disabled={isSyncing}
                className="btn-primary"
                style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.725rem' }}
                title="Sinkronkan data terbaru dari Google Sheets"
              >
                <RefreshCw className={isSyncing ? 'spin-icon' : ''} style={{ width: '13px', height: '13px' }} />
                {isSyncing ? 'Sync...' : 'Sync'}
              </button>

              {/* Current User Profile Badge */}
              {currentUser && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px', borderLeft: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '8px' }}>
                    <div style={{ 
                      width: '22px', 
                      height: '22px', 
                      borderRadius: '50%', 
                      background: '#0284c7', 
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 800
                    }}>
                      {currentUser.avatar || 'US'}
                    </div>
                    <div style={{ textAlign: 'left', lineHeight: '1.1' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ffffff', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {currentUser.name}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowLogoutConfirm(true)}
                    className="btn-secondary"
                    style={{
                      padding: '4px 6px',
                      color: '#f43f5e',
                      borderColor: 'rgba(244, 63, 94, 0.3)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Keluar dari akun"
                  >
                    <LogOut style={{ width: '13px', height: '13px' }} />
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
            gap: '8px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            paddingTop: '8px',
            flexWrap: 'wrap'
          }}>
            {/* Left: Nav Tab Buttons (Touch scrollable horizontal container) */}
            <div className="tab-scroll-container" style={{ flex: '1 1 260px', width: '100%', paddingBottom: '2px' }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn-tab ${isActive ? 'active' : ''}`}
                    style={{ padding: '6px 12px', fontSize: '0.775rem' }}
                  >
                    <Icon style={{ width: '14px', height: '14px', color: isActive ? '#38bdf8' : '#94a3b8' }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Quick Search Box */}
            <div style={{ flex: '1 1 240px', width: '100%', maxWidth: '340px' }}>
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

