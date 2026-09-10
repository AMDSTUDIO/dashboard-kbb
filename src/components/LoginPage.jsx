import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  Sparkles
} from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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

      <div style={{ width: '100%', maxWidth: '440px', zIndex: 10 }}>
        
        {/* Main Card */}
        <div className="glass-card" style={{ padding: 'clamp(20px, 5vw, 36px) clamp(16px, 4vw, 32px)', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.85)', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.2)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
          
          {/* Header & Logo BKPSDM */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ 
              padding: '10px 18px', 
              borderRadius: '16px', 
              background: '#ffffff', 
              border: '1px solid rgba(255, 255, 255, 0.9)',
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
            }}>
              <img 
                src="/logo-bkpsdm.png" 
                alt="Logo BKPSDM KBB" 
                style={{ height: '58px', maxWidth: '100%', objectFit: 'contain' }} 
              />
            </div>

            <span className="badge badge-sky" style={{ fontSize: '0.7rem', padding: '4px 10px', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles style={{ width: '12px', height: '12px' }} /> PEMKAB BANDUNG BARAT
            </span>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '6px 0 4px 0' }}>
              DASHBOARD <span style={{ color: '#38bdf8' }}>EKSEKUTIF</span>
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: 0 }}>
              Portal Masuk Analisis & Infografik Kepegawaian KBB
            </p>
          </div>

          {/* Alert Error Message */}
          {error && (
            <div style={{ 
              background: 'rgba(244, 63, 94, 0.1)', 
              border: '1px solid rgba(244, 63, 94, 0.3)', 
              borderRadius: '12px', 
              padding: '12px 16px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertCircle style={{ color: '#f43f5e', width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.825rem', color: '#fda4af', lineHeight: '1.4' }}>
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Username / NIP Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                NIP atau Username
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
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
                    padding: '12px 14px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                Kata Sandi
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
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
                    padding: '12px 44px 12px 42px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
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
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
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
                padding: '14px',
                borderRadius: '12px',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: 700,
                marginTop: '6px'
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
          </form>

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

