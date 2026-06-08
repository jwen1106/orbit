import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import LandingPage from '@/components/landing/LandingPage';

export default async function Home() {
  const session = await verifySession();
  if (session?.role === 'oaklin_admin') redirect('/admin');
  if (session?.role === 'team_manager') redirect('/dashboard');
  return <LandingPage />;
}
