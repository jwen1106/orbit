import { randomBytes } from 'crypto';

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function generateEngagementTokens() {
  return {
    memberShareToken: generateToken(24),
    managerSurveyToken: generateToken(24),
  };
}
