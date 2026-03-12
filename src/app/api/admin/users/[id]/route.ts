import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';
import { logAdminAction } from '@/lib/audit';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session || session.email !== 'kaveeshainduwara.lk@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized Super Admin' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Since our database has CASCADE deletes set up, deleting the user will remove their files, shares, folders, and otps!
    await prisma.user.delete({ where: { id } });
    
    await logAdminAction(session.userId, 'DELETE_USER', `Deleted user ${user.email} (${user.id})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySession();
    if (!session || session.email !== 'kaveeshainduwara.lk@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized Super Admin' }, { status: 403 });
    }

    const { id } = await params;
    const { storageLimit, isSuspended, role } = await req.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        storageLimit: storageLimit !== undefined ? Number(storageLimit) : undefined,
        isSuspended: isSuspended !== undefined ? Boolean(isSuspended) : undefined,
        role: role !== undefined ? String(role) : undefined,
      }
    });

    await logAdminAction(session.userId, 'UPDATE_USER', `Updated user ${user.email} (${user.id}) Limits: ${storageLimit}, Suspended: ${isSuspended}, Role: ${role}`);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Admin Update User Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
