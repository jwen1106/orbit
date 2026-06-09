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
  const data = d.data();
  const respondents = await db.collection('engagements').doc(d.id).collection('respondents').get();
  const completed = respondents.docs.filter(r => r.data().status === 'completed').length;
  const insights = await db.collection('engagements').doc(d.id).collection('insights').get();
  console.log(`\nID: ${d.id}`);
  console.log(`  status:     ${data.status}`);
  console.log(`  title:      ${data.title || '(no title)'}`);
  console.log(`  teamId:     ${data.teamId}`);
  console.log(`  respondents:${respondents.size} total, ${completed} completed`);
  console.log(`  insights:   ${insights.size} docs`);
}
process.exit(0);
