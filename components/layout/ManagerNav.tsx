'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import OrbitLogo from './OrbitLogo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', exact: true },
  { href: '/dashboard/analysis', label: 'Competencies' },
  { href: '/dashboard/delta', label: 'Delta Analysis' },
  { href: '/dashboard/benchmarks', label: 'Benchmarks' },
  { href: '/dashboard/action-plan', label: 'Action Plan' },
  { href: '/dashboard/timeline', label: 'Timeline' },
  { href: '/dashboard/export', label: 'Export Report' },
];

interface ManagerNavProps {
  userName: string;
  userEmail: string;
}

export default function ManagerNav({ userName, userEmail }: ManagerNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="bg-orbit-forest text-white shadow-md">
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center gap-6 h-14">
        <Link href="/dashboard" className="flex-shrink-0">
          <OrbitLogo size="sm" onDark />
        </Link>
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'px-3 py-1.5 rounded text-sm font-medium transition-colors',
                isActive(item.href, item.exact)
                  ? 'bg-orbit-green text-white'
                  : 'text-green-100 hover:bg-orbit-green/50',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-white leading-tight">{userName}</p>
            <p className="text-2xs text-green-200">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="h-8 w-8 rounded-full bg-orbit-green flex items-center justify-center text-xs font-bold text-white hover:bg-green-600 transition-colors"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
}
