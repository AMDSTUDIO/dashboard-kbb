import React, { useState, useMemo } from 'react';
import { TrendingUp, Search, Filter, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProyeksiNaikJenjang({ employees, onSelectEmployee }) {
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState('ELIGIBLE_NOW'); // ELIGIBLE_NOW, NEXT_YEAR, ALL, 2026, 2027, 2028
  const [targetFilter, setTargetFilter] = useState('ALL'); // ALL, 2/c, 2/d, 3/b, 3/d
  const [searchQuery, setSearchQuery] = useState('');

  const promotionEmployees = useMemo(() => {
    if (!employees) return [];

    return employees.filter(emp => {
      if (!emp.eligibleYear) return false;

      // Target Pangkat filter
      if (targetFilter !== 'ALL' && emp.targetPangkat !== targetFilter) return false;

      // Year filter
      if (yearFilter === 'ELIGIBLE_NOW' && emp.eligibleYear > currentYear) return false;
      if (yearFilter === 'NEXT_YEAR' && emp.eligibleYear !== currentYear + 1) return false;
      if (yearFilter !== 'ALL' && yearFilter !== 'ELIGIBLE_NOW' && yearFilter !== 'NEXT_YEAR') {
        if (emp.eligibleYear !== parseInt(yearFilter, 10)) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.nama.toLowerCase().includes(q);
        const matchNip = emp.nip.includes(q);
        const matchJab = emp.jabatan.toLowerCase().includes(q);
        const matchOpd = emp.opd.toLowerCase().includes(q);
        if (!matchName && !matchNip && !matchJab && !matchOpd) return false;
      }

      return true;
    }).sort((a, b) => a.eligibleYear - b.eligibleYear);
  }, [employees, yearFilter, targetFilter, searchQuery, currentYear]);

  // Summary Counters
  const eligibleCount = useMemo(() => employees ? employees.filter(e => e.eligibleYear && e.eligibleYear <= currentYear).length : 0, [employees, currentYear]);
  const nextYearCount = useMemo(() => employees ? employees.filter(e => e.eligibleYear && e.eligibleYear === currentYear + 1).length : 0, [employees, currentYear]);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Title & Stats Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ color: '#f59e0b', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Proyeksi Naik Jenjang & Kenaikan Pangkat (Rule 4 Tahun)
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Perhitungan otomatis Tahun Eligible = TMT Pangkat + 4 Tahun & Pemetaan Target Pangkat
          </p>
        </div>

        {/* Counter Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="badge badge-warning" style={{ padding: '8px 14px' }}>
            <CheckCircle2 style={{ width: '14px', height: '14px' }} /> Eligible Sekarang ({currentYear}): {eligibleCount} Pegawai
          </div>
          <div className="badge badge-sky" style={{ padding: '8px 14px' }}>
            Eligible Tahun Depan ({currentYear+1}): {nextYearCount} Pegawai
          </div>
        </div>
      </div>

      {/* Target Pangkat Mapping Reference Box */}
      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
          <strong style={{ color: '#fbbf24' }}>Aturan Kenaikan Jenjang & Target Pangkat:</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '8px' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Jenjang Pemula</span>
              <strong style={{ color: '#38bdf8' }}>Target Pangkat: II/c</strong>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Jenjang Terampil</span>
              <strong style={{ color: '#38bdf8' }}>Target Pangkat: II/d</strong>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Mahir & Ahli Pertama</span>
              <strong style={{ color: '#38bdf8' }}>Target Pangkat: III/b</strong>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.75rem' }}>Penyelia & Ahli Muda</span>
              <strong style={{ color: '#38bdf8' }}>Target Pangkat: III/d</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', width: '280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: '16px', height: '16px' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari NIP, Nama, Jabatan, OPD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select className="select-input" value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}>
            <option value="ALL">Semua Target Pangkat</option>
            <option value="2/c">Target 2/c (Pemula)</option>
            <option value="2/d">Target 2/d (Terampil)</option>
            <option value="3/b">Target 3/b (Mahir & Ahli Pertama)</option>
            <option value="3/d">Target 3/d (Penyelia & Ahli Muda)</option>
          </select>

          <select className="select-input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="ELIGIBLE_NOW">Sudah Eligible (TMT &le; {currentYear-4})</option>
            <option value="NEXT_YEAR">Eligible Tahun Depan ({currentYear+1})</option>
            <option value="ALL">Semua Tahun</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear+1}>{currentYear+1}</option>
            <option value={currentYear+2}>{currentYear+2}</option>
            <option value={currentYear+3}>{currentYear+3}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>No</th>
              <th>NIP & Nama Pegawai</th>
              <th>Jabatan & Jenjang</th>
              <th>Gol. Saat Ini</th>
              <th>TMT Terakhir</th>
              <th>Tahun Eligible</th>
              <th>Target Pangkat</th>
              <th>Status Eligibility</th>
              <th>OPD</th>
            </tr>
          </thead>
          <tbody>
            {promotionEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  Tidak ada data pegawai yang memenuhi filter proyeksi naik jenjang.
                </td>
              </tr>
            ) : (
              promotionEmployees.slice(0, 100).map((emp, idx) => (
                <tr key={idx} onClick={() => onSelectEmployee && onSelectEmployee(emp)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: '#64748b' }}>{idx + 1}</td>
                  <td>
                    <strong style={{ color: '#f8fafc', display: 'block' }}>{emp.nama}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>{emp.nip}</span>
                  </td>
                  <td>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{emp.jabatan}</span>
                  </td>
                  <td>
                    <span className="badge badge-sky">{emp.golongan}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {emp.tmtPangkat || '-'}
                  </td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: emp.eligibleYear <= currentYear ? '#fbbf24' : '#38bdf8' }}>
                      {emp.eligibleYear}
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-warning" style={{ fontWeight: 800 }}>
                      {emp.targetPangkat}
                    </span>
                  </td>
                  <td>
                    {emp.eligibleYear <= currentYear ? (
                      <span className="badge badge-warning">Eligible (Sudah 4+ Thn)</span>
                    ) : emp.eligibleYear === currentYear + 1 ? (
                      <span className="badge badge-sky">Eligible Thn Depan</span>
                    ) : (
                      <span className="badge badge-pns">Eligible Thn {emp.eligibleYear}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {emp.opd}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {promotionEmployees.length > 100 && (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Menampilkan 100 dari total {promotionEmployees.length} pegawai. Gunakan pencarian untuk mempersempit.
          </div>
        )}
      </div>

    </div>
  );
}
