import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const file = await prisma.file.findUnique({ where: { id: id } });

    if (!file || file.uploaderId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    const { isStarred } = await req.json();

    const updated = await prisma.file.update({
      where: { id: id },
      data: { isStarred: !!isStarred }
    });

    return NextResponse.json({ success: true, file: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
