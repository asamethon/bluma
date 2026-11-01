import { useEffect, useMemo, useState } from 'react';
import { pickAvailableUsernames } from '../services/usernameSuggestions';
import { suggestUsernames } from '../utils/usernameSuggest';

/** Her tuş vuruşunda sorgu atmamak için; ad yazılırken 3 sorgu bütçesi hızla tükenir. */
const DEBOUNCE_MS = 450;

/**
 * Görünen addan müsait kullanıcı adı önerileri.
 *
 * Adaylar render'da hesaplanır (saf), yalnızca müsaitlik sorgusu dış sisteme
 * gider — o yüzden tek, izole bir effect. Bağımlılıklar primitive: aday listesi
 * virgüllü bir anahtara indirgenir, böylece dizi kimliği değişince effect
 * boşuna tetiklenmez.
 */
export function useUsernameSuggestions(displayName: string, current: string, enabled = true) {
  const candidates = useMemo(() => suggestUsernames(displayName, current), [displayName, current]);
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
