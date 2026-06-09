import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')];
    }),
);

const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey,
  }),
});

const db = getFirestore();

// List all orgs
const snap = await db.collection('organisations').get();
console.log('Organisations:');
snap.docs.forEach((d) => console.log(' ', d.id, '|', d.data().name, '|', d.data().industry));

// Update all orgs to Professional Services
for (const d of snap.docs) {
  await db.collection('organisations').doc(d.id).update({ industry: 'Professional Services' });
  console.log(`Updated ${d.data().name} -> Professional Services`);
}

console.log('Done.');
process.exit(0);
