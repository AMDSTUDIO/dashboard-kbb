import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';

export default function QuickSearch({ 
  employees = [], 
  onSelectEmployee, 
  onOpenMasterSearch, 
  placeholder = "Pencarian Cepat Pegawai (Nama, NIP, Jabatan, OPD)..." 
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Shortcut key listener (Ctrl + K or Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live filter employees
  const results = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const matches = [];
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const matchName = emp.nama?.toLowerCase().includes(q);
      const matchNip = emp.nip?.includes(q);
      const matchJab = emp.jabatan?.toLowerCase().includes(q);
      const matchOpd = emp.opd?.toLowerCase().includes(q);

      if (matchName || matchNip || matchJab || matchOpd) {
        matches.push(emp);
        if (matches.length >= 6) break; // Limit top 6 preview
      }
    }
    return matches;
  }, [query, employees]);

  const totalMatchCount = useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    if (!q || q.length < 2) return 0;
    return employees.filter(emp => 
      emp.nama?.toLowerCase().includes(q) ||
      emp.nip?.includes(q) ||
      emp.jabatan?.toLowerCase().includes(q) ||
      emp.opd?.toLowerCase().includes(q)
    ).length;
  }, [query, employees]);

  const handleSelect = (emp) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectEmployee) {
      onSelectEmployee(emp);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (onOpenMasterSearch) {
      onOpenMasterSearch(query);
    }
  };

  const handleKeyDownInput = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      handleViewAll();
    }
  };

  return (
    <div ref={containerRef} className="quick-search-container" style={{ position: 'relative', width: '100%', maxWidth: '720px', margin: '0 auto' }}>
      
      {/* Search Input Box - Spotlight Hero Design */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search style={{ 
          position: 'absolute', 
          left: '14px', 
          width: '16px', 
          height: '16px', 
          color: '#38bdf8', 
          pointerEvents: 'none' 
        }} />

        <input 
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDownInput}
          placeholder={placeholder}
          className="spotlight-search-input"
          style={{
            width: '100%',
            padding: '9px 38px 9px 40px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: isOpen ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '0.825rem',
            fontWeight: 500,
            outline: 'none',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isOpen 
              ? '0 0 20px rgba(56, 189, 248, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.1)' 
              : '0 4px 14px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)'
          }}
        />

        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            style={{
              position: 'absolute',
              right: '14px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px'
            }}
          >
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        )}
      </div>

      {/* Dropdown Live Results */}
      {isOpen && query.trim().length >= 2 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '14px',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
          zIndex: 200,
          overflow: 'hidden',
          minWidth: '320px'
        }}>
          
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Hasil Pencarian Cepat ({totalMatchCount})
            </span>
            <span style={{ fontSize: '0.65rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CornerDownLeft style={{ width: '10px', height: '10px' }} /> Enter untuk master
            </span>
          </div>

          {results.length > 0 ? (
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {results.map((emp) => (
                <div
                  key={emp.nip}
                  onClick={() => handleSelect(emp)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                      {emp.nama}
                    </span>
                    <span className={emp.statusAsn === 'PNS' ? 'badge badge-pns' : 'badge badge-pppk'} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                      {emp.statusAsn}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.725rem', color: '#94a3b8' }}>
                    <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>NIP. {emp.nip}</span>
                    <span>•</span>
                    <span>{emp.golongan || '-'}</span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.jabatan}
                  </div>

                  <div style={{ fontSize: '0.68rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {emp.opd}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
              Tidak ditemukan pegawai dengan kata kunci "<strong>{query}</strong>"
            </div>
          )}

          {/* Footer View All Link */}
          {totalMatchCount > 0 && (
            <button
              onClick={handleViewAll}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(56, 189, 248, 0.08)',
                border: 'none',
                borderTop: '1px solid rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '0.775rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)'}
            >
              Lihat Semua {totalMatchCount} Hasil di Master Data
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
          )}

        </div>
      )}
    </div>
  );
}
