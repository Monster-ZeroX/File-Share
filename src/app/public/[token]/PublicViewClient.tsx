'use client';

import { useState } from 'react';
import { Download, File, User, Lock, AlertCircle } from 'lucide-react';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function PublicViewClient({ file }: { file: any }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/public/${file.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to download');
      
      // Auto download
      window.location.href = data.downloadUrl;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '20px' }}>
      <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        
        <div style={{ background: 'var(--primary)', color: 'var(--background)', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
          <File size={40} />
        </div>
        
        <h1 style={{ fontSize: '22px', marginBottom: '10px', wordBreak: 'break-all' }}>{file.name}</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '14px' }}>
           {formatBytes(file.size)} • {file.mime_type}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.03)', padding: '10px 20px', borderRadius: '10px', marginBottom: '30px' }}>
          {file.uploaderAvatar ? (
             <img src={`https://sliitr2.kaveeshainduwara.lk/${file.uploaderAvatar}`} alt="Avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
             <User size={20} style={{ color: 'var(--text-muted)' }} />
          )}
          <span style={{ fontSize: '14px' }}>Shared by <strong>{file.uploaderName}</strong></span>
        </div>

        {file.hasPassword ? (
          <form onSubmit={handleDownload} style={{ width: '100%' }}>
            {error && <div style={{ color: 'var(--error)', background: 'rgba(255, 77, 79, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}><AlertCircle size={16}/> {error}</div>}
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, marginBottom: '8px', justifyContent: 'center' }}>
              <Lock size={16} /> Password Required
            </label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Enter file password..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ textAlign: 'center', marginBottom: '15px' }}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
              {loading ? 'Verifying...' : 'Unlock & Download'}
            </button>
          </form>
        ) : (
          <div style={{ width: '100%' }}>
             {error && <p style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '10px' }}>{error}</p>}
             <button onClick={() => handleDownload()} className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
               <Download size={18} /> {loading ? 'Preparing Download...' : 'Download File'}
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
