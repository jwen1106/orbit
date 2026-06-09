/**
 * List all users and optionally reset a password.
 * Usage:
 *   node scripts/reset-password.mjs                          (list users)
 *   node scripts/reset-password.mjs email@example.com NewPass123!  (reset)
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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
const [, , email, newPassword] = process.argv;

if (!email) {
  // List all users
  const result = await auth.listUsers(20);
  console.log('\nAll Firebase Auth users:\n');
  result.users.forEach((u) => {
    console.log(`  Email:  ${u.email}`);
    console.log(`  UID:    ${u.uid}`);
    console.log(`  Claims: ${JSON.stringify(u.customClaims ?? {})}`);
    console.log('');
  });
  console.log(`To reset a password run:`);
  console.log(`  node scripts/reset-password.mjs <email> <newPassword>`);
} else {
  // Reset password
  const user = await auth.getUserByEmail(email);
  await auth.updateUser(user.uid, { password: newPassword });
  console.log(`\n✓ Password updated for ${email}`);
  console.log(`  New password: ${newPassword}`);
}
