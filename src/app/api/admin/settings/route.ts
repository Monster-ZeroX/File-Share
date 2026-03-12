import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session || session.email !== 'kaveeshainduwara.lk@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized Super Admin' }, { status: 403 });
    }

    // Upsert singleton settings if it doesn't exist
    let settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'singleton' }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await verifySession();
    if (!session || session.email !== 'kaveeshainduwara.lk@gmail.com') {
      return NextResponse.json({ error: 'Unauthorized Super Admin' }, { status: 403 });
    }

    const data = await req.json();
    const { registrationEnabled, maintenanceMode, siteAnnouncement, customBrandName, customBrandColor } = data;

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: {
        registrationEnabled: registrationEnabled !== undefined ? Boolean(registrationEnabled) : undefined,
        maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : undefined,
        siteAnnouncement: siteAnnouncement !== undefined ? (siteAnnouncement === '' ? null : String(siteAnnouncement)) : undefined,
        customBrandName: customBrandName !== undefined ? String(customBrandName) : undefined,
        customBrandColor: customBrandColor !== undefined ? String(customBrandColor) : undefined,
      },
      create: {
        id: 'singleton',
        registrationEnabled: registrationEnabled !== undefined ? Boolean(registrationEnabled) : true,
        maintenanceMode: maintenanceMode !== undefined ? Boolean(maintenanceMode) : false,
        siteAnnouncement: siteAnnouncement !== undefined ? (siteAnnouncement === '' ? null : String(siteAnnouncement)) : null,
        customBrandName: customBrandName !== undefined ? String(customBrandName) : 'SLIIT File Share',
        customBrandColor: customBrandColor !== undefined ? String(customBrandColor) : '#0070f3',
      }
    });

    await logAdminAction(session.userId, 'UPDATE_SETTINGS', `Updated System Settings`);

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
