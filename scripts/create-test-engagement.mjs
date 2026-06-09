/**
 * Creates a new active engagement for the same team as the existing one,
 * and prints the member survey URL for testing.
 */
import { config } from 'dotenv';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

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

// Get the existing engagement to find team + org IDs
const existingSnap = await db.collection('engagements').limit(1).get();
if (existingSnap.empty) { console.error('No existing engagements found.'); process.exit(1); }
const existing = existingSnap.docs[0].data();
const { teamId, organisationId } = existing;

// Generate tokens
const memberShareToken = crypto.randomBytes(24).toString('hex');
const managerSurveyToken = crypto.randomBytes(24).toString('hex');

// Create and immediately activate the engagement
const ref = await db.collection('engagements').add({
  teamId,
  organisationId,
  status: 'active',
  memberShareToken,
  managerSurveyToken,
  questionSetVersion: 'v1',
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  activatedAt: admin.firestore.FieldValue.serverTimestamp(),
  closedAt: null,
  analysedAt: null,
  createdBy: 'test-script',
});

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const surveyUrl = `${BASE_URL}/?token=${memberShareToken}`;
const managerSurveyUrl = `${BASE_URL}/survey/manager?token=${managerSurveyToken}`;

console.log('\n✅ Test engagement created and activated!\n');
console.log(`Engagement ID : ${ref.id}`);
console.log(`Team ID       : ${teamId}`);
console.log(`Org ID        : ${organisationId}`);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('MEMBER SURVEY URL (share this with John Smith):');
console.log(`  ${surveyUrl}`);
console.log('');
console.log('MANAGER SURVEY URL (for manager to fill in their view):');
console.log(`  ${managerSurveyUrl}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Instructions for John Smith:');
console.log('1. Go to the member survey URL above');
console.log('2. Enter name: John Smith');
console.log('3. Enter email: john.smith@oaklin.com');
console.log('4. Check the consent box and click Begin Survey');
console.log('');

process.exit(0);
