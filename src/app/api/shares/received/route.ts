import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const receivedShares = await prisma.share.findMany({
      where: { 
        receiverId: session.userId,
        // Optional: filter out expired shares
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        file: true,
        sender: {
          select: { name: true, email: true, sliit_id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ shares: receivedShares });

  } catch (error) {
    console.error('Fetch Shares Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
