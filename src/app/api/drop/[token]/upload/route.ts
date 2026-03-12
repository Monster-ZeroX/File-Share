import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUploadUrl } from '@/lib/s3';

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const dropLink = await prisma.dropLink.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!dropLink || !dropLink.active) {
      return NextResponse.json({ error: 'Invalid or inactive drop link' }, { status: 403 });
    }

    const { filename, contentType, size } = await req.json();

    if (!filename || !contentType || !size) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    // 50MB Limit
    if (size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    // Check storage quota of the drop link OWNER
    const userFiles = await prisma.file.findMany({
      where: { uploaderId: dropLink.userId },
      select: { size: true }
    });
    const currentStorage = userFiles.reduce((sum: number, f: any) => sum + f.size, 0);
    const storageLimit = 100 * 1024 * 1024; // 100 MB

    if (currentStorage + size > storageLimit) {
      return NextResponse.json({ 
        error: `User's storage quota is full. Upload failed.` 
      }, { status: 403 });
    }

    const key = `drops/${dropLink.userId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const signedUrl = await getUploadUrl(key, contentType);

    return NextResponse.json({ signedUrl, key });

  } catch (error) {
    console.error('Drop Upload Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
