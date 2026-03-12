import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifySession, createSession } from '@/lib/session';

export async function PUT(req: Request) {
  try {
    const session = await verifySession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatarUrl, currentPassword, newPassword } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};
    if (name) updateData.name = name;
    if (avatarUrl) updateData.avatarUrl = avatarUrl; // In a production app, verify this is actually their R2 key

    if (newPassword) {
       if (user.password) {
          // If they already have a password, they MUST provide the current one to change it
          if (!currentPassword) {
             return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
          }
          const isMatch = await bcrypt.compare(currentPassword, user.password);
          if (!isMatch) {
             return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
          }
       }
       // Hash the new one
       updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    if (name || avatarUrl) {
       await createSession(updatedUser.id, updatedUser.email, updatedUser.name, updatedUser.sliit_id, updatedUser.avatarUrl);
    }

    return NextResponse.json({ success: true, user: { name: updatedUser.name, email: updatedUser.email, avatarUrl: updatedUser.avatarUrl } });

  } catch (error) {
    console.error('Profile Update Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
