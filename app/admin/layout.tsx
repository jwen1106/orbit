import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import AdminNav from '@/components/layout/AdminNav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  if (!session || session.role !== 'oaklin_admin') redirect('/login');

  return (
    <div className="min-h-screen bg-orbit-offwhite flex flex-col">
      <AdminNav userEmail={session.email} />
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
