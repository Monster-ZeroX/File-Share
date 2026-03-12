import prisma from '@/lib/prisma';
import DropClient from './DropClient';
import { notFound } from 'next/navigation';

export default async function DropPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const dropLink = await prisma.dropLink.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  if (!dropLink || !dropLink.active) {
    return (
      <div className="layout-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h2>Invalid Link</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>This File Drop link is no longer active or does not exist.</p>
        </div>
      </div>
    );
  }

  return <DropClient dropLink={dropLink} />;
}
