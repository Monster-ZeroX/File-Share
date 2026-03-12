import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const dropLink = await prisma.dropLink.findUnique({ where: { id: id } });

    if (!dropLink || dropLink.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    await prisma.dropLink.delete({ where: { id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { id } = await params;
    const dropLink = await prisma.dropLink.findUnique({ where: { id: id } });

    if (!dropLink || dropLink.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    const { active } = await req.json();

    const updated = await prisma.dropLink.update({
      where: { id: id },
      data: { active: !!active }
    });

    return NextResponse.json({ success: true, dropLink: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
