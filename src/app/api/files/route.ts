import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

// Save the file record after successful R2 upload
export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, size, mime_type, r2_key, folderId } = await req.json();

    if (!name || !size || !mime_type || !r2_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    const file = await prisma.file.create({
      data: {
        name,
        size,
        mime_type,
        r2_key,
        uploaderId: session.userId,
        folderId: folderId || null,
      },
    });

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error('File Record Creation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Fetch user's uploaded files (optional, for dashboard)
export async function GET(req: Request) {
  try {
    const session = await verifySession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const files = await prisma.file.findMany({
      where: { uploaderId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        folder: { select: { id: true, name: true } },
        shares: {
          include: {
            receiver: { select: { name: true, email: true, sliit_id: true } }
          }
        }
      }
    });

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
