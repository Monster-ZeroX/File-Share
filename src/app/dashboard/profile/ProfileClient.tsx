'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Camera, Lock, CheckCircle2, AlertCircle, Key, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage({ user }: { user: any }) {
  const router = useRouter();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl ? `https://sliitr2.kaveeshainduwara.lk/${user.avatarUrl}` : null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/keys').then(r => r.json()).then(d => {
      if (d.keys) setApiKeys(d.keys);
    });
  }, []);

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Key name is required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setApiKeys([data.apiKey, ...apiKeys]);
      setGeneratedKey(data.apiKey.key); // Show the key ONCE
      setNewKeyName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to revoke key');
      setApiKeys(apiKeys.filter(k => k.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Avatar must be an image');
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    let finalAvatarKey = user?.avatarUrl;

    try {
      // 1. Upload Avatar if changed
      if (avatar) {
        const gRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: `avatar-${Date.now()}-${avatar.name}`, contentType: avatar.type, size: avatar.size })
        });
        const gData = await gRes.json();
        if (!gRes.ok) throw new Error(gData.error || 'Failed to get upload URL');

        const xhr = new XMLHttpRequest();
        await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve(null);
            else reject(new Error('Avatar upload failed'));
          };
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.open('PUT', gData.signedUrl);
          xhr.setRequestHeader('Content-Type', avatar.type);
          xhr.send(avatar);
        });
        
        finalAvatarKey = gData.key;
      }

      // 2. Update Profile API
      const pRes = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           name, 
           avatarUrl: finalAvatarKey,
           ...(newPassword ? { currentPassword, newPassword } : {})
        })
      });

      const pData = await pRes.json();
      if (!pRes.ok) throw new Error(pData.error || 'Failed to update profile');

      setSuccess('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
      <h1 style={{ marginBottom: '25px', fontSize: '24px' }}>Profile Settings</h1>
      
      {error && <div style={{ color: 'var(--error)', background: 'rgba(255, 77, 79, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={18}/> {error}</div>}
      {success && <div style={{ color: 'var(--success)', background: 'rgba(0, 200, 83, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18}/> {success}</div>}

      <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        
        {/* Avatar Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div 
            style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--border)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={32} style={{ color: 'var(--text-muted)' }} />
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={14} color="white" />
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Profile Picture</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>JPG, GIF or PNG. Max size of 5MB.</p>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        {/* Basic Info Section */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Display Name</label>
          <input 
            type="text" 
            className="input-field" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div>
           <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-muted)' }}>Email/SLIIT ID (Unchangeable)</label>
           <input type="text" className="input-field" value={`${user?.email} (${user?.sliit_id})`} disabled style={{ opacity: 0.6 }} />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

        {/* Password Section */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16}/> Security</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {user?.hasPassword && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Current Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Enter current password to make changes"
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                />
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>{user?.hasPassword ? 'New Password' : 'Create Password (Optional)'}</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="Enter new password"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
              />
            </div>
          </div>
        </div>

        <button 
           className="btn-primary" 
           onClick={handleSave} 
           disabled={loading}
           style={{ marginTop: '10px' }}
        >
          {loading ? 'Saving Changes...' : 'Save Profile Settings'}
        </button>

      </div>

      {/* API Keys Section */}
      <h2 style={{ marginTop: '40px', marginBottom: '25px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Key size={20}/> Developer API Keys
      </h2>
      <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Generate API keys to interact dynamically with the SLIIT File Share platform. 
          <a href="/docs/api" target="_blank" style={{ color: 'var(--primary)', marginLeft: '10px', textDecoration: 'underline' }}>View API Documentation</a>
        </p>

        {generatedKey && (
          <div style={{ background: 'rgba(0, 200, 83, 0.1)', border: '1px solid var(--success)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
            <h4 style={{ color: 'var(--success)', margin: '0 0 10px 0', fontSize: '14px' }}>Key Created Successfully!</h4>
            <p style={{ fontSize: '13px', margin: '0 0 10px 0' }}>Please copy this key now. You won't be able to see it again.</p>
            <code style={{ display: 'block', background: 'var(--background)', padding: '10px', borderRadius: '6px', fontSize: '14px', wordBreak: 'break-all' }}>{generatedKey}</code>
            <button onClick={() => setGeneratedKey(null)} className="btn-secondary" style={{ marginTop: '10px', padding: '6px 12px', fontSize: '12px' }}>I have copied it</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="New Key Name (e.g. My Script)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            style={{ margin: 0, flex: 1 }}
          />
          <button onClick={handleCreateApiKey} disabled={loading || !newKeyName.trim()} className="btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
            Generate New Key
          </button>
        </div>

        {apiKeys.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-muted)' }}>Active Keys</h4>
            {apiKeys.map(k => (
              <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '14px' }}>{k.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>
                    Created {new Date(k.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button 
                  onClick={() => handleRevokeApiKey(k.id)}
                  style={{ background: 'transparent', color: 'var(--error)', border: 'none', cursor: 'pointer', padding: '5px' }}>
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
