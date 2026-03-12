'use client';

import { useState, useCallback } from 'react';
import { UploadCloud, File as FileIcon, CheckCircle } from 'lucide-react';

export default function DropClient({ dropLink }: { dropLink: any }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMode, setSuccessMode] = useState(false);

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
      // 1. Get presigned URL using the special drop route
      const gRes = await fetch(`/api/drop/${dropLink.token}/upload`, {
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

      // 3. Register file in DB against the dropLink owner
      const dbRes = await fetch(`/api/drop/${dropLink.token}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           name: file.name, 
           size: file.size, 
           mime_type: file.type || 'application/octet-stream', 
           r2_key: gData.key
        })
      });
      
      const dbData = await dbRes.json();
      if (!dbRes.ok) throw new Error(dbData.error || 'Failed to save file record');

      setProgress(100);
      setTimeout(() => {
        setSuccessMode(true);
      }, 500);

    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
      setProgress(0);
    }
  };

  if (successMode) {
    return (
      <div className="layout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', animation: 'slideUp 0.3s ease' }}>
          <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto 20px auto' }} />
          <h2>Upload Successful!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px', marginBottom: '30px' }}>Your file has been securely delivered to {dropLink.user.name}.</p>
          <button className="btn-primary" onClick={() => { setFile(null); setSuccessMode(false); setProgress(0); setIsUploading(false); }}>
            Upload another file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', animation: 'slideUp 0.3s ease' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {dropLink.user.avatarUrl && (
            <img 
              src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'https://sliitr2.kaveeshainduwara.lk'}/${dropLink.user.avatarUrl}`} 
              alt="avatar" 
              style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '2px solid var(--border)' }} 
            />
          )}
          <h2>File Drop for {dropLink.user.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '5px' }}>{dropLink.name}</p>
        </div>
        
        {error && <div style={{ color: 'var(--error)', background: 'rgba(255, 77, 79, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        {!file ? (
          <div 
            onDragOver={(e) => e.preventDefault()} 
            onDrop={handleDrop}
            style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', background: 'rgba(0,0,0,0.02)' }}
            onClick={() => document.getElementById('drop-upload')?.click()}
          >
            <UploadCloud size={48} style={{ color: 'var(--primary)', marginBottom: '15px' }} />
            <h3 style={{ marginBottom: '5px' }}>Select or drag & drop a file</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Max file size: 50MB</p>
            <input type="file" id="drop-upload" style={{ display: 'none' }} onChange={handleFileChange} />
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

            {isUploading ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                  <span>Uploading securely...</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn-primary" style={{ flex: 1, background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }} onClick={() => setFile(null)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleUpload}>Send File</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
