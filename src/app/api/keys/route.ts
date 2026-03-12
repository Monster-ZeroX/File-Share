import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const keys = await prisma.apiKey.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Fetch API Keys Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Key name is required' }, { status: 400 });

    // Generate a simple secure random key
    const rawKey = require('crypto').randomBytes(32).toString('hex');
    const keyString = `sliit_${rawKey}`;

    const newKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key: keyString,
        userId: session.userId
      }
    });

    return NextResponse.json({ apiKey: newKey });
  } catch (error) {
    console.error('Create API Key Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
