/** Firebase Auth minimum; used when admins set team manager passwords. */
export const MIN_MANAGER_PASSWORD_LENGTH = 8;

export function validateManagerPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < MIN_MANAGER_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_MANAGER_PASSWORD_LENGTH} characters`;
  }
  return null;
}
