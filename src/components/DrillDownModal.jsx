import React, { useState, useMemo } from 'react';
import { X, Search, Download, Users, Mail, Phone, MapPin, Building, ShieldCheck, UserCheck } from 'lucide-react';
import Papa from 'papaparse';

export default function DrillDownModal({ jabatanName, employees, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PNS, PPPK
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Filter employees matching this specific Jabatan name
  const jabatanEmployees = useMemo(() => {
    if (!employees || !jabatanName) return [];

    return employees.filter(emp => {
      if (emp.jabatan.toLowerCase() !== jabatanName.toLowerCase()) return false;
      if (statusFilter !== 'ALL' && emp.statusAsn !== statusFilter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.nama.toLowerCase().includes(q);
        const matchNip = emp.nip.includes(q);
        const matchOpd = emp.opd.toLowerCase().includes(q);
        const matchUnit = emp.unitKerja.toLowerCase().includes(q);
        if (!matchName && !matchNip && !matchOpd && !matchUnit) return false;
      }

      return true;
    });
  }, [employees, jabatanName, statusFilter, searchQuery]);

  // Statistics for this position
  const stats = useMemo(() => {
    const total = jabatanEmployees.length;
    let male = 0, female = 0, pns = 0, pppk = 0;
    jabatanEmployees.forEach(e => {
      if (e.gender === 'Laki-laki') male++; else female++;
      if (e.statusAsn === 'PNS') pns++; else pppk++;
    });
    return { total, male, female, pns, pppk };
  }, [jabatanEmployees]);

  // Export CSV function
  const handleExportCSV = () => {
    if (jabatanEmployees.length === 0) return;

    const exportData = jabatanEmployees.map((e, idx) => ({
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
      'BUP (Thn)': e.bupYears,
      'Eligible Naik Jenjang': e.eligibleYear,
      'Target Pangkat': e.targetPangkat,
      'No HP': e.noHp,
      Email: e.email,
      Alamat: e.alamat
    }));

    const csvStr = Papa.unparse(exportData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Daftar_Pegawai_${jabatanName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users style={{ color: '#38bdf8', width: '22px', height: '22px' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Rincian Pegawai Jabatan: <span style={{ color: '#38bdf8' }}>{jabatanName}</span>
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Drill-down data pegawai aktif menduduki posisi ini
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="btn-secondary" 
            style={{ padding: '8px', borderRadius: '50%', border: 'none' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Sub-Header Stats & Controls */}
        <div style={{ padding: '16px 24px', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* Quick Counter Badges */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span className="badge badge-sky" style={{ padding: '6px 12px' }}>
              Total: {stats.total} Pegawai
            </span>
            <span className="badge badge-pns" style={{ padding: '6px 12px' }}>
              PNS: {stats.pns} | PPPK: {stats.pppk}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', alignSelf: 'center', marginLeft: '6px' }}>
              Laki-laki: <strong style={{ color: '#38bdf8' }}>{stats.male}</strong> | Perempuan: <strong style={{ color: '#ec4899' }}>{stats.female}</strong>
            </span>
          </div>

          {/* Search & Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: '14px', height: '14px' }} />
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '34px', fontSize: '0.8rem' }}
                placeholder="Cari NIP/Nama/Unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="select-input" 
              style={{ fontSize: '0.8rem', padding: '8px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="PNS">Hanya PNS</option>
              <option value="PPPK">Hanya PPPK</option>
            </select>

            <button onClick={handleExportCSV} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              <Download style={{ width: '14px', height: '14px' }} /> Export CSV
            </button>
          </div>
        </div>

        {/* Modal Body Table */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIP & Nama</th>
                  <th>Status & Gol.</th>
                  <th>TMT Pangkat</th>
                  <th>Pendidikan</th>
                  <th>OPD & Unit Kerja</th>
                  <th>Proyeksi Pensiun</th>
                  <th>Naik Jenjang</th>
                  <th>Kontak</th>
                </tr>
              </thead>
              <tbody>
                {jabatanEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      Tidak ada data pegawai pada posisi ini yang memenuhi kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  jabatanEmployees.map((emp, idx) => (
                    <tr 
                      key={idx}
                      style={{ cursor: 'pointer', background: selectedEmployee?.id === emp.id ? 'rgba(56, 189, 248, 0.12)' : undefined }}
                      onClick={() => setSelectedEmployee(emp)}
                    >
                      <td style={{ color: '#64748b' }}>{idx + 1}</td>
                      <td>
                        <strong style={{ color: '#f8fafc', display: 'block' }}>{emp.nama}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>{emp.nip}</span>
                      </td>
                      <td>
                        <span className={emp.statusAsn === 'PNS' ? 'badge badge-pns' : 'badge badge-pppk'}>
                          {emp.statusAsn} ({emp.golongan})
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {emp.tmtPangkat || '-'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        <strong>{emp.pendTingkat}</strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>{emp.pendJurusan}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        <strong style={{ color: '#f8fafc', display: 'block' }}>{emp.opd}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{emp.unitKerja}</span>
                      </td>
                      <td>
                        <strong style={{ color: emp.bupYears === 60 ? '#fbbf24' : '#38bdf8' }}>
                          Thn {emp.retirementYear}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8' }}>
                          (BUP {emp.bupYears} Thn)
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          Thn {emp.eligibleYear} &rarr; {emp.targetPangkat}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {emp.noHp && <div><Phone style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />{emp.noHp}</div>}
                        {emp.email && <div><Mail style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />{emp.email}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Menampilkan {jabatanEmployees.length} pegawai untuk {jabatanName}
          </div>
          <button onClick={onClose} className="btn-secondary">
            Tutup Modal
          </button>
        </div>

      </div>
    </div>
  );
}
