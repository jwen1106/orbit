import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import ManagerNav from '@/components/layout/ManagerNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session || session.role !== 'team_manager') redirect('/login');

  const userDoc = await adminDb.collection('users').doc(session.uid).get();
  const displayName = userDoc.data()?.displayName ?? session.email;

  return (
    <div className="min-h-screen bg-orbit-offwhite flex flex-col">
      <ManagerNav userName={displayName} userEmail={session.email} />
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
