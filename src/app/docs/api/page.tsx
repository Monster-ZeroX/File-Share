export default function ApiDocsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <main className="layout-container" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px', color: 'var(--primary)' }}>SLIIT File Share API Documentation</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '16px', lineHeight: '1.6' }}>
          Welcome to the developer platform! You can use your API keys to programmatically interact with your files and shares. 
          All endpoints are authenticated via the <code>Authorization: Bearer &lt;YOUR_API_KEY&gt;</code> header.
        </p>

        <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>Authentication</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
            To authenticate your requests, you must include your generated API key in the headers. You can generate an API key from your <a href="/dashboard/profile" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Profile Settings</a>.
          </p>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--border)', fontSize: '13px' }}>
{`curl -X GET https://<your-domain>/api/files \\
  -H "Authorization: Bearer sliit_YOUR_API_KEY_HERE"`}
          </pre>
        </div>

        <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'var(--success)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>GET</span> 
            /api/files
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Retrieves a list of all files uploaded by your account.</p>
          
          <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Response Success (200 OK)</h4>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--border)', fontSize: '13px' }}>
{`{
  "files": [
    {
      "id": "cm71abc...",
      "name": "document.pdf",
      "size": 1048576,
      "mime_type": "application/pdf",
      "downloads": 5,
      "isStarred": true,
      "createdAt": "2024-03-25T12:00:00Z"
    }
  ]
}`}
          </pre>
        </div>

        <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'var(--error)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>DELETE</span> 
            /api/files/bulk
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>Permanently deletes one or more files from your account and Cloudflare R2 storage.</p>
          
          <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Request Body (JSON)</h4>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--border)', fontSize: '13px', marginBottom: '15px' }}>
{`{
  "fileIds": ["cm71abc...", "cm71def..."]
}`}
          </pre>

          <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>Response Success (200 OK)</h4>
          <pre style={{ background: 'rgba(0,0,0,0.05)', padding: '15px', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--border)', fontSize: '13px' }}>
{`{
  "success": true
}`}
          </pre>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <a href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block' }}>Return to Dashboard</a>
        </div>
      </main>
    </div>
  );
}
