import i18n from '@/i18n';

const AUTH_ERROR_KEYS: Record<string, string> = {
  'auth/user-not-found': 'authErrors.userNotFound',
  'auth/wrong-password': 'authErrors.wrongPassword',
  'auth/invalid-email': 'authErrors.invalidEmail',
  'auth/user-disabled': 'authErrors.userDisabled',
  'auth/too-many-requests': 'authErrors.tooManyRequests',
  'auth/network-request-failed': 'authErrors.network',
  'auth/internal-error': 'authErrors.server',
  'firestore/permission-denied': 'authErrors.database',
  'auth/email-already-in-use': 'authErrors.emailInUse',
  'auth/weak-password': 'authErrors.weakPassword',
  'auth/operation-not-allowed': 'authErrors.emailSignupDisabled',
  'auth/account-exists-with-different-credential': 'authErrors.accountExistsDifferentCredential',
  'auth/invalid-credential': 'authErrors.invalidCredential',
};

export type AuthResult = { success: boolean; error?: string };

export function authError(code: string | undefined, fallbackKey: string): AuthResult {
  return { success: false, error: i18n.t(AUTH_ERROR_KEYS[code ?? ''] ?? fallbackKey) };
}
