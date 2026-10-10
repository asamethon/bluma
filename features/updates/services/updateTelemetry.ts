import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

/** OTA kimliği hata kaydında bulunur; binary'nin varsayılan release/dist'i korunur. */
export function configureUpdateTelemetry() {
  if (__DEV__) return;
  Sentry.setTags({
    'ota.channel': Updates.channel ?? 'unknown',
    'ota.runtime': Updates.runtimeVersion ?? 'unknown',
    'ota.updateId': Updates.updateId ?? 'embedded',
    'ota.embedded': String(Updates.isEmbeddedLaunch),
    'ota.emergency': String(Updates.isEmergencyLaunch),
  });
  if (Updates.isEmergencyLaunch) {
    Sentry.captureMessage('OTA güvenli açılışa geri döndü', {
      level: 'warning',
      extra: { reason: Updates.emergencyLaunchReason },
    });
  }
}
