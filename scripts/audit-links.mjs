const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

const publicRoutes = ['/', '/survey/complete', '/survey/invalid'];
const protectedRoutes = [
  '/admin', '/admin/organisations', '/admin/organisations/new', '/admin/engagements',
  '/admin/engagements/new', '/admin/questions', '/admin/questions/new', '/admin/benchmarks',
  '/admin/portfolio', '/dashboard', '/dashboard/benchmarks', '/dashboard/action-plan',
  '/dashboard/analysis', '/dashboard/delta', '/dashboard/timeline', '/dashboard/export',
  '/dashboard/assessment',
];

const failures = [];

async function check(path, type) {
  const res = await fetch(`${BASE}${path}`, { redirect: 'manual' });
  const loc = (res.headers.get('location') || '').replace(BASE, '');
  if (type === 'public' && res.status >= 200 && res.status < 400) return true;
  if (type === 'auth' && res.status >= 300 && res.status < 400 && (loc.startsWith('/?from=') || loc === '/')) return true;
  if (type === 'login' && res.status >= 300 && res.status < 400 && (loc === '/' || loc.startsWith('/?'))) return true;
  if (type === 'survey-invalid' && res.status >= 300 && res.status < 400 && loc.startsWith('/survey/invalid')) return true;
  failures.push({ path, status: res.status, loc, type });
  return false;
}

console.log(`Link audit — ${BASE}\n`);
for (const p of publicRoutes) console.log(`${await check(p, 'public') ? 'OK' : 'FAIL'}  ${p}`);
console.log(`${await check('/login', 'login') ? 'OK' : 'FAIL'}  /login -> /`);
console.log(`${await check('/survey/member?token=bad', 'survey-invalid') ? 'OK' : 'FAIL'}  invalid survey token`);
for (const p of protectedRoutes) console.log(`${await check(p, 'auth') ? 'OK' : 'FAIL'}  ${p} (auth redirect)`);

console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll checks passed');
process.exit(failures.length ? 1 : 0);
