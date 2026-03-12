'use client';

import { useState } from 'react';
import { X, Copy, CheckCircle2, AlertCircle, Trash2, KeyRound } from 'lucide-react';

export default function PublicLinkModal({ file, onClose, onUpdate }: { file: any, onClose: () => void, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [localToken, setLocalToken] = useState(file.publicToken);

  const tokenUrl = localToken ? `${window.location.origin}/public/${localToken}` : '';

  const handleAction = async (action: 'create' | 'remove' | 'update_password') => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/files/${file.id}/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, password: password || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update link');

      if (action === 'create') {
        setSuccess('Public link generated!');
        setLocalToken(data.publicToken);
      } else if (action === 'remove') {
        setSuccess('Public link removed.');
        setLocalToken(null);
      } else if (action === 'update_password') {
        setSuccess('Password updated!');
      }
      setPassword('');
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tokenUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div className="glass-card" style={{ padding: '30px', width: '100%', maxWidth: '450px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <h2 style={{ marginBottom: '5px', fontSize: '20px' }}>Public Share Link</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Anyone with this link can view and download the file. You can optionally secure it with a password.
        </p>

        {error && <div style={{ color: 'var(--error)', background: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16}/> {error}</div>}
        {success && <div style={{ color: 'var(--success)', background: 'rgba(0, 200, 83, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={16}/> {success}</div>}

        {!localToken ? (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Security Password (Optional)</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Leave blank for open access"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="btn-primary" onClick={() => handleAction('create')} disabled={loading} style={{ width: '100%', marginTop: '15px' }}>
              {loading ? 'Generating...' : 'Generate Public Link'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input type="text" className="input-field" value={tokenUrl} readOnly style={{ flex: 1, color: 'var(--primary)', background: 'rgba(0, 112, 243, 0.05)' }} />
              <button onClick={copyToClipboard} className="btn-primary" style={{ padding: '10px 15px', background: copied ? 'var(--success)' : 'var(--primary)', border: 'none' }}>
                {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div style={{ background: 'var(--background)', padding: '15px', borderRadius: '10px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>
                <KeyRound size={14}/> Change Password / Add Password
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="password" 
                  className="input-field" 
                  style={{ flex: 1 }}
                  placeholder="New link password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button onClick={() => handleAction('update_password')} disabled={loading || !password} className="btn-primary" style={{ background: 'var(--foreground)', color: 'var(--background)' }}>
                  Save
                </button>
              </div>
            </div>

            <button onClick={() => handleAction('remove')} disabled={loading} className="btn-primary" style={{ width: '100%', background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)' }}>
              <Trash2 size={16} style={{ marginRight: '6px' }}/> Revoke Public Link
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
