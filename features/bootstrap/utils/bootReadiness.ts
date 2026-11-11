type BootStatus = {
  fontsLoaded: boolean;
  authLoading: boolean;
  storiesLoaded: boolean;
  continueReadingReady: boolean;
  /** Cihaz banı sorusu cevaplandı mı (banlı olup olmaması değil). */
  banChecked: boolean;
  timedOut: boolean;
};

/**
 * Ağ işlemleri takılsa bile açılış perdesi süre sınırını aşmaz.
 *
 * Ban kontrolü de perdenin ARKASINDA beklenir: banlı kullanıcı uygulamayı bir
 * an görüp ardından ban ekranına düşmez. Kontrol takılırsa süre sınırı yine
 * devreye girer — ban cevabı sonradan gelse de ekran değişir.
 */
export function canRevealApp(status: BootStatus): boolean {
  if (!status.fontsLoaded) return false;
  if (status.timedOut) return true;
  return status.banChecked
    && !status.authLoading
    && status.storiesLoaded
    && status.continueReadingReady;
}
