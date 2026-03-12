import prisma from './prisma';

export async function logAdminAction(adminId: string, action: string, details: string) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        details,
      }
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
