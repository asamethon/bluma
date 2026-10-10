import { useEffect } from 'react';
import { subscribeToOtaUpdates } from '../services/otaUpdates';

/** Açılış tamamlanınca dış sistem aboneliği; splash hiçbir ağ isteğini beklemez. */
export function useOtaUpdates(appReady: boolean) {
  useEffect(() => {
    if (appReady) return subscribeToOtaUpdates();
  }, [appReady]);
}
