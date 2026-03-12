import { verifySession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export default async function Page() {
  const session = await verifySession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  if (!user) redirect('/login');

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    sliit_id: user.sliit_id,
    avatarUrl: user.avatarUrl,
    hasPassword: !!user.password
  };

  return <ProfileClient user={userData} />;
}
