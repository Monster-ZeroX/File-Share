import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import prisma from '@/lib/prisma';
import { verifySession } from '@/lib/session';
import { ShieldAlert, Info } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SLIIT File Share",
  description: "Secure file sharing platform for university friends",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings;
  let isSuspended = false;
  let isAdmin = false;

  try {
    settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    const session = await verifySession();
    if (session) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (user) {
        isSuspended = user.isSuspended;
        isAdmin = user.role === 'ADMIN' || user.email === 'kaveeshainduwara.lk@gmail.com';
      }
    }
  } catch (e) {
    console.error('Layout Prisma Error:', e);
  }

  const brandColor = settings?.customBrandColor || '#0070f3';
  const announcement = settings?.siteAnnouncement;
  const maintMode = settings?.maintenanceMode;

  if (isSuspended) {
    return (
      <html lang="en">
        <body className={inter.className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
            <ShieldAlert size={48} style={{ color: 'var(--error)', margin: '0 auto 20px' }} />
            <h1 style={{ marginBottom: '15px' }}>Account Suspended</h1>
            <p style={{ color: 'var(--text-muted)' }}>Your account has been suspended by an administrator. You can no longer access the platform or your files.</p>
          </div>
        </body>
      </html>
    );
  }

  if (maintMode && !isAdmin) {
    return (
      <html lang="en">
        <body className={inter.className} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background)' }}>
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '500px' }}>
            <Info size={48} style={{ color: 'var(--primary)', margin: '0 auto 20px' }} />
            <h1 style={{ marginBottom: '15px' }}>Under Maintenance</h1>
            <p style={{ color: 'var(--text-muted)' }}>We are currently performing scheduled maintenance. Please check back later.</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --primary: ${brandColor};
          }
        `}} />
        
        {announcement && (
          <div style={{ background: 'var(--primary)', color: 'white', textAlign: 'center', padding: '12px 20px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', zIndex: 1000, position: 'relative' }}>
            <Info size={16} /> {announcement}
          </div>
        )}
        
        {children}
      </body>
    </html>
  );
}
