import * as Sentry from '@sentry/react-native';
import { logger } from '@/utils/logger';
import { configureUpdateTelemetry } from '@/features/updates/services/updateTelemetry';
import * as Updates from 'expo-updates';

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
    environment: __DEV__ ? 'development' : Updates.channel ?? 'production',
    sendDefaultPii: false,
  });
  configureUpdateTelemetry();
}
