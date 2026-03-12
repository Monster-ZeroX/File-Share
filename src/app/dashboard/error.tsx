'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: '20px', background: 'var(--background)' }}>
      <h2 style={{ color: 'var(--error)' }}>Dashboard crashed (Client Error)</h2>
      <div style={{ background: 'rgba(255,0,0,0.1)', padding: '15px', borderRadius: '8px', margin: '20px 0', overflowX: 'auto' }}>
        <p style={{ fontWeight: 'bold' }}>{error.message}</p>
        <pre style={{ fontSize: '12px', marginTop: '10px' }}>{error.stack}</pre>
      </div>
      <button className="btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
