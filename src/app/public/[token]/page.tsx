import prisma from '@/lib/prisma';
import PublicViewClient from './PublicViewClient';

export default async function PublicLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  
  const file = await prisma.file.findUnique({
    where: { publicToken: token },
    include: { uploader: { select: { name: true, avatarUrl: true } } }
  });

  if (!file) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h1>404 - File Not Found</h1>
        <p style={{ color: 'var(--text-muted)' }}>This public link is invalid or has been revoked.</p>
      </div>
    );
  }

  return <PublicViewClient file={{
      id: file.id,
      name: file.name,
      size: file.size,
      mime_type: file.mime_type,
      uploaderName: file.uploader.name,
      uploaderAvatar: file.uploader.avatarUrl,
      hasPassword: !!file.publicPassword,
      token: file.publicToken
  }} />;
}
