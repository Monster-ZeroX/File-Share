'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Search, Check, Send } from 'lucide-react';

export default function ShareModal({ file, onClose }: { file: any, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [expiresIn, setExpiresIn] = useState('0'); // 0 means no expiration
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        setIsSearching(true);
        fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
          .then(r => r.json())
          .then(d => { setResults(d.users || []); setIsSearching(false); })
          .catch(() => setIsSearching(false));
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const toggleUser = (user: any) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }
    
    setIsSharing(true);
    setError('');
    
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: file.id, 
          receiverIds: selectedUsers.map(u => u.id),
          expiresInDays: expiresIn === '0' ? null : Number(expiresIn)
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMessage('File shared successfully!');
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1500);

    } catch (err: any) {
      setError(err.message);
      setIsSharing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', position: 'relative', animation: 'slideUp 0.3s ease' }}>
        <button onClick={onClose} disabled={isSharing} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ marginBottom: '5px' }}>Share File</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>{file.name}</p>
        
        {error && <div style={{ color: 'var(--error)', background: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
        {message && <div style={{ color: 'var(--success)', background: 'rgba(0, 200, 83, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{message}</div>}

        <div style={{ position: 'relative', marginBottom: '15px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search users by name or SLIIT ID (e.g. IT2510...)" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: '45px' }}
          />
        </div>

        {isSearching && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Searching...</p>}
        
        {results.length > 0 && (
          <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '15px' }}>
            {results.map(user => {
              const isSelected = selectedUsers.some(u => u.id === user.id);
              return (
                <div 
                  key={user.id} 
                  onClick={() => toggleUser(user)}
                  style={{ padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isSelected ? 'rgba(0, 112, 243, 0.05)' : 'transparent' }}
                >
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '14px' }}>{user.name}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{user.sliit_id}</p>
                  </div>
                  {isSelected && <Check size={18} style={{ color: 'var(--primary)' }} />}
                </div>
              );
            })}
          </div>
        )}

        {selectedUsers.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--foreground)' }}>Selected Users ({selectedUsers.length})</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedUsers.map(user => (
                <div key={user.id} style={{ background: 'var(--primary)', color: 'var(--background)', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                  {user.name}
                  <X size={14} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => toggleUser(user)} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--foreground)' }}>Expiration (Optional)</label>
          <select 
            className="input-field" 
            value={expiresIn} 
            onChange={e => setExpiresIn(e.target.value)}
            style={{ backgroundColor: 'var(--card-bg)', color: 'var(--foreground)' }}
          >
            <option value="0" style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}>Never</option>
            <option value="1" style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}>1 Day</option>
            <option value="7" style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}>7 Days</option>
            <option value="30" style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}>30 Days</option>
          </select>
        </div>

        <button 
          className="btn-primary" 
          disabled={isSharing || selectedUsers.length === 0} 
          onClick={handleShare}
          style={{ width: '100%' }}
        >
          {isSharing ? 'Sharing & Emptying Emails...' : 'Share File'} <Send size={18} style={{ marginLeft: 8 }} />
        </button>

      </div>
    </div>
  );
}
