import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/** Clears the server session cookie and Firebase client auth (required when switching users). */
export async function clearPlatformSession() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  await signOut(auth).catch(() => {});
}
