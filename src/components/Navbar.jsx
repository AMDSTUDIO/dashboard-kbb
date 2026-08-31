import React from 'react';
import { 
  Building2, 
  RefreshCw, 
  LayoutDashboard, 
  Users, 
  CalendarX, 
  TrendingUp, 
  Database,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onRefresh, 
  isSyncing, 
  lastSynced, 
  source,
  totalRecords 
}) {
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
    <header className="glass-card" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, sticky: 'top', zIndex: 100 }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '16px 24px' }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          
          {/* Brand & Emblem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)'
            }}>
              <Building2 style={{ color: '#ffffff', width: '24px', height: '24px' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                  DASHBOARD KEPEGAWAIAN <span style={{ color: '#38bdf8' }}>EKSEKUTIF</span>
                </h1>
                <span className="badge badge-sky" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                  <Sparkles style={{ width: '10px', height: '10px' }} /> KBB LIVE
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                Rekapitulasi Jabatan Fungsional PNS & PPPK, Proyeksi BUP & Naik Jenjang
              </p>
            </div>
          </div>

          {/* Sync Status & Action Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Live Indicator */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'rgba(15, 23, 42, 0.6)', 
              padding: '6px 14px', 
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div className="pulse-dot" />
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ color: '#94a3b8' }}>Update Terakhir: </span>
                <strong style={{ color: '#f8fafc' }}>{formattedTime}</strong>
                {source === 'cache' && <span style={{ color: '#f59e0b', marginLeft: '6px' }}>(Cache)</span>}
              </div>
            </div>

            {/* Total Records Counter */}
            {totalRecords > 0 && (
              <div className="badge badge-sky" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                {totalRecords.toLocaleString('id-ID')} Data Pegawai
              </div>
            )}

            {/* Refresh Button */}
            <button 
              onClick={onRefresh} 
              disabled={isSyncing}
              className="btn-primary"
              title="Sinkronkan data terbaru dari Google Sheets"
            >
              <RefreshCw className={isSyncing ? 'spin-icon' : ''} style={{ width: '16px', height: '16px' }} />
              {isSyncing ? 'Menyinkronkan...' : 'Live Sync'}
            </button>
          </div>
        </div>

        {/* Tab Bar Navigation */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn-tab ${isActive ? 'active' : ''}`}
              >
                <Icon style={{ width: '18px', height: '18px', color: isActive ? '#38bdf8' : '#94a3b8' }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
