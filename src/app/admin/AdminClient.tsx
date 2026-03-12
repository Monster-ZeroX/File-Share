'use client';

import { useState, useEffect } from 'react';
import { Trash2, Users, FileIcon, Shield, Settings, Activity, Search, AlertCircle, Ban, Database, FileText } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export default function AdminClient({ users, files }: { users: any[], files: any[] }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'files' | 'settings' | 'audit'>('analytics');
  const [loading, setLoading] = useState<string | null>(null);

  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [fileSearch, setFileSearch] = useState('');
  const [selectedUserForFiles, setSelectedUserForFiles] = useState<string | null>(null);
  
  // Settings Form State
  const [regEnabled, setRegEnabled] = useState(true);
  const [maintMode, setMaintMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [brandName, setBrandName] = useState('SLIIT File Share');
  const [brandColor, setBrandColor] = useState('#0070f3');
  
  const [userLimits, setUserLimits] = useState<Record<string, string>>({}); // local state for editing text inputs

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    action: () => void;
  }>({ isOpen: false, title: '', message: '', confirmText: 'Confirm', action: () => {} });

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(d => {
      if (d.settings) {
        setSettings(d.settings);
        setRegEnabled(d.settings.registrationEnabled);
        setMaintMode(d.settings.maintenanceMode);
        setAnnouncement(d.settings.siteAnnouncement || '');
        setBrandName(d.settings.customBrandName);
        setBrandColor(d.settings.customBrandColor);
      }
    });
    fetch('/api/admin/audit').then(r => r.json()).then(d => {
      if (d.logs) setAuditLogs(d.logs);
    });
  }, []);

  const saveSettings = async () => {
    setLoading('settings');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationEnabled: regEnabled,
          maintenanceMode: maintMode,
          siteAnnouncement: announcement,
          customBrandName: brandName,
          customBrandColor: brandColor
        })
      });
      if (res.ok) alert('Settings Saved! (Brand color effect may require page reload)');
    } catch (e: any) { alert(e.message); }
    setLoading(null);
  };

  const deleteUser = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User',
      message: `WARNING: This will permanently delete user ${name} and ALL their uploaded files. Proceed?`,
      confirmText: 'Delete User',
      action: async () => {
        setLoading(`user-${id}`);
        try {
          const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete user');
          window.location.reload();
        } catch (e: any) { alert(e.message); setLoading(null); }
      }
    });
  };

  const deleteFile = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Force Delete File',
      message: `Are you sure you want to forcibly delete file ${name}?`,
      confirmText: 'Delete File',
      action: async () => {
        setLoading(`file-${id}`);
        try {
          const res = await fetch(`/api/admin/files/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Failed to delete file');
          window.location.reload();
        } catch (e: any) { alert(e.message); setLoading(null); }
      }
    });
  };

  const updateUserStatus = async (id: string, isSuspended: boolean) => {
    setLoading(`suspend-${id}`);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuspended })
      });
      if (!res.ok) throw new Error('Failed to update user');
      window.location.reload();
    } catch (e: any) { alert(e.message); setLoading(null); }
  };

  const updateUserRole = async (id: string, role: string) => {
    setLoading(`role-${id}`);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Failed to update user');
      window.location.reload();
    } catch (e: any) { alert(e.message); setLoading(null); }
  };

  const saveUserLimit = async (id: string) => {
    if (!userLimits[id]) return;
    setLoading(`limit-${id}`);
    try {
      const limitBytes = parseInt(userLimits[id], 10) * 1024 * 1024; // MB to Bytes
      if (isNaN(limitBytes)) throw new Error('Invalid number');
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageLimit: limitBytes })
      });
      if (!res.ok) throw new Error('Failed to update limit');
      window.location.reload();
    } catch (e: any) { alert(e.message); setLoading(null); }
  };

  const totalStorage = files.reduce((sum, f) => sum + f.size, 0);
  
  // Analytics
  const typeCounts: Record<string, number> = {};
  files.forEach(f => {
    let cat = 'Other';
    if (f.mime_type.startsWith('image/')) cat = 'Images';
    else if (f.mime_type === 'application/pdf') cat = 'PDFs';
    else if (f.mime_type.includes('zip') || f.mime_type.includes('tar') || f.mime_type.includes('rar')) cat = 'Archives';
    else if (f.mime_type.startsWith('video/')) cat = 'Videos';
    else if (f.mime_type.startsWith('audio/')) cat = 'Audio';
    
    typeCounts[cat] = (typeCounts[cat] || 0) + 1;
  });

  const displayedFiles = files
    .filter(f => selectedUserForFiles ? f.uploader.id === selectedUserForFiles : true)
    .filter(f => f.name.toLowerCase().includes(fileSearch.toLowerCase()));

  const handleViewUserFiles = (userId: string) => {
    setSelectedUserForFiles(userId);
    setActiveTab('files');
    setFileSearch('');
  };

  return (
    <div className="glass-card" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid var(--border)', paddingBottom: '15px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('analytics')} className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}>
          <Activity size={18}/> Analytics
        </button>
        <button onClick={() => { setActiveTab('users'); setSelectedUserForFiles(null); }} className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}>
          <Users size={18}/> Manage Users
        </button>
        <button onClick={() => { setActiveTab('files'); setSelectedUserForFiles(null); }} className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}>
          <FileIcon size={18}/> File Browser
        </button>
        <button onClick={() => setActiveTab('settings')} className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}>
          <Settings size={18}/> Platform Settings
        </button>
        <button onClick={() => setActiveTab('audit')} className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}>
          <Shield size={18}/> Audit Logs
        </button>
      </div>

      <style jsx>{`
        .tab-btn {
          background: transparent;
          color: var(--text-muted);
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: var(--primary);
          color: var(--background);
        }
        .tab-btn:hover:not(.active) {
          background: rgba(0,0,0,0.05);
        }
      `}</style>

      <div style={{ overflowX: 'auto', minHeight: '500px' }}>
        
        {activeTab === 'analytics' && (
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', background: 'rgba(0,112,243,0.1)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(0,112,243,0.2)' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={16}/> Global Platform Storage</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{formatBytes(totalStorage)}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '5px' }}>Total space consumed by {files.length} files</p>
              </div>
            </div>

            <h3 style={{ marginBottom: '15px' }}>File Type Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {Object.entries(typeCounts).map(([type, count]) => (
                <div key={type} className="glass-card" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '10px' }}><FileIcon size={20}/></div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px' }}>{type}</h4>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{count}</p>
                  </div>
                </div>
              ))}
              {Object.keys(typeCounts).length === 0 && <p style={{ color: 'var(--text-muted)' }}>No files uploaded yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                <th style={{ padding: '12px' }}>Name / Email</th>
                <th style={{ padding: '12px' }}>Role</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Storage Quota</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 500 }}>{u.name} {u.verified && <span style={{color:'var(--success)', fontSize: '10px', marginLeft: '4px'}}>VERIFIED</span>}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{u.email} ({u.sliit_id})</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={u.role || 'USER'} 
                      onChange={(e) => updateUserRole(u.id, e.target.value)}
                      disabled={loading === `role-${u.id}`}
                      className="input-field" style={{ padding: '6px', fontSize: '12px', margin: 0, width: 'auto' }}>
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {u.isSuspended ? (
                      <span style={{ color: 'var(--error)', background: 'rgba(255, 77, 79, 0.1)', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>Suspended</span>
                    ) : (
                      <span style={{ color: 'var(--success)', background: 'rgba(0, 200, 83, 0.1)', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 500 }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="number" 
                        className="input-field" 
                        style={{ padding: '6px', margin: 0, width: '80px', fontSize: '12px' }}
                        placeholder={String(Math.round(u.storageLimit / 1024 / 1024))}
                        value={userLimits[u.id] !== undefined ? userLimits[u.id] : ''}
                        onChange={(e) => setUserLimits({...userLimits, [u.id]: e.target.value})}
                      /> MB
                      {userLimits[u.id] !== undefined && userLimits[u.id] !== '' && (
                        <button onClick={() => saveUserLimit(u.id)} disabled={loading === `limit-${u.id}`} className="btn-primary" style={{ padding: '6px 10px', fontSize: '11px' }}>Save</button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleViewUserFiles(u.id)}
                      style={{ background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
                      <FileIcon size={14}/> Files
                    </button>
                    <button 
                      onClick={() => updateUserStatus(u.id, !u.isSuspended)} 
                      disabled={loading === `suspend-${u.id}`}
                      style={{ background: 'transparent', color: u.isSuspended ? 'var(--success)' : '#faad14', border: '1px solid currentColor', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
                      <Ban size={14}/> {loading === `suspend-${u.id}` ? '...' : (u.isSuspended ? 'Unsuspend' : 'Suspend')}
                    </button>
                    <button 
                      onClick={() => deleteUser(u.id, u.name)} 
                      disabled={loading === `user-${u.id}`}
                      style={{ background: 'rgba(255, 77, 79, 0.1)', color: 'var(--error)', border: '1px solid var(--error)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Trash2 size={14}/> {loading === `user-${u.id}` ? '...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'files' && (
          <div>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}/>
                <input type="text" className="input-field" placeholder="Search by file name..." style={{ paddingLeft: '40px', margin: 0 }} value={fileSearch} onChange={e => setFileSearch(e.target.value)} />
              </div>
              {selectedUserForFiles && (
                <div style={{ background: 'rgba(0,112,243,0.1)', color: 'var(--primary)', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Viewing user's files</span>
                  <button onClick={() => setSelectedUserForFiles(null)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>✕</button>
                </div>
              )}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <th style={{ padding: '12px' }}>File Name</th>
                  <th style={{ padding: '12px' }}>Uploader</th>
                  <th style={{ padding: '12px' }}>Size</th>
                  <th style={{ padding: '12px' }}>Downloads</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedFiles.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                    <td style={{ padding: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</td>
                    <td style={{ padding: '12px' }}>{f.uploader.name} ({f.uploader.sliit_id})</td>
                    <td style={{ padding: '12px' }}>{formatBytes(f.size)}</td>
                    <td style={{ padding: '12px' }}>{f.downloads}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => deleteFile(f.id, f.name)} 
                        disabled={loading === `file-${f.id}`}
                        style={{ background: 'rgba(255, 77, 79, 0.1)', color: 'var(--error)', border: '1px solid var(--error)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Trash2 size={14}/> {loading === `file-${f.id}` ? '...' : 'Force Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
                {displayedFiles.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding: '20px', color: 'var(--text-muted)'}}>No files found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Global Platform Settings</h3>
            
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Access Control</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', cursor: 'pointer' }}>
                <input type="checkbox" checked={regEnabled} onChange={e => setRegEnabled(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                <span>Enable New User Registrations</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={maintMode} onChange={e => setMaintMode(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                <span><AlertCircle size={16} style={{ color: 'var(--error)', display: 'inline', verticalAlign: 'middle' }}/> Enable Maintenance Mode (Locks out users)</span>
              </label>
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Custom Branding</h4>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Platform Name</label>
                <input type="text" className="input-field" value={brandName} onChange={e => setBrandName(e.target.value)} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Primary Brand Color HEX</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ width: '50px', height: '40px', padding: 0, border: 'none', cursor: 'pointer' }} />
                  <input type="text" className="input-field" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ margin: 0, flex: 1 }} />
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>Site Announcement Banner</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Message will appear at the top of the screen for all users. Leave blank to disable.</p>
              <textarea 
                className="input-field" 
                rows={3} 
                placeholder="We will be undergoing maintenance at midnight..."
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
              />
            </div>

            <button onClick={saveSettings} disabled={loading === 'settings'} className="btn-primary">
              {loading === 'settings' ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        )}

        {activeTab === 'audit' && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <th style={{ padding: '12px 15px' }}>Timestamp</th>
                  <th style={{ padding: '12px 15px' }}>Admin ID</th>
                  <th style={{ padding: '12px 15px' }}>Action</th>
                  <th style={{ padding: '12px 15px' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <td style={{ padding: '12px 15px', whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                    <td style={{ padding: '12px 15px', color: 'var(--text-muted)' }}>{log.adminId}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ background: 'rgba(0, 112, 243, 0.1)', color: 'var(--primary)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>{log.details}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', padding: '20px', color: 'var(--text-muted)'}}>No audit logs recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.action}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
}
