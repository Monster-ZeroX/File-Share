'use client';

import { useState, useRef } from 'react';
import { User, Camera, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
}
