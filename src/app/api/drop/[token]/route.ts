import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const dropLink = await prisma.dropLink.findUnique({
      where: { token },
      include: { user: { select: { name: true, avatarUrl: true, id: true } } }
    });

    if (!dropLink || !dropLink.active) {
      return NextResponse.json({ error: 'This drop link is invalid or inactive' }, { status: 404 });
    }

    return NextResponse.json({ dropLink });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
