'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/app/login/page.module.css';
import { Send, CheckCircle2, Lock } from 'lucide-react';

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', sliit_id: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && (!formData.name || !formData.email || !formData.sliit_id)) {
      return setError('Please fill all fields');
    }
    if (mode === 'signin' && !formData.email) {
      return setError('Please enter your email address');
    }
    if (mode === 'signup') {
      const idRegex = /^it\d{8}$/i;
      if (!idRegex.test(formData.sliit_id)) return setError('Invalid SLIIT ID Format (e.g. IT25101377)');
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, mode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('OTP must be 6 digits');

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: otp, mode, name: formData.name, sliit_id: formData.sliit_id, password: formData.password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return setError('Please enter your email and password');
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authCard + ' glass-card'}>
      <div className={styles.header}>
        <h1>SLIIT File Share</h1>
        <p>{step === 1 ? (mode === 'signin' ? 'Welcome back! Sign in to continue.' : 'Create your account to start sharing.') : 'Check your university email'}</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          {mode === 'signup' && (
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input 
                type="text" 
                className="input-field"
                placeholder="John Doe" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label>Email Address</label>
            <input 
              type="email" 
              className="input-field"
              placeholder="john@example.com" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          {mode === 'signup' && (
            <div className={styles.formGroup}>
              <label>SLIIT ID</label>
              <input 
                type="text" 
                className="input-field"
                placeholder="IT25101377" 
                value={formData.sliit_id}
                onChange={e => setFormData({...formData, sliit_id: e.target.value})}
              />
            </div>
          )}

          {/* Password Field (Required for Sign in if not using OTP, Optional/Required for Sign Up) */}
          <div className={styles.formGroup}>
            <label>{mode === 'signup' ? 'Create Password' : 'Password (Optional for OTP)'}</label>
            <input 
              type="password" 
              className="input-field"
              placeholder="••••••••" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required={mode === 'signup'}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {mode === 'signin' && (
              <button type="button" onClick={handlePasswordLogin} className={`btn-primary ${styles.button}`} style={{ flex: 1, padding: '12px 10px', fontSize: '14px' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In'} <Lock size={16} style={{marginLeft: 6}} />
              </button>
            )}
            <button type="submit" className={`btn-primary ${styles.button}`} style={{ flex: mode === 'signin' ? 1 : undefined, width: mode === 'signup' ? '100%' : undefined, padding: '12px 10px', fontSize: '14px', background: mode === 'signin' ? 'var(--background)' : 'var(--primary)', color: mode === 'signin' ? 'var(--foreground)' : 'var(--background)', border: '1px solid var(--border)' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic OTP'} <Send size={16} style={{marginLeft: 6}} />
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
            {mode === 'signin' ? (
              <span>New to SLIIT File Share? <button type="button" onClick={() => { setMode('signup'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Create an account</button></span>
            ) : (
              <span>Already have an account? <button type="button" onClick={() => { setMode('signin'); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Sign In</button></span>
            )}
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className={styles.otpContainer}>
          <div className={styles.formGroup} style={{ width: '100%' }}>
            <label style={{ textAlign: 'center' }}>Enter 6-digit code</label>
            <input 
              type="text" 
              maxLength={6}
              className={`input-field ${styles.otpInput}`}
              placeholder="••••••" 
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>
          
          <button type="submit" className={`btn-primary ${styles.button}`} disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify & Continue'} <CheckCircle2 size={18} style={{marginLeft: 8}} />
          </button>
          
          <button 
            type="button" 
            onClick={() => { setStep(1); setOtp(''); setError(''); }} 
            style={{background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '14px', marginTop: '10px', cursor: 'pointer'}}
          >
            ← Back to email
          </button>
        </form>
      )}
    </div>
  );
}
