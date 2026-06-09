import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const env = Object.fromEntries(
  readFileSync(resolve(process.cwd(), '.env'), 'utf8')
    .split('\n').filter(l => l.includes('=')).map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);
initializeApp({ credential: cert({ projectId: env.FIREBASE_ADMIN_PROJECT_ID, clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') }) });
const db = getFirestore();

const snap = await db.collection('engagements').get();
for (const d of snap.docs) {
  console.log(`\nEngagement: ${d.data().title || d.id}`);
  const respondents = await db.collection('engagements').doc(d.id).collection('respondents').get();
  for (const r of respondents.docs) {
    const data = r.data();
    console.log(`  [${r.id}] name="${data.name}" role=${data.role} status=${data.status} access=${data.accessMethod}`);
  }

  // Also fetch team size
  const team = await db.collection('teams').doc(d.data().teamId).get();
  console.log(`  Team: ${team.data()?.name}, size=${team.data()?.size}`);
}
process.exit(0);
