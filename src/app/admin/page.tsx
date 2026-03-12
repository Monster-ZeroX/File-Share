import { verifySession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await verifySession();
  
  // NOTE: In a real app we would rely on an IS_ADMIN flag or similar
  if (!session || session.email !== 'kaveeshainduwara.lk@gmail.com') {
    redirect('/dashboard');
  }

  const [usersCount, filesCount, sharesCount, allUsers, allFiles] = await Promise.all([
    prisma.user.count(),
    prisma.file.count(),
    prisma.share.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { uploadedFiles: true } } }
    }),
    prisma.file.findMany({
      orderBy: { size: 'desc' },
      include: { uploader: { select: { name: true, sliit_id: true } } }
    })
  ]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar user={session} />
      <main className="layout-container" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>Admin Dashboard</h1>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '30px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Total Users</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{usersCount}</p>
          </div>
          <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '30px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Total Files Uploaded</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{filesCount}</p>
          </div>
          <div className="glass-card" style={{ flex: 1, minWidth: '200px', padding: '30px' }}>
            <h2 style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Active Shares</h2>
            <p style={{ fontSize: '36px', fontWeight: 'bold' }}>{sharesCount}</p>
          </div>
        </div>

        <AdminClient users={allUsers} files={allFiles} />
      </main>
    </div>
  );
}
