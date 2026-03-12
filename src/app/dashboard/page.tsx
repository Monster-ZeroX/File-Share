import { verifySession } from '@/lib/session';
import prisma from '@/lib/prisma';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  const session = await verifySession();
  
  if (!session) {
    return null;
  }

  // Fetch Received files
  const receivedShares = await prisma.share.findMany({
    where: { 
      receiverId: session.userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      file: true,
      sender: { select: { name: true, email: true, sliit_id: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Fetch Uploaded files
  const uploadedFiles = await prisma.file.findMany({
    where: { uploaderId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      shares: {
        include: {
          receiver: { select: { name: true, email: true, sliit_id: true } }
        }
      }
    }
  });

  return (
    <div style={{ marginTop: '20px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Welcome back, {session.name}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
        Here are your shared files and personal uploads.
      </p>

      {/* We pass the data to a Client Component for interactivity (tabs, modals) */}
      <DashboardClient 
        initialReceived={receivedShares} 
        initialUploaded={uploadedFiles} 
        session={session} 
      />
    </div>
  );
}
