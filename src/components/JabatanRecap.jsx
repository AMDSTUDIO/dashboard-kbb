import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Filter, Users, Sparkles, Award } from 'lucide-react';

export default function JabatanRecap({ jabatanList, onSelectJabatan }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL'); // ALL, MADYA, PERTAMA, MUDA, TERAMPIL

  const filteredJabatan = useMemo(() => {
    if (!jabatanList) return [];
    return jabatanList.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (levelFilter === 'MADYA') return item.name.toLowerCase().includes('madya');
      if (levelFilter === 'PERTAMA') return item.name.toLowerCase().includes('pertama');
      if (levelFilter === 'MUDA') return item.name.toLowerCase().includes('muda');
      if (levelFilter === 'TERAMPIL') return item.name.toLowerCase().includes('terampil') || item.name.toLowerCase().includes('mahir') || item.name.toLowerCase().includes('penyelia');
      
      return true;
    });
  }, [jabatanList, searchQuery, levelFilter]);

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      {/* Header & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Rekapitulasi Jabatan Fungsional PNS & PPPK
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Klik pada nama jabatan untuk melihat rincian pegawai (*drill-down* interaktif)
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 200px', width: '100%' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: '16px', height: '16px' }} />
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Level Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 180px', width: '100%' }}>
            <Filter style={{ color: '#94a3b8', width: '16px', height: '16px', flexShrink: 0 }} />
            <select
              className="select-input"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="ALL">Semua Jenjang</option>
              <option value="MADYA">Ahli Madya (BUP 60)</option>
              <option value="MUDA">Ahli Muda</option>
              <option value="PERTAMA">Ahli Pertama</option>
              <option value="TERAMPIL">Terampil / Mahir / Penyelia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info Badge */}
      <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sparkles style={{ color: '#38bdf8', width: '18px', height: '18px', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
          Menampilkan <strong>{filteredJabatan.length}</strong> jenis jabatan fungsional. Silakan klik baris mana saja untuk membuka popup rincian pegawai.
        </div>
      </div>

      {/* Table Content */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Jabatan Fungsional</th>
              <th>Jenjang / BUP</th>
              <th style={{ textAlign: 'center' }}>Total</th>
              <th style={{ textAlign: 'center' }}>Laki-laki (L)</th>
              <th style={{ textAlign: 'center' }}>Perempuan (P)</th>
              <th style={{ textAlign: 'center' }}>PNS</th>
              <th style={{ textAlign: 'center' }}>PPPK</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredJabatan.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                  Tidak ada jabatan fungsional yang cocok dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredJabatan.map((item, idx) => (
                <tr 
                  key={idx} 
                  className="clickable-row"
                  onClick={() => onSelectJabatan(item.name)}
                >
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                  <td>
                    <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{item.name}</strong>
                  </td>
                  <td>
                    {item.isAhliMadya ? (
                      <span className="badge badge-warning">BUP 60 THN (Madya)</span>
                    ) : (
                      <span className="badge badge-sky">BUP 58 THN</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <strong style={{ fontSize: '1rem', color: '#38bdf8' }}>{item.total.toLocaleString('id-ID')}</strong>
                  </td>
                  <td style={{ textAlign: 'center', color: '#38bdf8' }}>
                    {item.male.toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'center', color: '#ec4899' }}>
                    {item.female.toLocaleString('id-ID')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-pns">{item.pns}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-pppk">{item.pppk}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectJabatan(item.name);
                      }}
                    >
                      Detail <ChevronRight style={{ width: '14px', height: '14px' }} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
