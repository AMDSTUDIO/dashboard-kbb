import React, { useState, useMemo } from 'react';
import { CalendarX, Search, Filter, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

export default function ProyeksiPensiun({ employees, onSelectEmployee }) {
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState('ALL'); // ALL, THIS_YEAR, NEXT_3_YEARS, 2026, 2027, 2028, 2029, 2030
  const [bupFilter, setBupFilter] = useState('ALL'); // ALL, BUP60, BUP58
  const [searchQuery, setSearchQuery] = useState('');

  // Filter employees retiring in near future
  const retiringEmployees = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter(emp => {
      if (!emp.retirementYear) return false;
      
      // BUP filter
      if (bupFilter === 'BUP60' && emp.bupYears !== 60) return false;
      if (bupFilter === 'BUP58' && emp.bupYears !== 58) return false;

      // Year filter
      if (yearFilter === 'THIS_YEAR' && emp.retirementYear !== currentYear) return false;
      if (yearFilter === 'NEXT_3_YEARS' && (emp.retirementYear < currentYear || emp.retirementYear > currentYear + 3)) return false;
      if (yearFilter !== 'ALL' && yearFilter !== 'THIS_YEAR' && yearFilter !== 'NEXT_3_YEARS') {
        if (emp.retirementYear !== parseInt(yearFilter, 10)) return false;
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
    }).sort((a, b) => a.retirementYear - b.retirementYear);
  }, [employees, yearFilter, bupFilter, searchQuery, currentYear]);

  // Statistics
  const bup60Total = useMemo(() => employees ? employees.filter(e => e.bupYears === 60).length : 0, [employees]);
  const bup58Total = useMemo(() => employees ? employees.filter(e => e.bupYears === 58).length : 0, [employees]);
  const retiringThisYearCount = useMemo(() => employees ? employees.filter(e => e.retirementYear === currentYear).length : 0, [employees, currentYear]);
  const retiring3YearsCount = useMemo(() => employees ? employees.filter(e => e.retirementYear >= currentYear && e.retirementYear <= currentYear + 3).length : 0, [employees, currentYear]);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Title & Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalendarX style={{ color: '#f43f5e', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Proyeksi Pensiun Otomatis Pegawai (Rule BUP 60 & 58 Tahun)
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Hitung otomatis Batas Usia Pensiun berdasarkan NIP dan Jenjang Jabatan Fungsional
          </p>
        </div>

        {/* KPI Mini Badges */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div className="badge badge-danger" style={{ padding: '8px 14px' }}>
            Pensiun Tahun {currentYear}: {retiringThisYearCount} Pegawai
          </div>
          <div className="badge badge-warning" style={{ padding: '8px 14px' }}>
            Pensiun 3 Thn Ke Depan: {retiring3YearsCount} Pegawai
          </div>
        </div>
      </div>

      {/* Logic Rule Highlight Box */}
      <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px dashed rgba(244, 63, 94, 0.3)', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <ShieldAlert style={{ color: '#f43f5e', width: '20px', height: '20px', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>
            <strong style={{ color: '#f87171' }}>Aturan BUP Kepegawaian yang Diterapkan:</strong>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li><strong>BUP 60 Tahun ({bup60Total.toLocaleString('id-ID')} Pegawai)</strong>: Khusus untuk jenjang <em>Ahli Madya</em> & <em>Ahli Utama</em> (Guru Ahli Madya, Dokter Ahli Madya, Pengawas Ahli Madya, Widyaiswara Ahli Madya, etc.).</li>
              <li><strong>BUP 58 Tahun ({bup58Total.toLocaleString('id-ID')} Pegawai)</strong>: Untuk jenjang lainnya (Ahli Pertama, Ahli Muda, Terampil, Mahir, Penyelia, Pemula).</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', width: '100%' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: '16px', height: '16px' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Cari NIP, Nama, Jabatan, OPD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 160px' }}>
            <Filter style={{ color: '#94a3b8', width: '16px', height: '16px', flexShrink: 0 }} />
            <select className="select-input" value={bupFilter} onChange={(e) => setBupFilter(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">Semua BUP (60 & 58)</option>
              <option value="BUP60">BUP 60 Tahun (Ahli Madya)</option>
              <option value="BUP58">BUP 58 Tahun (Lainnya)</option>
            </select>
          </div>

          <select className="select-input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ flex: '1 1 160px' }}>
            <option value="ALL">Semua Tahun Pensiun</option>
            <option value="THIS_YEAR">Pensiun Tahun Ini ({currentYear})</option>
            <option value="NEXT_3_YEARS">Pensiun 3 Thn Ke Depan ({currentYear}-{currentYear+3})</option>
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear+1}>{currentYear+1}</option>
            <option value={currentYear+2}>{currentYear+2}</option>
            <option value={currentYear+3}>{currentYear+3}</option>
            <option value={currentYear+4}>{currentYear+4}</option>
            <option value={currentYear+5}>{currentYear+5}</option>
          </select>
        </div>
      </div>

      {/* Retirees List Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>No</th>
              <th>NIP & Nama Pegawai</th>
              <th>Jabatan & Jenjang</th>
              <th>BUP</th>
              <th>Tgl Lahir</th>
              <th>Usia (Thn)</th>
              <th>Tahun Pensiun</th>
              <th>Status Proyeksi</th>
              <th>OPD</th>
            </tr>
          </thead>
          <tbody>
            {retiringEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  Tidak ada data pegawai yang memenuhi filter proyeksi pensiun.
                </td>
              </tr>
            ) : (
              retiringEmployees.slice(0, 100).map((emp, idx) => (
                <tr key={idx} onClick={() => onSelectEmployee && onSelectEmployee(emp)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: '#64748b', fontSize: '0.785rem' }}>{idx + 1}</td>
                  <td>
                    <strong style={{ color: '#f8fafc', display: 'block', fontSize: '0.825rem' }}>{emp.nama}</strong>
                    <span style={{ fontSize: '0.725rem', color: '#38bdf8', fontFamily: 'monospace' }}>{emp.nip}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{emp.jabatan}</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>{emp.golongan}</span>
                  </td>
                  <td>
                    {emp.bupYears === 60 ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.675rem' }}>60 THN</span>
                    ) : (
                      <span className="badge badge-sky" style={{ fontSize: '0.675rem' }}>58 THN</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.785rem', color: '#cbd5e1' }}>
                    {emp.birthInfo ? emp.birthInfo.formatted : '-'}
                  </td>
                  <td style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.8rem' }}>
                    {emp.age ? `${emp.age} thn` : '-'}
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.875rem', color: emp.retirementYear <= currentYear ? '#f87171' : '#fbbf24' }}>
                      {emp.retirementYear}
                    </strong>
                  </td>
                  <td>
                    {emp.retirementYear <= currentYear ? (
                      <span className="badge badge-danger" style={{ fontSize: '0.675rem' }}>Memasuki Pensiun</span>
                    ) : emp.retirementYear <= currentYear + 3 ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.675rem' }}>Pensiun &le; 3 Thn</span>
                    ) : (
                      <span className="badge badge-sky" style={{ fontSize: '0.675rem' }}>Aktif (&gt;3 Thn)</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.785rem', color: '#94a3b8' }}>
                    {emp.opd}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {retiringEmployees.length > 100 && (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Menampilkan 100 dari total {retiringEmployees.length} pegawai pensiun. Gunakan pencarian untuk mempersempit.
          </div>
        )}
      </div>

    </div>
  );
}
