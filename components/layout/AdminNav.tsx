'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import OrbitLogo from './OrbitLogo';
import { clearPlatformSession } from '@/lib/auth-client';

const navItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/organisations', label: 'Organisations' },
  { href: '/admin/engagements', label: 'Engagements' },
  { href: '/admin/questions', label: 'Questions' },
  { href: '/admin/benchmarks', label: 'Benchmarks' },
];

export default function AdminNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await clearPlatformSession();
    router.push('/');
    router.refresh();
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header className="bg-orbit-forest text-white shadow-md">
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center gap-6 h-14">
        <Link href="/admin" className="flex-shrink-0">
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
          <span className="text-xs text-green-200 hidden md:block">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-green-200 hover:text-white transition-colors px-2 py-1 rounded hover:bg-orbit-green/40"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
