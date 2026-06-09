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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function deleteQueryDocs(query) {
  const snap = await query.get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  if (snap.size >= 500) await deleteQueryDocs(query);
}

async function deleteSubcollection(parentRef, name) {
  let snap = await parentRef.collection(name).limit(500).get();
  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    snap = await parentRef.collection(name).limit(500).get();
  }
}

async function deleteEngagement(id) {
  const ref = db.collection('engagements').doc(id);
  const respondents = await ref.collection('respondents').get();
  for (const r of respondents.docs) {
    await deleteSubcollection(r.ref, 'responses');
    await r.ref.delete();
  }
  await db.collection('insights').doc(id).delete().catch(() => undefined);
  await deleteQueryDocs(db.collection('actionItems').where('engagementId', '==', id));
  await ref.delete();
}

async function deleteOrg(orgId, name) {
  console.log(`Removing: ${name} (${orgId})`);
  const teams = await db.collection('teams').where('organisationId', '==', orgId).get();
  for (const t of teams.docs) {
    const engs = await db.collection('engagements').where('teamId', '==', t.id).get();
    for (const e of engs.docs) await deleteEngagement(e.id);
    await deleteQueryDocs(db.collection('actionItems').where('teamId', '==', t.id));
    const managerId = t.data().managerId;
    await t.ref.delete();
    if (managerId) {
      await db.collection('users').doc(managerId).delete().catch(() => undefined);
      await auth.deleteUser(managerId).catch(() => undefined);
    }
  }
  await deleteQueryDocs(db.collection('actionItems').where('organisationId', '==', orgId));
  const orgEngs = await db.collection('engagements').where('organisationId', '==', orgId).get();
  for (const e of orgEngs.docs) await deleteEngagement(e.id);
  const users = await db.collection('users').where('organisationId', '==', orgId).get();
  for (const u of users.docs) {
    await u.ref.delete();
    await auth.deleteUser(u.id).catch(() => undefined);
  }
  await db.collection('organisations').doc(orgId).delete();
}

const orgSnap = await db.collection('organisations').get();
let removed = 0;

for (const doc of orgSnap.docs) {
  const name = doc.data().name ?? '';
  const teams = await db.collection('teams').where('organisationId', '==', doc.id).limit(1).get();
  const isJoanna = name.toLowerCase().includes('joanna');
  const isEmpty = teams.empty;

  if (isJoanna || isEmpty) {
    await deleteOrg(doc.id, name);
    removed++;
  }
}

console.log(`Done. Removed ${removed} organisation(s).`);
