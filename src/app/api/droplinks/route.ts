import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dropLinks = await prisma.dropLink.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: { folder: true }
    });

    return NextResponse.json({ dropLinks });
  } catch (error) {
    console.error('DropLink GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, folderId } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const token = crypto.randomBytes(16).toString('hex');

    const dropLink = await prisma.dropLink.create({
      data: {
        name,
        token,
        userId: session.userId,
        folderId: folderId || null
      },
      include: { folder: true }
    });

    return NextResponse.json({ success: true, dropLink });
  } catch (error) {
    console.error('DropLink POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
