import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const share = await prisma.share.findUnique({ where: { id: id } });

    if (!share || share.receiverId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    const { isStarred } = await req.json();

    const updated = await prisma.share.update({
      where: { id: id },
      data: { isStarred: !!isStarred }
    });

    return NextResponse.json({ success: true, share: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
