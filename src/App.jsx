import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import KpiOverview from './components/KpiOverview';
import ChartsSection from './components/ChartsSection';
import JabatanRecap from './components/JabatanRecap';
import ProyeksiPensiun from './components/ProyeksiPensiun';
import ProyeksiNaikJenjang from './components/ProyeksiNaikJenjang';
import EmployeeTable from './components/EmployeeTable';
import DrillDownModal from './components/DrillDownModal';
import LoginPage from './components/LoginPage';
import AdminUserModal from './components/AdminUserModal';
import { fetchLiveKepegawaianData } from './services/sheetsService';
import { authService } from './services/authService';
import { Loader2, AlertCircle, Sparkles, X, Phone, Mail, MapPin, Building, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [dataset, setDataset] = useState({ employees: [], stats: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [dataSource, setDataSource] = useState('live');

  // Drill-down position modal state
  const [drillDownJabatan, setDrillDownJabatan] = useState(null);

  // Single Employee Detail modal state
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  // Admin User Creation Modal state
  const [showAdminUserModal, setShowAdminUserModal] = useState(false);

  const loadData = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetchLiveKepegawaianData();
      setDataset(res.data);
      setLastSynced(res.lastSynced);
      setDataSource(res.source);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Gagal memuat data dari Google Sheets. Pastikan koneksi internet aktif.');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={loadData}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        source={dataSource}
        totalRecords={dataset.stats?.totalPegawai || 0}
        currentUser={currentUser}
        onLogout={handleLogout}
        employees={dataset.employees}
        onSelectEmployee={(emp) => setSelectedEmployeeDetail(emp)}
        onOpenMasterSearch={() => setActiveTab('master')}
        onOpenAdminUserModal={() => setShowAdminUserModal(true)}
      />

      {/* Admin User Management Modal */}
      {showAdminUserModal && (
        <AdminUserModal onClose={() => setShowAdminUserModal(false)} />
      )}

      {/* Main Workspace Content */}
      <main className="main-content">
        
        {/* Loading Spinner */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
            <Loader2 className="spin-icon" style={{ width: '48px', height: '48px', color: '#38bdf8' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
              Memuat & Menyinkronkan Data Google Sheets...
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
              Mengolah data 7.600+ pegawai, analisis BUP 60/58, dan proyeksi kenaikan jenjang.
            </p>
          </div>
        ) : error && dataset.employees.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
            <AlertCircle style={{ color: '#f43f5e', width: '48px', height: '48px', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '8px' }}>Gagal Mengambil Data Live</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>{error}</p>
            <button onClick={loadData} className="btn-primary">
              Coba Lagi Sekarang
            </button>
          </div>
        ) : (
          <>
            {/* KPI Header Overview (Always visible) */}
            <KpiOverview stats={dataset.stats} />

            {/* TAB 1: Ringkasan Eksekutif */}
            {activeTab === 'overview' && (
              <>
                <ChartsSection stats={dataset.stats} />
                <JabatanRecap 
                  jabatanList={dataset.stats?.jabatanList} 
                  onSelectJabatan={(jabName) => setDrillDownJabatan(jabName)}
                />
              </>
            )}

            {/* TAB 2: Rekap Jabatan Fungsional */}
            {activeTab === 'jabatan' && (
              <JabatanRecap 
                jabatanList={dataset.stats?.jabatanList} 
                onSelectJabatan={(jabName) => setDrillDownJabatan(jabName)}
              />
            )}

            {/* TAB 3: Proyeksi Pensiun BUP */}
            {activeTab === 'pensiun' && (
              <ProyeksiPensiun 
                employees={dataset.employees} 
                onSelectEmployee={(emp) => setSelectedEmployeeDetail(emp)}
              />
            )}

            {/* TAB 4: Proyeksi Naik Jenjang */}
            {activeTab === 'promotion' && (
              <ProyeksiNaikJenjang 
                employees={dataset.employees} 
                onSelectEmployee={(emp) => setSelectedEmployeeDetail(emp)}
              />
            )}

            {/* TAB 5: Master Data Pegawai */}
            {activeTab === 'master' && (
              <EmployeeTable 
                employees={dataset.employees} 
                onSelectEmployee={(emp) => setSelectedEmployeeDetail(emp)}
              />
            )}
          </>
        )}

      </main>

      {/* Drill-down Modal per Jabatan */}
      {drillDownJabatan && (
        <DrillDownModal
          jabatanName={drillDownJabatan}
          employees={dataset.employees}
          onClose={() => setDrillDownJabatan(null)}
        />
      )}

      {/* Single Employee Details Drawer Modal */}
      {selectedEmployeeDetail && (
        <div className="modal-overlay" onClick={() => setSelectedEmployeeDetail(null)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck style={{ color: '#38bdf8', width: '20px', height: '20px', flexShrink: 0 }} />
                <h3 style={{ fontSize: 'clamp(0.95rem, 3.5vw, 1.15rem)', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Kartu Detail Profil Pegawai
                </h3>
              </div>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="btn-secondary" style={{ padding: '6px', borderRadius: '50%', border: 'none', flexShrink: 0 }}>
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }}>
              <div>
                <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.3rem)', fontWeight: 800, color: '#ffffff', margin: 0 }}>{selectedEmployeeDetail.nama}</h2>
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontFamily: 'monospace', marginTop: '2px' }}>NIP. {selectedEmployeeDetail.nip}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span className={selectedEmployeeDetail.statusAsn === 'PNS' ? 'badge badge-pns' : 'badge badge-pppk'} style={{ fontSize: '0.7rem' }}>
                    {selectedEmployeeDetail.statusAsn} ({selectedEmployeeDetail.golongan})
                  </span>
                  <span className="badge badge-sky" style={{ fontSize: '0.7rem' }}>{selectedEmployeeDetail.gender}</span>
                </div>
              </div>

              <div className="responsive-grid-2col" style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>Jabatan Saat Ini</span>
                  <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{selectedEmployeeDetail.jabatan}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>TMT Pangkat/Jabatan</span>
                  <strong style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{selectedEmployeeDetail.tmtPangkat || '-'}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>OPD / Instansi</span>
                  <strong style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{selectedEmployeeDetail.opd}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>Unit Kerja</span>
                  <strong style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{selectedEmployeeDetail.unitKerja}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>Pendidikan Terakhir</span>
                  <strong style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{selectedEmployeeDetail.pendTingkat} {selectedEmployeeDetail.pendJurusan}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', color: '#94a3b8', display: 'block' }}>Tanggal Lahir (Parsed NIP)</span>
                  <strong style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{selectedEmployeeDetail.birthInfo ? selectedEmployeeDetail.birthInfo.formatted : '-'}</strong>
                </div>
              </div>

              {/* Proyeksi Summary Box */}
              <div className="responsive-grid-2col" style={{ background: 'rgba(56, 189, 248, 0.08)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', display: 'block', fontWeight: 600 }}>PROYEKSI PENSIUN (BUP)</span>
                  <strong style={{ fontSize: '1rem', color: '#fbbf24' }}>Tahun {selectedEmployeeDetail.retirementYear}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>BUP {selectedEmployeeDetail.bupYears} Tahun</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', display: 'block', fontWeight: 600 }}>PROYEKSI NAIK JENJANG</span>
                  <strong style={{ fontSize: '1rem', color: '#34d399' }}>Tahun {selectedEmployeeDetail.eligibleYear}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Target Pangkat: {selectedEmployeeDetail.targetPangkat}</span>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ fontSize: '0.785rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedEmployeeDetail.noHp && <div><Phone style={{ width: '13px', height: '13px', display: 'inline', marginRight: '8px', color: '#38bdf8' }} /> {selectedEmployeeDetail.noHp}</div>}
                {selectedEmployeeDetail.email && <div><Mail style={{ width: '13px', height: '13px', display: 'inline', marginRight: '8px', color: '#38bdf8' }} /> {selectedEmployeeDetail.email}</div>}
                {selectedEmployeeDetail.alamat && <div><MapPin style={{ width: '13px', height: '13px', display: 'inline', marginRight: '8px', color: '#38bdf8' }} /> {selectedEmployeeDetail.alamat}</div>}
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'right' }}>
              <button onClick={() => setSelectedEmployeeDetail(null)} className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.8rem' }}>
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '20px 24px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
        <div>Dashboard & Infografik Kepegawaian Eksekutif KBB &copy; 2026. Live Sync via Google Sheets API.</div>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Developed by <a href="https://creativedivisions.my.id" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 700 }}>creativedivisions.my.id</a>
        </div>
      </footer>
    </div>
  );
}
