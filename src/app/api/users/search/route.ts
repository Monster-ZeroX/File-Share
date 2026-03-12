import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: { not: session.userId }, // don't search yourself
          },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { sliit_id: { startsWith: query, mode: 'insensitive' } },
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        sliit_id: true,
        email: true,
      },
      take: 20, // max results
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User Search Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
