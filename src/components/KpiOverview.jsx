import React from 'react';
import { Users, UserCheck, CalendarX, TrendingUp, ShieldCheck, Briefcase } from 'lucide-react';

export default function KpiOverview({ stats }) {
  if (!stats) return null;

  const currentYear = new Date().getFullYear();

  return (
    <div className="kpi-grid">
      {/* Card 1: Total Pegawai */}
      <div className="glass-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="kpi-title">Total Pegawai Recorded</span>
          <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.12)', borderRadius: '10px' }}>
            <Users style={{ color: '#38bdf8', width: '20px', height: '20px' }} />
          </div>
        </div>
        <div className="kpi-value">
          {stats.totalPegawai ? stats.totalPegawai.toLocaleString('id-ID') : '0'}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
          <span className="badge badge-pns">
            <ShieldCheck style={{ width: '12px', height: '12px' }} /> PNS: {stats.totalPNS?.toLocaleString('id-ID')}
          </span>
          <span className="badge badge-pppk">
            <UserCheck style={{ width: '12px', height: '12px' }} /> PPPK: {stats.totalPPPK?.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Card 2: Distribution L / P */}
      <div className="glass-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="kpi-title">Komposisi Gender</span>
          <div style={{ padding: '8px', background: 'rgba(236, 72, 153, 0.12)', borderRadius: '10px' }}>
            <Briefcase style={{ color: '#ec4899', width: '20px', height: '20px' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '8px 0' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
            {stats.totalMale?.toLocaleString('id-ID')} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>Laki-laki</span>
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ec4899' }}>
            {stats.totalFemale?.toLocaleString('id-ID')} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>Perempuan</span>
          </span>
        </div>
        <div className="kpi-sub">
          <span>Rasio: {((stats.totalFemale / (stats.totalPegawai || 1)) * 100).toFixed(1)}% Perempuan</span>
        </div>
      </div>

      {/* Card 3: Proyeksi Pensiun (BUP) */}
      <div className="glass-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="kpi-title">Pensiun (3 Thn Ke Depan)</span>
          <div style={{ padding: '8px', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '10px' }}>
            <CalendarX style={{ color: '#f43f5e', width: '20px', height: '20px' }} />
          </div>
        </div>
        <div className="kpi-value" style={{ color: '#f87171' }}>
          {stats.totalRetiringIn3Years?.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Pegawai</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
            BUP 60 (Madya): {stats.totalBup60?.toLocaleString('id-ID')}
          </span>
          <span className="badge badge-sky" style={{ fontSize: '0.7rem' }}>
            BUP 58 (Lainnya): {stats.totalBup58?.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Card 4: Proyeksi Naik Jenjang (Rule 4 Thn) */}
      <div className="glass-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="kpi-title">Eligible Naik Jenjang</span>
          <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '10px' }}>
            <TrendingUp style={{ color: '#f59e0b', width: '20px', height: '20px' }} />
          </div>
        </div>
        <div className="kpi-value" style={{ color: '#fbbf24' }}>
          {stats.totalEligiblePromotion?.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>Pegawai</span>
        </div>
        <div className="kpi-sub">
          <span style={{ color: '#34d399', fontWeight: 600 }}>Rule TMT + 4 Tahun (Target Pangkat 2/c, 2/d, 3/b, 3/d)</span>
        </div>
      </div>
    </div>
  );
}
