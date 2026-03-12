import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    
    // Auth by public token
    const dropLink = await prisma.dropLink.findUnique({
      where: { token }
    });

    if (!dropLink || !dropLink.active) {
      return NextResponse.json({ error: 'Invalid or inactive drop link' }, { status: 403 });
    }

    const { name, size, mime_type, r2_key } = await req.json();

    if (!name || !size || !mime_type || !r2_key) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify storage quota again to be safe
    const userFiles = await prisma.file.findMany({
      where: { uploaderId: dropLink.userId },
      select: { size: true }
    });
    const currentStorage = userFiles.reduce((sum: number, f: any) => sum + f.size, 0);
    const storageLimit = 100 * 1024 * 1024; // 100 MB

    if (currentStorage + size > storageLimit) {
      return NextResponse.json({ error: `User's quota exceeded. File saved in cloud but rejected by DB.` }, { status: 403 });
    }

    // Save File as owned by dropLink owner
    const file = await prisma.file.create({
      data: {
        name: `[Drop] ${name}`, // Identify as a file drop
        size,
        mime_type,
        r2_key,
        uploaderId: dropLink.userId,
        folderId: dropLink.folderId, // Assign to the folder specified in dropLink
      },
    });

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error('Drop Record Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
