'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, File, UserPlus, UploadCloud, Clock, Search, Link as LinkIcon, Star, Inbox } from 'lucide-react';
import UploadModal from './UploadModal';
import ShareModal from './ShareModal';
import PublicLinkModal from './PublicLinkModal';
import ConfirmModal from './ConfirmModal';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function getPublicUrl(r2_key: string) {
  // If we had the public domain injected we could use it, otherwise fall back to raw key parsing logic
  // For simplicity, we assume R2_PUBLIC_DOMAIN is available but since it's client-side, we can just construct:
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'https://sliitr2.kaveeshainduwara.lk'}/${r2_key}`;
}

export default function DashboardClient({ initialReceived, initialUploaded, session }: any) {
  const router = useRouter();
  const [tab, setTab] = useState<'received' | 'uploaded' | 'drops'>('received');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  
  // Share Modal State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState<any>(null);

  const openShare = (file: any) => {
    setSelectedFileForShare(file);
    setIsShareOpen(true);
  };

  const [isPublicLinkOpen, setIsPublicLinkOpen] = useState(false);
  const [selectedFileForPublic, setSelectedFileForPublic] = useState<any>(null);

  const openPublicLink = (file: any) => {
    setSelectedFileForPublic(file);
    setIsPublicLinkOpen(true);
  };

  const [folders, setFolders] = useState<any[]>([]);
  const [dropLinks, setDropLinks] = useState<any[]>([]);
  const [newDropName, setNewDropName] = useState('');
  const [newDropFolder, setNewDropFolder] = useState('');
  const [isCreatingDrop, setIsCreatingDrop] = useState(false);
  const [copiedDrop, setCopiedDrop] = useState<string | null>(null);

  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Confirm Modal State
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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMethod, setSortMethod] = useState('date-desc');
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  const toggleStar = async (item: any, type: 'file' | 'share') => {
    try {
      const res = await fetch(`/api/${type}s/${item.id}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !item.isStarred })
      });
      if (res.ok) router.refresh();
    } catch (err) {}
  };

  const totalStorageBytes = initialUploaded.reduce((sum: number, f: any) => sum + f.size, 0);
  const storageLimitBytes = 100 * 1024 * 1024; // 100MB
  const storagePercent = Math.min((totalStorageBytes / storageLimitBytes) * 100, 100);

  useEffect(() => {
    fetch('/api/folders').then(r => r.json()).then(d => {
      if(d.folders) setFolders(d.folders);
    });
    fetch('/api/droplinks').then(r => r.json()).then(d => {
      if(d.dropLinks) setDropLinks(d.dropLinks);
    });
  }, []);

  const handleCreateDropLink = async () => {
    if (!newDropName) return;
    const res = await fetch('/api/droplinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDropName, folderId: newDropFolder || null })
    });
    if (res.ok) {
      const data = await res.json();
      setDropLinks([data.dropLink, ...dropLinks]);
      setNewDropName('');
      setIsCreatingDrop(false);
    }
  };

  const handleDeleteDropLink = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Drop Link',
      message: 'Are you sure you want to delete this Drop Link? External users will no longer be able to upload here.',
      confirmText: 'Delete Link',
      action: async () => {
        const res = await fetch(`/api/droplinks/${id}`, { method: 'DELETE' });
        if (res.ok) {
          setDropLinks(d => d.filter(dl => dl.id !== id));
        }
      }
    });
  };

  const toggleFileSelect = (id: string) => {
    if (selectedFiles.includes(id)) {
      setSelectedFiles(selectedFiles.filter(fid => fid !== id));
    } else {
      setSelectedFiles([...selectedFiles, id]);
    }
  };

  const handleBulkDelete = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Files',
      message: `Are you sure you want to delete ${selectedFiles.length} files? This action cannot be undone.`,
      confirmText: 'Delete Files',
      action: async () => {
        setIsDeleting(true);
        try {
          const res = await fetch('/api/files/bulk', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIds: selectedFiles })
          });
          if (!res.ok) throw new Error('Failed to delete files');
          setSelectedFiles([]);
          router.refresh();
        } catch(err) {
          alert('Error deleting files');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const sorter = (a: any, b: any) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    const sizeA = a.file ? a.file.size : a.size;
    const sizeB = b.file ? b.file.size : b.size;

    if (sortMethod === 'date-desc') return dateB - dateA;
    if (sortMethod === 'date-asc') return dateA - dateB;
    if (sortMethod === 'size-desc') return sizeB - sizeA;
    if (sortMethod === 'size-asc') return sizeA - sizeB;
    return 0;
  };

  const displayedReceived = initialReceived.filter((share: any) => {
    if (showStarredOnly && !share.isStarred) return false;
    return share.file.name.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort(sorter);

  const displayedUploaded = initialUploaded.filter((file: any) => {
    if (showStarredOnly && !file.isStarred) return false;
    if (selectedFolderFilter === 'all') return file.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFolderFilter === 'none') return !file.folderId && file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return file.folderId === selectedFolderFilter && file.name.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort(sorter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', flex: 1, minWidth: '300px', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', gap: '10px', background: 'var(--card-bg)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border)', width: 'max-content' }}>
            <button 
              onClick={() => setTab('received')}
              style={{ padding: '8px 16px', border: 'none', background: tab === 'received' ? 'var(--primary)' : 'transparent', color: tab === 'received' ? 'var(--background)' : 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
              Received Files
            </button>
            <button 
              onClick={() => setTab('uploaded')}
              style={{ padding: '8px 16px', border: 'none', background: tab === 'uploaded' ? 'var(--primary)' : 'transparent', color: tab === 'uploaded' ? 'var(--background)' : 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
              My Uploads
            </button>
            <button 
              onClick={() => setTab('drops')}
              style={{ padding: '8px 16px', border: 'none', background: tab === 'drops' ? 'var(--primary)' : 'transparent', color: tab === 'drops' ? 'var(--background)' : 'var(--text-muted)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
              File Drops
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="input-field" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '38px', margin: 0 }} />
            </div>
            <button 
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              style={{ background: showStarredOnly ? 'rgba(255, 193, 7, 0.1)' : 'transparent', color: showStarredOnly ? '#ffc107' : 'var(--text-muted)', border: '1px solid var(--border)', padding: '10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title={showStarredOnly ? "Show All" : "Show Starred Only"}
            >
              <Star size={18} fill={showStarredOnly ? "#ffc107" : "none"} />
            </button>
            <select className="input-field" value={sortMethod} onChange={e => setSortMethod(e.target.value)} style={{ width: 'auto', margin: 0 }}>
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="size-desc">Size (Large to Small)</option>
              <option value="size-asc">Size (Small to Large)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '15px' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '12px 18px', borderRadius: '12px', minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>
              <span>Storage Used</span>
              <span>{formatBytes(totalStorageBytes)} / 100 MB</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${storagePercent}%`, height: '100%', background: storagePercent > 90 ? 'var(--error)' : 'var(--primary)' }} />
            </div>
          </div>
          <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
            <UploadCloud size={18} style={{marginRight: 8}} /> Upload File
          </button>
        </div>
      </div>

      {tab === 'uploaded' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', padding: '15px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500 }}>Folder:</label>
              <select className="input-field" style={{ padding: '8px', minWidth: '150px' }} value={selectedFolderFilter} onChange={(e) => setSelectedFolderFilter(e.target.value)}>
                <option value="all">All Files</option>
                <option value="none">Uncategorized</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
          </div>
          
          {selectedFiles.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--primary)' }}>{selectedFiles.length} selected</span>
                <button onClick={handleBulkDelete} disabled={isDeleting} className="btn-primary" style={{ background: 'var(--error)', border: 'none', padding: '8px 15px' }}>
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
                <button onClick={() => setSelectedFiles([])} className="btn-primary" style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '8px 15px' }}>
                  Cancel
                </button>
              </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {tab === 'received' && (
          displayedReceived.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No files received yet. Share files with friends to get started!</p>
          ) : (
            displayedReceived.map((share: any) => (
              <div key={share.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <button 
                  onClick={() => toggleStar(share, 'share')}
                  style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}
                >
                  <Star size={20} color={share.isStarred ? "#ffc107" : "var(--text-muted)"} fill={share.isStarred ? "#ffc107" : "none"} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', paddingRight: '30px' }}>
                  <div style={{ background: 'var(--primary)', color: 'var(--background)', padding: '10px', borderRadius: '10px' }}>
                    <File size={24} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '16px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{share.file.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatBytes(share.file.size)}</p>
                  </div>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
                  <p><strong>From:</strong> {share.sender.name} ({share.sender.sliit_id})</p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px', color: 'var(--text-muted)' }}>
                    <Clock size={12} /> Received on {formatDate(share.createdAt)}
                  </p>
                  {share.expiresAt && new Date(share.expiresAt) > new Date() && (
                    <p style={{ color: 'var(--error)', marginTop: '5px' }}>Expires: {formatDate(share.expiresAt)}</p>
                  )}
                </div>
                
                {share.file?.mime_type?.startsWith('image/') && (
                    <div style={{ marginBottom: '15px', height: '120px', borderRadius: '8px', overflow: 'hidden', background: '#f4f4f5' }}>
                      <img src={getPublicUrl(share.file.r2_key)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                {share.file?.mime_type === 'application/pdf' && (
                    <div style={{ marginBottom: '15px', padding: '10px', textAlign: 'center', background: 'rgba(0, 112, 243, 0.1)', color: 'var(--primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                      Preview available inside browser
                    </div>
                )}

                <a href={`/api/files/${share.file.id}/download`} target="_blank" rel="noreferrer" className="btn-primary" style={{ marginTop: 'auto', width: '100%', textDecoration: 'none' }}>
                  <Download size={16} style={{marginRight: 6}} /> {share.file?.mime_type === 'application/pdf' || share.file?.mime_type?.startsWith('image/') ? 'View / Download' : 'Download File'}
                </a>
              </div>
            ))
          )
        )}

        {tab === 'uploaded' && (
          displayedUploaded.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1' }}>No files found here.</p>
          ) : (
            displayedUploaded.map((file: any) => (
              <div key={file.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', position: 'relative', border: selectedFiles.includes(file.id) ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 10 }}>
                  <button 
                    onClick={() => toggleStar(file, 'file')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Star size={20} color={file.isStarred ? "#ffc107" : "var(--text-muted)"} fill={file.isStarred ? "#ffc107" : "none"} />
                  </button>
                  <input 
                    type="checkbox" 
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleFileSelect(file.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px', paddingRight: '50px' }}>
                  <div style={{ background: 'var(--primary)', color: 'var(--background)', padding: '10px', borderRadius: '10px' }}>
                    <File size={24} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ fontSize: '16px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatBytes(file.size)} • {formatDate(file.createdAt)}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '15px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '5px' }}>
                    <p>Shared with: <strong>{file.shares.length} users</strong></p>
                    <p>Downloads: <strong>{file.downloads || 0}</strong></p>
                  </div>
                  {file.shares.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {file.shares.map((share: any) => (
                        <div key={share.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                          <span>{share.receiver.name}</span>
                          <button 
                            onClick={() => {
                              setConfirmConfig({
                                isOpen: true,
                                title: 'Revoke Access',
                                message: `Are you sure you want to revoke access for ${share.receiver.name}? They will no longer be able to download this file.`,
                                confirmText: 'Revoke Access',
                                action: async () => {
                                  await fetch(`/api/shares/${share.id}`, { method: 'DELETE' });
                                  router.refresh();
                                }
                              });
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button onClick={() => openShare(file)} className="btn-primary" style={{ flex: 1, background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '10px 5px' }}>
                    <UserPlus size={16} /> Share
                  </button>
                  <button onClick={() => openPublicLink(file)} className="btn-primary" style={{ flex: 1, background: file.publicToken ? 'rgba(0, 112, 243, 0.1)' : 'var(--background)', color: file.publicToken ? 'var(--primary)' : 'var(--foreground)', border: '1px solid var(--border)', padding: '10px 5px' }}>
                    <LinkIcon size={16} /> Link
                  </button>
                  <a href={`/api/files/${file.id}/download`} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '10px 15px', textDecoration: 'none' }}>
                    <Download size={16} />
                  </a>
               </div>
              </div>
            ))
          )
        )}

        {tab === 'drops' && (
          <>
            <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', border: '2px dashed var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                <div style={{ background: 'var(--primary)', color: 'var(--background)', padding: '10px', borderRadius: '10px' }}><Inbox size={24} /></div>
                <div><h3 style={{ fontSize: '16px' }}>Request Files</h3><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Create a link for others to send you files securely.</p></div>
              </div>
              {isCreatingDrop ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <input type="text" className="input-field" placeholder="Drop Link Name (e.g. Project Assets)" value={newDropName} onChange={e => setNewDropName(e.target.value)} />
                  <select className="input-field" value={newDropFolder} onChange={e => setNewDropFolder(e.target.value)}>
                    <option value="">Save to: Uncategorized</option>
                    {folders.map(f => <option key={f.id} value={f.id}>Save to: {f.name}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" style={{ flex: 1, background: 'var(--success)', border: 'none' }} onClick={handleCreateDropLink}>Create Link</button>
                    <button className="btn-primary" style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={() => setIsCreatingDrop(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn-primary" style={{ marginTop: 'auto' }} onClick={() => setIsCreatingDrop(true)}>+ Create Drop Link</button>
              )}
            </div>

            {dropLinks.map((drop: any) => (
              <div key={drop.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '16px' }}>{drop.name}</h3>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '10px', background: drop.active ? 'rgba(0, 200, 83, 0.1)' : 'rgba(255, 77, 79, 0.1)', color: drop.active ? 'var(--success)' : 'var(--error)' }}>
                    {drop.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>{drop.folder ? `Saves to folder: ${drop.folder.name}` : 'Saves to Uncategorized'}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>Created {formatDate(drop.createdAt)}</p>
                
                <div style={{ background: 'rgba(0,0,0,0.03)', padding: '10px', borderRadius: '8px', marginBottom: '15px', flex: 1 }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px', wordBreak: 'break-all' }}>
                    {`${window.location.origin}/drop/${drop.token}`}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }} 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/drop/${drop.token}`);
                      setCopiedDrop(drop.id);
                      setTimeout(() => setCopiedDrop(null), 2000);
                    }}
                  >
                    <LinkIcon size={16} style={{marginRight: 6}} /> {copiedDrop === drop.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button className="btn-primary" style={{ background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', padding: '10px' }} onClick={() => handleDeleteDropLink(drop.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {isUploadOpen && <UploadModal onClose={() => { setIsUploadOpen(false); router.refresh(); }} />}
      {isShareOpen && selectedFileForShare && <ShareModal file={selectedFileForShare} onClose={() => setIsShareOpen(false)} />}
      {isPublicLinkOpen && selectedFileForPublic && <PublicLinkModal file={selectedFileForPublic} onClose={() => setIsPublicLinkOpen(false)} onUpdate={() => router.refresh()} />}
      
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
