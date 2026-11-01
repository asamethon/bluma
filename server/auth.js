// Firebase ID token doğrulama — service account gerekmez, token Google'ın
// açık JWKS anahtarlarıyla doğrulanır.
import { createRemoteJWKSet, jwtVerify } from 'jose';

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'bluma-dc10e';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

/** Döner: Firebase uid ya da null. */
export async function verifyFirebaseToken(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
      audience: FIREBASE_PROJECT_ID,
    });
    return payload.sub || null;
  } catch {
    return null;
  }
}
