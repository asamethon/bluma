import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';
import { AppState, Platform } from 'react-native';
import { createUpdateChecker } from './updateChecker';

const checker = createUpdateChecker({
  enabled: () => !__DEV__ && Platform.OS !== 'web' && Updates.isEnabled,
  online: async () => {
    const network = await NetInfo.fetch();
    return AppState.currentState === 'active'
      && network.isConnected !== false && network.isInternetReachable !== false;
  },
  check: Updates.checkForUpdateAsync,
  fetch: Updates.fetchUpdateAsync,
  now: Date.now,
  report: (outcome, error) => {
    // Bağlantı hataları hata izlemeyi doldurmaz; native fallback ayrıca raporlanır.
    Sentry.addBreadcrumb({
      category: 'ota',
      level: outcome === 'error' ? 'warning' : 'info',
      message: `OTA: ${outcome}`,
      data: error ? { reason: error instanceof Error ? error.message : String(error) } : undefined,
    });
  },
});

const lifecycle = { stop: null as (() => void) | null };

/** Yaşam döngüsü aboneliği tekildir; önceki abonelik varsa kapatılır. */
export function subscribeToOtaUpdates() {
  lifecycle.stop?.();
  if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return () => {};
  const check = () => { void checker.check(); };
  const appState = AppState.addEventListener('change', state => {
    if (state === 'active') check();
  });
  const stopNetwork = NetInfo.addEventListener(network => {
    if (network.isConnected && network.isInternetReachable !== false) check();
  });
  check();
  const stop = () => {
    appState.remove();
    stopNetwork();
    if (lifecycle.stop === stop) lifecycle.stop = null;
  };
  lifecycle.stop = stop;
  return stop;
}
