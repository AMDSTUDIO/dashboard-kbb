import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  UserPlus,
  CheckCircle2,
  Search
} from 'lucide-react';
import { authService } from '../services/authService';
import { findEmployeeByNip } from '../services/sheetsService';

export default function LoginPage({ onLoginSuccess }) {
  const [hasSuperAdmin, setHasSuperAdmin] = useState(() => authService.hasRegisteredSuperAdmin());
  // 'login' | 'register' | 'setup'
  const [mode, setMode] = useState(() => (authService.hasRegisteredSuperAdmin() ? 'login' : 'setup'));

  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration & Setup Form State
  const [regNip, setRegNip] = useState('');
  const [regNama, setRegNama] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Staf Analis Kepegawaian');
  const [regOpd, setRegOpd] = useState('BKPSDM Kabupaten Bandung Barat');
  const [regJabatan, setRegJabatan] = useState('');

  // NIP Verification State
  const [isCheckingNip, setIsCheckingNip] = useState(false);
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);
  const [nipCheckError, setNipCheckError] = useState('');

  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const exists = authService.hasRegisteredSuperAdmin();
    setHasSuperAdmin(exists);
    if (!exists) {
      setMode('setup');
    }
  }, []);

  const resetMessages = () => {
    setError('');
    setSuccessInfo('');
    setNipCheckError('');
  };

  const handleVerifyNip = async (nipToVerify) => {
    const targetNip = String(nipToVerify ?? regNip).replace(/\s+/g, '').trim();
    if (!targetNip) {
      setNipCheckError('Masukkan NIP Pegawai terlebih dahulu.');
      setVerifiedEmployee(null);
      return null;
    }

    setIsCheckingNip(true);
    setNipCheckError('');
    try {
      const emp = await findEmployeeByNip(targetNip);
      if (emp) {
        setVerifiedEmployee(emp);
        setRegNama(emp.nama || '');
        setRegOpd(emp.opd || 'BKPSDM Kabupaten Bandung Barat');
        setRegJabatan(emp.jabatan || '');
        if (!regUsername) {
          const suggested = (emp.nama || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 14);
          if (suggested) setRegUsername(suggested);
        }
        return emp;
      } else {
        setVerifiedEmployee(null);
        setNipCheckError('NIP tidak ditemukan dalam Master Data Pegawai BKPSDM KBB.');
        return null;
      }
    } catch (err) {
      setNipCheckError('Gagal memverifikasi NIP ke database kepegawaian. Periksa koneksi Anda.');
      return null;
    } finally {
      setIsCheckingNip(false);
    }
  };

  const handleNipInputChange = (val) => {
    const clean = val.replace(/\s+/g, '');
    setRegNip(clean);
    setVerifiedEmployee(null);
    setNipCheckError('');
    // Auto-trigger lookup when 18 digits are entered
    if (clean.length === 18 && /^\d+$/.test(clean)) {
      handleVerifyNip(clean);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      const user = await authService.login(identifier, password, rememberMe);
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Gagal melakukan login. Silakan periksa kembali kredensial Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      // Ensure NIP is verified against BKPSDM KBB Master Data
      let emp = verifiedEmployee;
      if (!emp) {
        emp = await handleVerifyNip(regNip);
      }
      if (!emp) {
        throw new Error('Pendaftaran ditolak: NIP Anda harus terdaftar di Master Data Pegawai BKPSDM KBB.');
      }

      const pendingUser = authService.requestAccountRegistration({
        name: regNama || emp.nama,
        nip: regNip,
        username: regUsername,
        password: regPassword,
        role: regRole,
        opd: regOpd || emp.opd,
        jabatan: regJabatan || emp.jabatan
      });

      // Clear registration fields & switch to login with success banner
      setRegNip('');
      setRegNama('');
      setRegUsername('');
      setRegPassword('');
      setVerifiedEmployee(null);
      setMode('login');
      setIdentifier(pendingUser.username);
      setSuccessInfo(
        `Pengajuan akun untuk ${pendingUser.name} (@${pendingUser.username}) berhasil dikirim! Akun Anda akan aktif setelah disetujui (Approve) oleh Superadmin.`
      );
    } catch (err) {
      setError(err.message || 'Gagal mengajukan pendaftaran akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupSuperAdmin = async (e) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      authService.registerUser(
        {
          name: regNama,
          nip: regNip,
          username: regUsername,
          password: regPassword,
          role: 'Superadmin',
          opd: regOpd,
          jabatan: regJabatan || 'Super Administrator'
        },
        true
      );

      const loggedInUser = await authService.login(regUsername, regPassword, true);
      onLoginSuccess(loggedInUser);
    } catch (err) {
      setError(err.message || 'Gagal membuat akun Superadmin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '24px',
      background: 'linear-gradient(135deg, rgba(9, 13, 22, 0.25) 0%, rgba(5, 8, 15, 0.45) 100%), url("/bkpsdm-bg.jpg") center/cover no-repeat fixed',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Glow Decorations */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(40px)'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(2, 132, 199, 0.2) 0%, rgba(0, 0, 0, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(50px)'
      }} />

      <div style={{ width: '100%', maxWidth: '475px', zIndex: 10 }}>
        
        {/* Main Card */}
        <div className="glass-card" style={{ padding: 'clamp(20px, 5vw, 34px) clamp(16px, 4vw, 30px)', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.86)', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
          
          {/* Header & Logo BKPSDM */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ 
              padding: '10px 18px', 
              borderRadius: '16px', 
              background: '#ffffff', 
              border: '1px solid rgba(255, 255, 255, 0.9)',
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <img 
                src="/logo-bkpsdm.png" 
                alt="Logo BKPSDM KBB" 
                style={{ height: '54px', maxWidth: '100%', objectFit: 'contain' }} 
              />
            </div>

            <span className="badge badge-sky" style={{ fontSize: '0.7rem', padding: '4px 10px', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles style={{ width: '12px', height: '12px' }} /> PEMKAB BANDUNG BARAT
            </span>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '6px 0 4px 0' }}>
              DASHBOARD <span style={{ color: '#38bdf8' }}>EKSEKUTIF</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              {mode === 'setup'
                ? 'Inisialisasi Akun Superadmin Utama'
                : mode === 'register'
                ? 'Formulir Pengajuan Akun Pegawai ASN KBB'
                : 'Portal Masuk Analisis & Infografik Kepegawaian KBB'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.75)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '18px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: mode === 'login' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: mode === 'login' ? '#38bdf8' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              Masuk (Login)
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                resetMessages();
              }}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: mode === 'register' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                color: mode === 'register' ? '#34d399' : '#94a3b8',
                transition: 'all 0.2s'
              }}
            >
              Daftar Akun
            </button>

            {!hasSuperAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMode('setup');
                  resetMessages();
                }}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: mode === 'setup' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  color: mode === 'setup' ? '#fbbf24' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
              >
                Setup Superadmin
              </button>
            )}
          </div>

          {/* Success Notification Banner */}
          {successInfo && (
            <div style={{ 
              background: 'rgba(16, 185, 129, 0.12)', 
              border: '1px solid rgba(16, 185, 129, 0.35)', 
              borderRadius: '12px', 
              padding: '12px 16px', 
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <CheckCircle2 style={{ color: '#34d399', width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8rem', color: '#a7f3d0', lineHeight: '1.45' }}>
                {successInfo}
              </div>
            </div>
          )}

          {/* Alert Error Message */}
          {error && (
            <div style={{ 
              background: 'rgba(244, 63, 94, 0.1)', 
              border: '1px solid rgba(244, 63, 94, 0.3)', 
              borderRadius: '12px', 
              padding: '12px 16px', 
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertCircle style={{ color: '#f43f5e', width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8rem', color: '#fda4af', lineHeight: '1.45' }}>
                {error}
              </div>
            </div>
          )}

          {/* MODE 1: PUBLIC ACCOUNT REGISTRATION (REQUIRES NIP VERIFICATION + SUPERADMIN APPROVAL) */}
          {mode === 'register' ? (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '13px', width: '100%' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  fontSize: '0.75rem',
                  color: '#bae6fd',
                  lineHeight: 1.4
                }}
              >
                Masukkan <strong>NIP ASN KBB</strong> Anda untuk mengisi profil otomatis. Pendaftaran akun akan diverifikasi dan disetujui (<strong>Approve</strong>) oleh Superadmin.
              </div>

              {/* NIP + Cek NIP Button */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  NIP Pegawai (18 Digit) *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={regNip}
                    onChange={(e) => handleNipInputChange(e.target.value)}
                    placeholder="Contoh: 198501012010011001"
                    required
                    style={{
                      flex: 1,
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: verifiedEmployee
                        ? '1px solid rgba(16, 185, 129, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyNip(regNip)}
                    disabled={isCheckingNip}
                    className="btn-secondary"
                    style={{
                      padding: '0 14px',
                      borderRadius: '10px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      color: '#38bdf8',
                      borderColor: 'rgba(56, 189, 248, 0.35)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isCheckingNip ? (
                      <Loader2 className="spin-icon" style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Search style={{ width: '14px', height: '14px' }} />
                    )}
                    {isCheckingNip ? 'Mengecek...' : 'Cek NIP'}
                  </button>
                </div>

                {/* NIP Lookup Feedback */}
                {verifiedEmployee && (
                  <div style={{ marginTop: '6px', fontSize: '0.73rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                    Terverifikasi ASN KBB: {verifiedEmployee.statusAsn} ({verifiedEmployee.golongan}) — {verifiedEmployee.jabatan}
                  </div>
                )}
                {nipCheckError && (
                  <div style={{ marginTop: '6px', fontSize: '0.73rem', color: '#fda4af' }}>
                    {nipCheckError}
                  </div>
                )}
              </div>

              {/* Nama Lengkap (Auto-filled from NIP) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  Nama Lengkap Pegawai *
                </label>
                <input
                  type="text"
                  value={regNama}
                  onChange={(e) => setRegNama(e.target.value)}
                  placeholder="Otomatis terisi setelah Cek NIP"
                  required
                  readOnly={Boolean(verifiedEmployee)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: verifiedEmployee ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Username & Usulan Role */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="username"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                    Usulan Hak Akses
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 10px',
                      background: '#0f172a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.8rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Staf Analis Kepegawaian">Staf Analis Kepegawaian</option>
                    <option value="Pengawas Kepegawaian">Pengawas Kepegawaian</option>
                    <option value="Admin Eksekutif BKPSDM">Admin Eksekutif BKPSDM</option>
                    <option value="Pimpinan / Kepala Badan">Pimpinan / Kepala Badan</option>
                  </select>
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  Kata Sandi (Min. 6 Karakter) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Buat Kata Sandi Login"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 40px 10px 12px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                  </button>
                </div>
              </div>

              {/* OPD / Instansi */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  OPD / Unit Kerja
                </label>
                <input
                  type="text"
                  value={regOpd}
                  onChange={(e) => setRegOpd(e.target.value)}
                  readOnly={Boolean(verifiedEmployee)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    background: verifiedEmployee ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#cbd5e1',
                    fontSize: '0.82rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  justifyContent: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  marginTop: '4px',
                  background: 'linear-gradient(135deg, #10b981, #059669)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="spin-icon" style={{ width: '18px', height: '18px' }} />
                    Mengirim Pengajuan Akun...
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: '18px', height: '18px' }} />
                    Ajukan Pendaftaran Akun (Menunggu Approval)
                  </>
                )}
              </button>
            </form>
          ) : mode === 'setup' && !hasSuperAdmin ? (
            /* MODE 2: INITIAL SUPERADMIN SETUP (IF 0 SUPERADMINS EXIST) */
            <form onSubmit={handleSetupSuperAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '13px', width: '100%' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: '0.75rem',
                  color: '#fde68a',
                  lineHeight: 1.4
                }}
              >
                Belum ada akun <strong>Superadmin</strong> terdaftar. Silakan buat akun Superadmin utama Anda (bisa gunakan fitur <strong>Cek NIP</strong> untuk auto-fill).
              </div>

              {/* NIP + Cek NIP */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  NIP Superadmin *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={regNip}
                    onChange={(e) => handleNipInputChange(e.target.value)}
                    placeholder="Masukkan NIP"
                    required
                    style={{
                      flex: 1,
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleVerifyNip(regNip)}
                    disabled={isCheckingNip}
                    className="btn-secondary"
                    style={{
                      padding: '0 12px',
                      borderRadius: '10px',
                      fontSize: '0.75rem',
                      color: '#38bdf8',
                      borderColor: 'rgba(56, 189, 248, 0.35)'
                    }}
                  >
                    {isCheckingNip ? <Loader2 className="spin-icon" style={{ width: '14px', height: '14px' }} /> : <Search style={{ width: '14px', height: '14px' }} />}
                    Cek NIP
                  </button>
                </div>
                {verifiedEmployee && (
                  <div style={{ marginTop: '5px', fontSize: '0.72rem', color: '#34d399' }}>
                    ✓ Data ditemukan: {verifiedEmployee.nama}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  Nama Lengkap Superadmin *
                </label>
                <input
                  type="text"
                  value={regNama}
                  onChange={(e) => setRegNama(e.target.value)}
                  placeholder="Masukkan Nama Lengkap"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="superadmin"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                    Kata Sandi (Min. 6) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Kata Sandi"
                      required
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 34px 10px 12px',
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        color: '#ffffff',
                        fontSize: '0.84rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  justifyContent: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  marginTop: '4px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="spin-icon" style={{ width: '18px', height: '18px' }} />
                    Membuat Akun Superadmin...
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: '18px', height: '18px' }} />
                    Simpan & Masuk sebagai Superadmin
                  </>
                )}
              </button>
            </form>
          ) : (
            /* MODE 3: NORMAL LOGIN FORM */
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', boxSizing: 'border-box' }}>
              
              {/* Username / NIP Field */}
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  NIP atau Username
                </label>
                <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                    <User style={{ width: '18px', height: '18px' }} />
                  </div>
                  <input 
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Masukkan NIP atau Username"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 14px 12px 42px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Kata Sandi
                </label>
                <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', display: 'flex', alignItems: 'center', pointerEvents: 'none', zIndex: 2 }}>
                    <Lock style={{ width: '18px', height: '18px' }} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Kata Sandi"
                    required
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 44px 12px 42px',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      zIndex: 2
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  Ingat Saya di Perangkat Ini
                </label>
                <span style={{ color: '#38bdf8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck style={{ width: '14px', height: '14px' }} /> SSL Encrypted
                </span>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginTop: '4px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="spin-icon" style={{ width: '18px', height: '18px' }} />
                    Memverifikasi Masuk...
                  </>
                ) : (
                  <>
                    Masuk ke Dashboard
                    <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </>
                )}
              </button>

              {/* Quick link to Register */}
              <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                Belum punya akun akses?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    resetMessages();
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Ajukan Pendaftaran Akun ASN
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info & Developer Attribution */}
        <div style={{ textAlign: 'center', fontSize: '0.785rem', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
          <div style={{ color: '#ffffff', fontWeight: 600 }}>Sistem Informasi Kepegawaian &copy; 2026. BKPSDM Kab. Bandung Barat.</div>
          <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            Developed by <a href="https://creativedivisions.my.id" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 700 }}>creativedivisions.my.id</a>
          </div>
        </div>

      </div>
    </div>
  );
}
