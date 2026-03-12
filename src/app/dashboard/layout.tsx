import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Navbar user={session} />
      <main className="layout-container">
        {children}
      </main>
    </div>
  );
}
