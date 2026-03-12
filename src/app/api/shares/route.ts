import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';
import { sendShareNotification } from '@/lib/resend';
import { getPublicUrl } from '@/lib/s3';

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId, receiverIds, expiresInDays } = await req.json();

    if (!fileId || !Array.isArray(receiverIds) || receiverIds.length === 0) {
      return NextResponse.json({ error: 'Missing file ID or receivers' }, { status: 400 });
    }

    // Verify file ownership
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.uploaderId !== session.userId) {
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 });
    }

    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }

    const shareResults = [];

    // Create shares and send notifications
    for (const receiverId of receiverIds) {
      // Validate receiver exists
      const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
      if (!receiver) continue;

      // Upsert share record (in case already shared)
      const share = await prisma.share.upsert({
        where: {
          fileId_receiverId: {
            fileId: file.id,
            receiverId: receiver.id,
          }
        },
        update: { expiresAt },
        create: {
          fileId: file.id,
          receiverId: receiver.id,
          senderId: session.userId,
          expiresAt,
        }
      });

      shareResults.push(share);

      // Send email notification dynamically via Resend
      const fileLink = getPublicUrl(file.r2_key);
      await sendShareNotification(
        receiver.email,
        session.name, // Sender Name
        file.name,    // File Name
        fileLink      // Download Link directly pointing to exposed R2 custom domain
      ).catch(err => console.error("Error sending notification:", err));
    }

    return NextResponse.json({ success: true, shares: shareResults });

  } catch (error) {
    console.error('Share Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
