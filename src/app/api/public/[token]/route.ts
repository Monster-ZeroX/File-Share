import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { password } = await req.json();

    const file = await prisma.file.findUnique({ where: { publicToken: token } });
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.publicPassword) {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 401 });
      }
      const match = await bcrypt.compare(password, file.publicPassword);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
      }
    }

    // Auth succeeded! Increment downloads
    await prisma.file.update({
      where: { id: file.id },
      data: { downloads: { increment: 1 } }
    });

    const r2Domain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || 'https://sliitr2.kaveeshainduwara.lk';
    const downloadUrl = `${r2Domain}/${file.r2_key}`;

    return NextResponse.json({ success: true, downloadUrl });

  } catch (error) {
    console.error('Public Download Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
