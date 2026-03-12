import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: shareId } = await params;

    // Verify it exists and caller owns the file
    const share = await prisma.share.findUnique({
      where: { id: shareId },
      include: { file: true }
    });

    if (!share || share.senderId !== session.userId) {
      return NextResponse.json({ error: 'Share not found or access denied' }, { status: 404 });
    }

    await prisma.share.delete({
      where: { id: shareId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
