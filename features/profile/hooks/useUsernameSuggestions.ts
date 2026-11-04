import { useEffect, useMemo, useState } from 'react';
import { pickAvailableUsernames } from '../services/usernameSuggestions';
import { suggestUsernames } from '../utils/usernameSuggest';

/** Her tuş vuruşunda sorgu atmamak için; her denemenin bedeli 6'ya varan okuma. */
const DEBOUNCE_MS = 450;

/**
 * Görünen addan müsait kullanıcı adı önerileri; ad yoksa `fallback` adayları.
 *
 * Adaylar render'da hesaplanır (saf), yalnızca müsaitlik sorgusu dış sisteme
 * gider — o yüzden tek, izole bir effect. Bağımlılıklar primitive: aday listesi
 * virgüllü bir anahtara indirgenir, böylece dizi kimliği değişince effect
 * boşuna tetiklenmez.
 */
export function useUsernameSuggestions(displayName: string, current: string, enabled = true, fallback: string[] = []) {
  // Görünen ad yoksa (Apple adı gizlediyse) çağıranın verdiği yedek adaylar denenir.
  const fallbackKey = fallback.join(',');
  const candidates = useMemo(() => {
    const named = suggestUsernames(displayName, current);
    return named.length ? named : fallbackKey.split(',').filter(item => item && item !== current);
  }, [displayName, current, fallbackKey]);
  const [available, setAvailable] = useState<string[]>([]);
  const key = candidates.join(',');

  useEffect(() => {
    if (!enabled || !key) {
      setAvailable([]);
      return;
    }
    const lifecycle = { cancelled: false };
    const timer = setTimeout(() => {
      void pickAvailableUsernames(key.split(','))
        .then(result => { if (!lifecycle.cancelled) setAvailable(result); })
        .catch(() => { if (!lifecycle.cancelled) setAvailable([]); });
    }, DEBOUNCE_MS);
    return () => { lifecycle.cancelled = true; clearTimeout(timer); };
  }, [enabled, key]);

  return available;
}
