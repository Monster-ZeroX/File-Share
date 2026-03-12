'use client';

import { useState } from 'react';
import { Trash2, Users, FileIcon } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function AdminClient({ users, files }: { users: any[], files: any[] }) {
  const [activeTab, setActiveTab] = useState<'users' | 'files'>('users');
  const [loading, setLoading] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    action: () => {}
  });

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
        } catch (e: any) {
          alert(e.message);
          setLoading(null);
        }
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
        } catch (e: any) {
          alert(e.message);
          setLoading(null);
        }
      }
    });
  };

  return (
    <div className="glass-card" style={{ padding: '30px' }}>
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ background: activeTab === 'users' ? 'var(--primary)' : 'transparent', color: activeTab === 'users' ? 'var(--background)' : 'var(--text-muted)', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <Users size={18}/> Manage Users
        </button>
        <button 
          onClick={() => setActiveTab('files')}
          style={{ background: activeTab === 'files' ? 'var(--primary)' : 'transparent', color: activeTab === 'files' ? 'var(--background)' : 'var(--text-muted)', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
          <FileIcon size={18}/> Manage Files (Storage)
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {activeTab === 'users' ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>
                <th style={{ padding: '12px' }}>Name</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>SLIIT ID</th>
                <th style={{ padding: '12px' }}>Uploads</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '14px' }}>
                  <td style={{ padding: '12px' }}>{u.name} {u.verified && <span style={{color:'var(--success)', fontSize: '10px', marginLeft: '4px'}}>VERIFIED</span>}</td>
                  <td style={{ padding: '12px' }}>{u.email}</td>
                  <td style={{ padding: '12px' }}>{u.sliit_id}</td>
                  <td style={{ padding: '12px' }}>{u._count.uploadedFiles} files</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => deleteUser(u.id, u.name)} 
                      disabled={loading === `user-${u.id}`}
                      style={{ background: 'rgba(255, 77, 79, 0.1)', color: 'var(--error)', border: '1px solid var(--error)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Trash2 size={14}/> {loading === `user-${u.id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
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
              {files.map(f => (
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
                      <Trash2 size={14}/> {loading === `file-${f.id}` ? 'Deleting...' : 'Force Delete'}
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding: '20px', color: 'var(--text-muted)'}}>No files found</td></tr>}
            </tbody>
          </table>
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
