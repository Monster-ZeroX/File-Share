import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session || session.email !== 'kaveeshainduwara.lk@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized Super Admin' }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Show last 100 actions for performance
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Fetch Audit Logs Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
