import React, { useState, useMemo } from 'react';
import { Search, Filter, Database, ChevronLeft, ChevronRight, Download, UserCheck, ShieldCheck } from 'lucide-react';
import Papa from 'papaparse';

export default function EmployeeTable({ employees, onSelectEmployee }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [opdFilter, setOpdFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Extract unique OPD list for dropdown
  const uniqueOpds = useMemo(() => {
    if (!employees) return [];
    const set = new Set();
    employees.forEach(e => { if (e.opd) set.add(e.opd); });
    return Array.from(set).sort();
  }, [employees]);

  // Instant Live Filtering
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];

    return employees.filter(emp => {
      // Status Filter
      if (statusFilter !== 'ALL' && emp.statusAsn !== statusFilter) return false;

      // Gender Filter
      if (genderFilter !== 'ALL' && emp.gender !== genderFilter) return false;

      // OPD Filter
      if (opdFilter !== 'ALL' && emp.opd !== opdFilter) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.nama.toLowerCase().includes(q);
        const matchNip = emp.nip.includes(q);
        const matchJab = emp.jabatan.toLowerCase().includes(q);
        const matchOpd = emp.opd.toLowerCase().includes(q);
        const matchUnit = emp.unitKerja.toLowerCase().includes(q);
        if (!matchName && !matchNip && !matchJab && !matchOpd && !matchUnit) return false;
      }

      return true;
    });
  }, [employees, statusFilter, genderFilter, opdFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Reset page when filter changes
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) return;
    const exportData = filteredEmployees.map((e, idx) => ({
      No: idx + 1,
      NIP: e.nip,
      Nama: e.nama,
      Gender: e.gender,
      Status: e.statusAsn,
      Golongan: e.golongan,
      'TMT Pangkat': e.tmtPangkat,
      Pendidikan: `${e.pendTingkat} ${e.pendJurusan}`,
      Jabatan: e.jabatan,
      OPD: e.opd,
      'Unit Kerja': e.unitKerja,
      'Tahun Pensiun': e.retirementYear,
      'Eligible Naik Jenjang': e.eligibleYear,
      'Target Pangkat': e.targetPangkat,
      'No HP': e.noHp,
      Email: e.email
    }));

    const csvStr = Papa.unparse(exportData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Master_Data_Pegawai_KBB.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Master Data Pegawai (Instant Search & Live Filter)
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
            Daftar lengkap {employees ? employees.length.toLocaleString('id-ID') : 0} pegawai dengan sistem pencarian realtime
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn-primary">
          <Download style={{ width: '16px', height: '16px' }} /> Export Master CSV
        </button>
      </div>

      {/* Instant Search Bar & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        
        {/* Main Instant Search Input */}
        <div style={{ position: 'relative', flex: '1 1 280px', width: '100%' }}>
          <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#38bdf8', width: '18px', height: '18px' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '44px', fontSize: '0.95rem' }}
            placeholder="Ketik NIP, Nama Pegawai, Jabatan, OPD, atau Unit Kerja untuk mencari instan..."
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
          />
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: '1 1 auto', width: '100%', maxWidth: '100%' }}>
          <select 
            className="select-input" 
            value={opdFilter} 
            onChange={(e) => handleFilterChange(setOpdFilter, e.target.value)}
            style={{ flex: '1 1 140px', minWidth: '130px' }}
          >
            <option value="ALL">Semua OPD ({uniqueOpds.length})</option>
            {uniqueOpds.map((opd, i) => (
              <option key={i} value={opd}>{opd}</option>
            ))}
          </select>

          <select 
            className="select-input" 
            value={statusFilter} 
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            style={{ flex: '1 1 110px' }}
          >
            <option value="ALL">Semua Status</option>
            <option value="PNS">PNS</option>
            <option value="PPPK">PPPK</option>
          </select>

          <select 
            className="select-input" 
            value={genderFilter} 
            onChange={(e) => handleFilterChange(setGenderFilter, e.target.value)}
            style={{ flex: '1 1 110px' }}
          >
            <option value="ALL">Semua Gender</option>
            <option value="Laki-laki">Laki-laki (L)</option>
            <option value="Perempuan">Perempuan (P)</option>
          </select>

          <select 
            className="select-input" 
            value={pageSize} 
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{ flex: '1 1 90px' }}
          >
            <option value={25}>25 Baris</option>
            <option value={50}>50 Baris</option>
            <option value={100}>100 Baris</option>
          </select>
        </div>
      </div>

      {/* Table Result */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>No</th>
              <th>NIP & Nama Pegawai</th>
              <th>Status & Gol.</th>
              <th>Jabatan & Jenjang</th>
              <th>Pendidikan</th>
              <th>OPD</th>
              <th>Unit Kerja</th>
              <th>Proyeksi Pensiun</th>
              <th>Naik Jenjang</th>
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  Tidak ada data pegawai yang memenuhi kata kunci pencarian & filter.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((emp, idx) => (
                <tr 
                  key={idx} 
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectEmployee && onSelectEmployee(emp)}
                >
                  <td style={{ color: '#64748b' }}>{(currentPage - 1) * pageSize + idx + 1}</td>
                  <td>
                    <strong style={{ color: '#f8fafc', display: 'block', fontSize: '0.9rem' }}>{emp.nama}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>{emp.nip}</span>
                  </td>
                  <td>
                    <span className={emp.statusAsn === 'PNS' ? 'badge badge-pns' : 'badge badge-pppk'}>
                      {emp.statusAsn} ({emp.golongan})
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{emp.jabatan}</strong>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <strong style={{ display: 'block' }}>{emp.pendTingkat}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{emp.pendJurusan}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {emp.opd}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {emp.unitKerja}
                  </td>
                  <td>
                    <strong style={{ color: emp.bupYears === 60 ? '#fbbf24' : '#38bdf8' }}>
                      {emp.retirementYear || '-'}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>
                      BUP {emp.bupYears} Thn
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                      {emp.eligibleYear} &rarr; {emp.targetPangkat}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Menampilkan <strong>{filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> hingga <strong>{Math.min(currentPage * pageSize, filteredEmployees.length)}</strong> dari total <strong>{filteredEmployees.length.toLocaleString('id-ID')}</strong> pegawai.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} /> Sebelum
          </button>
          
          <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 600, padding: '0 8px' }}>
            Halaman {currentPage} dari {totalPages}
          </span>

          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Berikut <ChevronRight style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

    </div>
  );
}
