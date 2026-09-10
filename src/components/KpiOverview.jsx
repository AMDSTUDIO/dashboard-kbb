import React from 'react';
import { Users, UserCheck, CalendarX, ShieldCheck, UsersRound, Award } from 'lucide-react';

export default function KpiOverview({ stats }) {
  if (!stats) return null;

  const totalPegawai = stats.totalPegawai || 1;
  const pnsPercent = ((stats.totalPNS / totalPegawai) * 100).toFixed(1);
  const pppkPercent = ((stats.totalPPPK / totalPegawai) * 100).toFixed(1);
  const femalePercent = ((stats.totalFemale / totalPegawai) * 100).toFixed(1);

  return (
    <div className="kpi-grid">
      
      {/* Card 1: Total Pegawai Recorded */}
      <div className="glass-card kpi-card glass-card-interactive" style={{ borderTopColor: '#38bdf8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="kpi-title">Total Pegawai Recorded</span>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Database Kepegawaian KBB</div>
          </div>
          <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.12)', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <Users style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
          </div>
        </div>

        <div className="kpi-value">
          {stats.totalPegawai ? stats.totalPegawai.toLocaleString('id-ID') : '0'}
        </div>

        {/* PNS vs PPPK Ratio Bar */}
        <div style={{ margin: '6px 0 10px 0' }}>
          <div style={{ height: '6px', width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${pnsPercent}%`, background: '#10b981', height: '100%' }} title={`PNS: ${pnsPercent}%`} />
            <div style={{ width: `${pppkPercent}%`, background: '#a855f7', height: '100%' }} title={`PPPK: ${pppkPercent}%`} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-pns" style={{ fontSize: '0.7rem' }}>
            <ShieldCheck style={{ width: '12px', height: '12px' }} /> PNS: {stats.totalPNS?.toLocaleString('id-ID')} ({pnsPercent}%)
          </span>
          <span className="badge badge-pppk" style={{ fontSize: '0.7rem' }}>
            <UserCheck style={{ width: '12px', height: '12px' }} /> PPPK: {stats.totalPPPK?.toLocaleString('id-ID')} ({pppkPercent}%)
          </span>
        </div>
      </div>

      {/* Card 2: Komposisi Gender */}
      <div className="glass-card kpi-card glass-card-interactive" style={{ borderTopColor: '#ec4899' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="kpi-title">Komposisi Gender</span>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Rasio Laki-laki & Perempuan</div>
          </div>
          <div style={{ padding: '10px', background: 'rgba(236, 72, 153, 0.12)', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
            <UsersRound style={{ color: '#ec4899', width: '22px', height: '22px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', margin: '10px 0 6px 0' }}>
          <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#38bdf8' }}>
            {stats.totalMale?.toLocaleString('id-ID')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block' }}>Laki-laki</span>
          </span>
          <span style={{ fontSize: '1.9rem', fontWeight: 800, color: '#ec4899' }}>
            {stats.totalFemale?.toLocaleString('id-ID')} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block' }}>Perempuan</span>
          </span>
        </div>

        <div className="kpi-sub" style={{ marginTop: 'auto' }}>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Rasio: <strong>{femalePercent}%</strong> ASN Perempuan</span>
        </div>
      </div>

      {/* Card 3: Proyeksi Pensiun (BUP) */}
      <div className="glass-card kpi-card glass-card-interactive" style={{ borderTopColor: '#f43f5e' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="kpi-title">Proyeksi Pensiun (3 Thn)</span>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Memasuki Batas Usia Pensiun</div>
          </div>
          <div style={{ padding: '10px', background: 'rgba(244, 63, 94, 0.12)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
            <CalendarX style={{ color: '#f43f5e', width: '22px', height: '22px' }} />
          </div>
        </div>

        <div className="kpi-value" style={{ color: '#f87171' }}>
          {stats.totalRetiringIn3Years?.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>Pegawai</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
            BUP 60 (Madya): {stats.totalBup60?.toLocaleString('id-ID')}
          </span>
          <span className="badge badge-sky" style={{ fontSize: '0.68rem' }}>
            BUP 58: {stats.totalBup58?.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Card 4: Proyeksi Naik Jenjang */}
      <div className="glass-card kpi-card glass-card-interactive" style={{ borderTopColor: '#f59e0b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span className="kpi-title">Eligible Naik Jenjang</span>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Memenuhi Syarat Kenaikan</div>
          </div>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Award style={{ color: '#f59e0b', width: '22px', height: '22px' }} />
          </div>
        </div>

        <div className="kpi-value" style={{ color: '#fbbf24' }}>
          {stats.totalEligiblePromotion?.toLocaleString('id-ID')} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>Pegawai</span>
        </div>

        <div className="kpi-sub">
          <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.75rem' }}>✓ Rule TMT + 4 Tahun (Target Pangkat 2c/2d/3b/3d)</span>
        </div>
      </div>

    </div>
  );
}

