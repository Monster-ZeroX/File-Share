import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';

export async function DELETE(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileIds } = await req.json();

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Ensure user owns all files before deleting
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        uploaderId: session.userId,
      }
    });

    if (files.length !== fileIds.length) {
       return NextResponse.json({ error: 'Unauthorized to delete some files' }, { status: 403 });
    }

    // Delete records. R2 cleanup would ideally happen via a queue or worker, but we just delete DB records for now to free up platform access.
    await prisma.file.deleteMany({
      where: {
        id: { in: fileIds },
        uploaderId: session.userId,
      }
    });

    return NextResponse.json({ success: true, deletedCount: files.length });
  } catch (error) {
    console.error('Bulk Delete Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
