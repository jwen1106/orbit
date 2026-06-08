/**
 * Smoke test: verifies Firebase client env vars and Admin + Firestore connectivity.
 * Loads `.env.local` then `.env`. Does not print secrets.
 */
import dotenv from "dotenv";
import admin from "firebase-admin";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const envLocal = join(root, ".env.local");
const envFile = join(root, ".env");
if (existsSync(envLocal)) dotenv.config({ path: envLocal });
dotenv.config({ path: envFile });

const CLIENT_KEYS = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

function normalizePrivateKey(raw) {
  if (!raw) return "";
  let k = raw.trim();
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1);
  }
  return k.replace(/\\n/g, "\n");
}

let failed = false;

console.log("--- Firebase client env (NEXT_PUBLIC_*) ---");
for (const key of CLIENT_KEYS) {
  const v = process.env[key]?.trim();
  if (!v) {
    console.error(`MISSING: ${key}`);
    failed = true;
  } else {
    console.log(`OK: ${key}`);
  }
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

console.log("\n--- Firebase Admin + Firestore ---");
if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "SKIP/FAIL: Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY for Firestore test."
  );
  failed = true;
} else {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    const db = admin.firestore();
    const snap = await db.collection("_orbit_health_check").limit(1).get();
    console.log("PASS: Firestore reachable (query returned", snap.size, "doc(s) in sample query).");
    console.log("Project:", projectId);
  } catch (err) {
    const code = err.code ?? err?.status;
    console.error("FAIL (Firestore):", err.message || err);
    if (code === 5 || /NOT_FOUND/i.test(String(err.message))) {
      console.error(
        "Hint: Create a Firestore database: Firebase Console > Build > Firestore Database > Create database (production or test mode per your policy)."
      );
    }
    try {
      await admin.auth().listUsers(1);
      console.log(
        "NOTE: Firebase Admin credentials work (Auth API ok). If Firestore failed above, the project may need Firestore enabled."
      );
    } catch {
      console.error(
        "Also: Auth API check failed - verify the service account key and IAM roles on the project."
      );
    }
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
