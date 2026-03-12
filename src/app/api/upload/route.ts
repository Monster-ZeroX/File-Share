import { NextResponse } from 'next/server';
import { getUploadUrl } from '@/lib/s3';
import { verifySession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType, size } = await req.json();

    if (!filename || !contentType || !size) {
      return NextResponse.json({ error: 'Missing file details' }, { status: 400 });
    }

    if (size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    const userFiles = await prisma.file.findMany({
      where: { uploaderId: session.userId },
      select: { size: true }
    });
    const currentStorage = userFiles.reduce((sum: number, f: any) => sum + f.size, 0);
    const storageLimit = 100 * 1024 * 1024; // 100 MB

    if (currentStorage + size > storageLimit) {
      return NextResponse.json({ error: `Upload exceeds your ${storageLimit / 1024 / 1024}MB storage quota.` }, { status: 403 });
    }

    const key = `${session.sliit_id}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const signedUrl = await getUploadUrl(key, contentType);

    // Note: Do NOT create the database File record here.
    // The client will upload directly to R2, and upon success, it will 
    // call another API endpoint to register the file in the database.
    return NextResponse.json({ signedUrl, key });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
