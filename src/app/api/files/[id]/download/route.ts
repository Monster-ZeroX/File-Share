import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params; // Next 15 needs this awaited if params is considered a promise in some configs, though generally Next 14 doesn't. Safe to await params or not depending on next ver. Usually `params.id`.

    const file = await prisma.file.findUnique({
      where: { id: id },
      include: { shares: true },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has access (is uploader or is a receiver)
    const isUploader = file.uploaderId === session.userId;
    const isReceiver = file.shares.some((s: any) => s.receiverId === session.userId);

    if (!isUploader && !isReceiver) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Increment download count if it's someone else downloading
    if (!isUploader) {
        await prisma.file.update({
            where: { id: id },
            data: { downloads: { increment: 1 } }
        });
    } else {
        // If we want uploader downloads to count too, we can increment here. But usually users just want to see how many times *others* downloaded it. Let's just track all downloads for simplicity, or just receivers. Let's track receivers only for accurate sharing metrics.
    }

    const r2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'https://sliitr2.kaveeshainduwara.lk';
    const downloadUrl = `${r2Domain}/${file.r2_key}`;

    return NextResponse.redirect(downloadUrl);

  } catch (error) {
    console.error('Download Tracking Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
