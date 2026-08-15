import * as Sentry from '@sentry/react-native';
import { logger } from '@/utils/logger';

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    logger.debug('Sentry DSN tanımlı değil — hata izleme devre dışı (bkz. config/sentry.ts).');
    return;
  }
  Sentry.init({
    dsn,
    debug: __DEV__,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enabled: !__DEV__,
  });
}
