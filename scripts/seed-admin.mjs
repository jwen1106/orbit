/**
 * Creates the first Oaklin Admin user in Firebase Auth and Firestore.
 * Usage: node scripts/seed-admin.mjs admin@oaklin.com "Admin Name" password123
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

const email = process.argv[2];
const displayName = process.argv[3] ?? 'Oaklin Admin';
const password = process.argv[4] ?? 'ChangeMe123!';

if (!email) {
  console.error('Usage: node scripts/seed-admin.mjs <email> [displayName] [password]');
  process.exit(1);
}

async function run() {
  console.log(`Creating Oaklin admin: ${email} (${displayName})`);

  let user;
  try {
    user = await auth.createUser({ email, password, displayName });
    console.log(`✓ Firebase Auth user created: ${user.uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      user = await auth.getUserByEmail(email);
      console.log(`⚠ User already exists: ${user.uid}`);
    } else {
      throw err;
    }
  }

  await auth.setCustomUserClaims(user.uid, { role: 'oaklin_admin' });
  console.log(`✓ Custom claim set: role = oaklin_admin`);

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName,
    role: 'oaklin_admin',
    organisationId: null,
    createdAt: FieldValue.serverTimestamp(),
    invitedBy: null,
  }, { merge: true });
  console.log(`✓ Firestore user document written`);

  console.log(`\n✓ Done. Log in with ${email} / ${password}`);
}

run().catch((err) => { console.error(err); process.exit(1); });
