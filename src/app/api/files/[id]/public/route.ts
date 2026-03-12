import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { action, password } = await req.json();

    const file = await prisma.file.findUnique({ where: { id: id } });
    if (!file || file.uploaderId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized or not found' }, { status: 403 });
    }

    if (action === 'create') {
      const publicToken = crypto.randomBytes(16).toString('hex');
      let publicPassword = null;

      if (password) {
        publicPassword = await bcrypt.hash(password, 10);
      }

      const updatedFile = await prisma.file.update({
        where: { id: id },
        data: { publicToken, publicPassword }
      });

      return NextResponse.json({ success: true, publicToken: updatedFile.publicToken });
    } else if (action === 'remove') {
      await prisma.file.update({
        where: { id: id },
        data: { publicToken: null, publicPassword: null }
      });
      return NextResponse.json({ success: true });
    } else if (action === 'update_password') {
      let publicPassword = null;
      if (password) {
        publicPassword = await bcrypt.hash(password, 10);
      }
      await prisma.file.update({
        where: { id: id },
        data: { publicPassword }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Public Link Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
