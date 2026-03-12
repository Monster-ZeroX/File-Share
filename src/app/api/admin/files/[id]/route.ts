import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session || session.email !== 'kaveeshainduwara.lk@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized Super Admin' }, { status: 403 });
    }

    const { id } = await params;

    const file = await prisma.file.findUnique({ where: { id } });
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    // Cascade deletes will handle removing Shares tied to this file automatically
    await prisma.file.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Delete File Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
