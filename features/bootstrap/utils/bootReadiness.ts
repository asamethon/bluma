type BootStatus = {
  fontsLoaded: boolean;
  authLoading: boolean;
  storiesLoaded: boolean;
  continueReadingReady: boolean;
  timedOut: boolean;
};

/** Ağ işlemleri takılsa bile açılış perdesi süre sınırını aşmaz. */
export function canRevealApp(status: BootStatus): boolean {
  return status.fontsLoaded && (
    status.timedOut || (!status.authLoading && status.storiesLoaded && status.continueReadingReady)
  );
}
