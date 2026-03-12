'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, UploadCloud, File as FileIcon, CheckCircle, FolderPlus } from 'lucide-react';

export default function UploadModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    fetch('/api/folders').then(res => res.json()).then(data => {
      if(data.folders) setFolders(data.folders);
    });
  }, []);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create folder');
      setFolders([...folders, data.folder]);
      setSelectedFolder(data.folder.id);
      setIsCreatingFolder(false);
      setNewFolderName('');
    } catch(err: any) {
       setError(err.message);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.size > 50 * 1024 * 1024) setError('File size exceeds 50MB limit');
      else { setFile(f); setError(''); }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > 50 * 1024 * 1024) setError('File size exceeds 50MB limit');
      else { setFile(f); setError(''); }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(10);
    setError('');

    try {
      // 1. Get presigned URL
      const gRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream', size: file.size })
      });
      const gData = await gRes.json();
      if (!gRes.ok) throw new Error(gData.error);
      
      setProgress(30);

      // 2. Upload directly to R2
      const xhr = new XMLHttpRequest();
      await new Promise((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
             const p = Math.round((e.loaded / e.total) * 60) + 30; // 30% to 90%
             setProgress(p);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve(null);
          else reject(new Error('Upload to storage failed.'));
        };
        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.open('PUT', gData.signedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      setProgress(95);

      // 3. Register file in DB
      const dbRes = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           name: file.name, 
           size: file.size, 
           mime_type: file.type || 'application/octet-stream', 
           r2_key: gData.key,
           folderId: selectedFolder || undefined
        })
      });
      
      if (!dbRes.ok) throw new Error('Failed to save file record');

      setProgress(100);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 500);

    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', position: 'relative', animation: 'slideUp 0.3s ease' }}>
        <button onClick={onClose} disabled={isUploading} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={24} />
        </button>
        
        <h2 style={{ marginBottom: '20px' }}>Upload File</h2>
        
        {error && <div style={{ color: 'var(--error)', background: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}

        {!file ? (
          <div 
            onDragOver={(e) => e.preventDefault()} 
            onDrop={handleDrop}
            style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(0,0,0,0.02)' }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <UploadCloud size={48} style={{ color: 'var(--primary)', marginBottom: '15px' }} />
            <h3 style={{ marginBottom: '5px' }}>Drag & drop your file here</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Max file size: 50MB</p>
            <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        ) : (
          <div style={{ background: 'var(--background)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--primary)', color: 'var(--background)', padding: '12px', borderRadius: '10px' }}><FileIcon size={24} /></div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Assign to Folder (Optional)</label>
              <select 
                className="input-field" 
                value={isCreatingFolder ? 'new' : selectedFolder} 
                onChange={(e) => {
                  if (e.target.value === 'new') setIsCreatingFolder(true);
                  else { setIsCreatingFolder(false); setSelectedFolder(e.target.value); }
                }}
                style={{ marginBottom: isCreatingFolder ? '10px' : '0' }}
              >
                <option value="">-- No Folder --</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                <option value="new">+ Create New Folder</option>
              </select>

              {isCreatingFolder && (
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <input type="text" className="input-field" placeholder="Folder Name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
                   <button onClick={handleCreateFolder} className="btn-primary" type="button" style={{ background: 'var(--foreground)', color: 'var(--background)', padding: '10px 15px' }}>Save</button>
                 </div>
              )}
            </div>

            {isUploading ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }} onClick={() => setFile(null)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleUpload}>Confirm Upload</button>
              </div>
            )}
            {progress === 100 && <p style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', fontSize: '14px', justifyContent: 'center' }}><CheckCircle size={16}/> Upload Complete!</p>}
          </div>
        )}
      </div>
    </div>
  );
}
