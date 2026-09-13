import React, { useState, useMemo } from 'react';
import { TrendingUp, Search, Filter, Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, Award } from 'lucide-react';
import { PromotionCharts } from './TabCharts';

export default function ProyeksiNaikJenjang({ employees, stats, onSelectEmployee }) {
  const currentYear = new Date().getFullYear();
  const [yearFilter, setYearFilter] = useState('ELIGIBLE_NOW'); // ELIGIBLE_NOW, NEXT_YEAR, ALL, 2026...
  const [golonganFilter, setGolonganFilter] = useState('ALL'); // ALL, II/a s.d. IV/e
  const [targetFilter, setTargetFilter] = useState('ALL'); // ALL, II/b s.d. IV/e
  const [kategoriFilter, setKategoriFilter] = useState('ALL'); // ALL, Keterampilan, Keahlian, Pemula, Terampil, Mahir, Penyelia, Ahli Pertama, Ahli Muda, Ahli Madya, Ahli Utama
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, Naik Jenjang, Reguler
  const [searchQuery, setSearchQuery] = useState('');

  const promotionEmployees = useMemo(() => {
    if (!employees) return [];

    return employees.filter(emp => {
      if (!emp.eligibleYear) return false;

      // Filter Golongan Saat Ini
      if (golonganFilter !== 'ALL') {
        const golClean = (emp.golongan || '').toUpperCase().trim();
        const fClean = golonganFilter.toUpperCase().trim();
        if (golClean !== fClean && !golClean.startsWith(fClean)) return false;
      }

      // Filter Target Pangkat / Golongan
      if (targetFilter !== 'ALL') {
        const tgtClean = (emp.targetPangkat || '').toUpperCase().trim();
        const fClean = targetFilter.toUpperCase().trim();
        if (!tgtClean.includes(fClean)) return false;
      }

      // Filter Kategori / Jenjang JF
      if (kategoriFilter !== 'ALL') {
        const fClean = kategoriFilter.toUpperCase().trim();
        const isKatMatch = emp.kategoriJf && emp.kategoriJf.toUpperCase() === fClean;
        const isJenjMatch = emp.jenjangJf && emp.jenjangJf.toUpperCase().includes(fClean);
        if (!isKatMatch && !isJenjMatch) return false;
      }

      // Filter Jenis Proyeksi (Naik Jenjang vs Reguler)
      if (typeFilter !== 'ALL' && emp.proyeksiType !== typeFilter) return false;

      // Filter Tahun / Status Eligibility
      if (yearFilter === 'ELIGIBLE_NOW' && emp.eligibleYear > currentYear) return false;
      if (yearFilter === 'NEXT_YEAR' && emp.eligibleYear !== currentYear + 1) return false;
      if (yearFilter !== 'ALL' && yearFilter !== 'ELIGIBLE_NOW' && yearFilter !== 'NEXT_YEAR') {
        if (emp.eligibleYear !== parseInt(yearFilter, 10)) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.nama?.toLowerCase().includes(q);
        const matchNip = emp.nip?.includes(q);
        const matchJab = emp.jabatan?.toLowerCase().includes(q);
        const matchOpd = emp.opd?.toLowerCase().includes(q);
        if (!matchName && !matchNip && !matchJab && !matchOpd) return false;
      }

      return true;
    }).sort((a, b) => a.eligibleYear - b.eligibleYear);
  }, [employees, yearFilter, golonganFilter, targetFilter, kategoriFilter, typeFilter, searchQuery, currentYear]);

  // Summary Counters
  const eligibleCount = useMemo(() => employees ? employees.filter(e => e.eligibleYear && e.eligibleYear <= currentYear).length : 0, [employees, currentYear]);
  const nextYearCount = useMemo(() => employees ? employees.filter(e => e.eligibleYear && e.eligibleYear === currentYear + 1).length : 0, [employees, currentYear]);
  const naikJenjangCount = useMemo(() => promotionEmployees.filter(e => e.proyeksiType === 'Naik Jenjang').length, [promotionEmployees]);

  return (
    <div>
      {/* Thematic Charts for Tab Promotion */}
      <PromotionCharts stats={stats} />

      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Title & Stats Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ color: '#f59e0b', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Proyeksi Naik Jenjang & Kenaikan Pangkat (Rule Reguler 4 Tahun)
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Pemetaan Otomatis Golongan II/a s.d. IV/e • PermenPAN-RB & BKN (TMT Terakhir + 4 Tahun)
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

      {/* Target Pangkat & Jenjang Mapping Reference Box */}
      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px dashed rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
          <strong style={{ color: '#fbbf24', fontSize: '0.9rem', display: 'block', marginBottom: '10px' }}>
            📋 Matriks Proyeksi Kenaikan Pangkat (Reguler 4 Thn) & Naik Jenjang JF (PermenPAN-RB & BKN):
          </strong>
          
          <div className="responsive-grid-2col" style={{ gap: '14px' }}>
            {/* Kategori Keterampilan */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', marginBottom: '6px', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', paddingBottom: '4px' }}>
                🛠️ Kategori Keterampilan
              </div>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
                <div>• <strong>Pemula (II/a)</strong> &rarr; Naik Ke <strong>Terampil (II/b)</strong></div>
                <div>• <strong>Terampil (II/b &rarr; II/c &rarr; II/d)</strong> &rarr; Puncak II/d &rarr; Naik Jenjang Ke <strong>Mahir (III/a)</strong></div>
                <div>• <strong>Mahir (III/a &rarr; III/b)</strong> &rarr; Puncak III/b &rarr; Naik Jenjang Ke <strong>Penyelia (III/c)</strong></div>
                <div>• <strong>Penyelia (III/c &rarr; III/d)</strong> &rarr; Puncak III/d (Jenjang Tertinggi)</div>
              </div>
            </div>

            {/* Kategori Keahlian */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c084fc', marginBottom: '6px', borderBottom: '1px solid rgba(168, 85, 247, 0.2)', paddingBottom: '4px' }}>
                🎓 Kategori Keahlian
              </div>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px', color: '#cbd5e1' }}>
                <div>• <strong>Ahli Pertama (III/a &rarr; III/b)</strong> &rarr; Puncak III/b &rarr; Naik Jenjang Ke <strong>Ahli Muda (III/c)</strong></div>
                <div>• <strong>Ahli Muda (III/c &rarr; III/d)</strong> &rarr; Puncak III/d &rarr; Naik Jenjang Ke <strong>Ahli Madya (IV/a)</strong></div>
                <div>• <strong>Ahli Madya (IV/a &rarr; IV/b &rarr; IV/c)</strong> &rarr; Puncak IV/c &rarr; Naik Jenjang Ke <strong>Ahli Utama (IV/d)</strong></div>
                <div>• <strong>Ahli Utama (IV/d &rarr; IV/e)</strong> &rarr; Puncak IV/e (Jenjang Tertinggi)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        
        {/* Row 1: Search & Eligibility Status Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
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

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto' }}>
            <select className="select-input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} style={{ flex: '1 1 180px' }}>
              <option value="ELIGIBLE_NOW">Sudah Eligible (TMT &le; {currentYear-4})</option>
              <option value="NEXT_YEAR">Eligible Tahun Depan ({currentYear+1})</option>
              <option value="ALL">Semua Tahun</option>
              <option value={currentYear}>{currentYear}</option>
              <option value={currentYear+1}>{currentYear+1}</option>
              <option value={currentYear+2}>{currentYear+2}</option>
              <option value={currentYear+3}>{currentYear+3}</option>
            </select>

            <select className="select-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ flex: '1 1 160px' }}>
              <option value="ALL">Semua Jenis Proyeksi</option>
              <option value="Naik Jenjang">Naik Jenjang Jabatan</option>
              <option value="Reguler">Kenaikan Pangkat Reguler</option>
            </select>
          </div>
        </div>

        {/* Row 2: Dropdowns for Golongan Saat Ini, Target Pangkat, and Jenjang / Kategori */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {/* Filter Golongan Saat Ini */}
          <select className="select-input" value={golonganFilter} onChange={(e) => setGolonganFilter(e.target.value)}>
            <option value="ALL">Semua Gol. Saat Ini</option>
            <option value="II/a">Golongan II/a</option>
            <option value="II/b">Golongan II/b</option>
            <option value="II/c">Golongan II/c</option>
            <option value="II/d">Golongan II/d</option>
            <option value="III/a">Golongan III/a</option>
            <option value="III/b">Golongan III/b</option>
            <option value="III/c">Golongan III/c</option>
            <option value="III/d">Golongan III/d</option>
            <option value="IV/a">Golongan IV/a</option>
            <option value="IV/b">Golongan IV/b</option>
            <option value="IV/c">Golongan IV/c</option>
            <option value="IV/d">Golongan IV/d</option>
            <option value="IV/e">Golongan IV/e</option>
          </select>

          {/* Filter Target Pangkat */}
          <select className="select-input" value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}>
            <option value="ALL">Semua Target Pangkat</option>
            <option value="II/b">Target II/b (Terampil)</option>
            <option value="II/c">Target II/c</option>
            <option value="II/d">Target II/d</option>
            <option value="III/a">Target III/a (Mahir)</option>
            <option value="III/b">Target III/b</option>
            <option value="III/c">Target III/c (Penyelia / Ahli Muda)</option>
            <option value="III/d">Target III/d</option>
            <option value="IV/a">Target IV/a (Ahli Madya)</option>
            <option value="IV/b">Target IV/b</option>
            <option value="IV/c">Target IV/c</option>
            <option value="IV/d">Target IV/d (Ahli Utama)</option>
            <option value="IV/e">Target IV/e</option>
          </select>

          {/* Filter Kategori & Jenjang JF */}
          <select className="select-input" value={kategoriFilter} onChange={(e) => setKategoriFilter(e.target.value)}>
            <option value="ALL">Semua Kategori & Jenjang</option>
            <optgroup label="Berdasarkan Kategori">
              <option value="Keterampilan">Keterampilan</option>
              <option value="Keahlian">Keahlian</option>
            </optgroup>
            <optgroup label="Berdasarkan Jenjang Keterampilan">
              <option value="Pemula">Pemula (II/a)</option>
              <option value="Terampil">Terampil (II/b - II/d)</option>
              <option value="Mahir">Mahir (III/a - III/b)</option>
              <option value="Penyelia">Penyelia (III/c - III/d)</option>
            </optgroup>
            <optgroup label="Berdasarkan Jenjang Keahlian">
              <option value="Ahli Pertama">Ahli Pertama (III/a - III/b)</option>
              <option value="Ahli Muda">Ahli Muda (III/c - III/d)</option>
              <option value="Ahli Madya">Ahli Madya (IV/a - IV/c)</option>
              <option value="Ahli Utama">Ahli Utama (IV/d - IV/e)</option>
            </optgroup>
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
              <th>Jabatan & Kategori JF</th>
              <th>Gol. Saat Ini</th>
              <th>TMT Terakhir</th>
              <th>Tahun Eligible</th>
              <th>Target Pangkat</th>
              <th>Jenis Proyeksi</th>
              <th>Status Eligibility</th>
              <th>OPD</th>
            </tr>
          </thead>
          <tbody>
            {promotionEmployees.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  Tidak ada data pegawai yang memenuhi filter proyeksi kenaikan pangkat/jenjang.
                </td>
              </tr>
            ) : (
              promotionEmployees.slice(0, 100).map((emp, idx) => (
                <tr key={idx} onClick={() => onSelectEmployee && onSelectEmployee(emp)} style={{ cursor: 'pointer' }}>
                  <td style={{ color: '#64748b', fontSize: '0.785rem' }}>{idx + 1}</td>
                  <td>
                    <strong style={{ color: '#f8fafc', display: 'block', fontSize: '0.825rem' }}>{emp.nama}</strong>
                    <span style={{ fontSize: '0.725rem', color: '#38bdf8', fontFamily: 'monospace' }}>{emp.nip}</span>
                  </td>
                  <td style={{ fontSize: '0.785rem' }}>
                    <span style={{ color: '#cbd5e1', fontWeight: 600, display: 'block' }}>{emp.jabatan}</span>
                    <span style={{ fontSize: '0.68rem', color: emp.kategoriJf === 'Keahlian' ? '#c084fc' : '#38bdf8' }}>
                      {emp.kategoriJf} ({emp.jenjangJf})
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-sky" style={{ fontSize: '0.675rem' }}>{emp.golongan}</span>
                  </td>
                  <td style={{ fontSize: '0.785rem', color: '#cbd5e1' }}>
                    {emp.tmtPangkat || '-'}
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.875rem', color: emp.eligibleYear <= currentYear ? '#fbbf24' : '#38bdf8' }}>
                      {emp.eligibleYear}
                    </strong>
                  </td>
                  <td>
                    <span className="badge badge-warning" style={{ fontWeight: 800, fontSize: '0.675rem' }}>
                      {emp.targetPangkat}
                    </span>
                  </td>
                  <td>
                    {emp.proyeksiType === 'Naik Jenjang' ? (
                      <span className="badge badge-pppk" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                        <ArrowUpRight style={{ width: '10px', height: '10px' }} /> Naik Jenjang
                      </span>
                    ) : (
                      <span className="badge badge-sky" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                        Reguler 4 Thn
                      </span>
                    )}
                  </td>
                  <td>
                    {emp.eligibleYear <= currentYear ? (
                      <span className="badge badge-warning" style={{ fontSize: '0.675rem' }}>Eligible (4+ Thn)</span>
                    ) : emp.eligibleYear === currentYear + 1 ? (
                      <span className="badge badge-sky" style={{ fontSize: '0.675rem' }}>Thn Depan</span>
                    ) : (
                      <span className="badge badge-pns" style={{ fontSize: '0.675rem' }}>Thn {emp.eligibleYear}</span>
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
        {promotionEmployees.length > 100 && (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Menampilkan 100 dari total {promotionEmployees.length} pegawai. Gunakan pencarian untuk mempersempit.
          </div>
        )}
      </div>

    </div>
    </div>
  );
}

