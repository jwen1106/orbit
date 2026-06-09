import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? '';
if (privateKey.startsWith('"')) privateKey = JSON.parse(privateKey);
privateKey = privateKey.replace(/\\n/g, '\n');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey,
  }),
});

const db = admin.firestore();
const snap = await db.collection('engagements').get();

console.log('\nAll engagements:\n');
for (const d of snap.docs) {
  const data = d.data();
  console.log(`ID: ${d.id}`);
  console.log(`  Status: ${data.status}`);
  console.log(`  memberShareToken: ${data.memberShareToken}`);
  console.log(`  managerSurveyToken: ${data.managerSurveyToken}`);
  console.log('');
}

process.exit(0);
