import { useAppSelector } from '@/store/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { readNudgeDismissed, writeNudgeDismissed } from '../services/usernameNudgeStorage';
import { trackNudgeDismissed } from '../services/usernameNudgeEvents';
import { assessUsername } from '../utils/usernameAssess';
import { useUsernameSuggestions } from './useUsernameSuggestions';

/**
 * Kendi profilindeki tek seferlik kullanıcı adı kartının durumu.
 *
 * Kart yalnızca gerekçe VARSA, kullanıcı daha önce kapatmadıysa VE elde en az
 * bir öneri varsa görünür. Öneri yoksa kart hiç açılmaz: "adın sorunlu" deyip
 * çıkış yolu göstermemek rahatsız etmekten başka işe yaramaz.
 * "Ad değişince kart kaybolsun" için ek bir şey yapmaya gerek yok: değerlendirme
 * store'daki güncel addan türetiliyor, ad düzelince `flagged` kendiliğinden
 * false oluyor.
 *
 * `dismissed` üç durumlu: `null` = yerel karar henüz okunmadı. Kart o sırada
 * gösterilmez, böylece açılışta bir an görünüp kaybolmaz.
 */
export function useUsernameNudge() {
  const userId = useAppSelector(state => state.auth.user?.id);
  const username = useAppSelector(state => state.auth.user?.username);
  const displayName = useAppSelector(state => state.auth.user?.displayName);
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  const assessment = useMemo(
    () => assessUsername(username ?? '', displayName ?? ''),
    [displayName, username],
  );
  // `eligible` sorguyu tetikler, `visible` kartı açar — öneriler gelmeden kart
  // açılmaz, ama kart kapalı olduğu için de sorgu durmaz (döngü olmasın).
  const eligible = assessment.flagged && dismissed === false;
  const suggestions = useUsernameSuggestions(displayName ?? '', username ?? '', eligible);
  const visible = eligible && suggestions.length > 0;

  useEffect(() => {
    if (!userId) return;
    const lifecycle = { cancelled: false };
    void readNudgeDismissed(userId).then(value => {
      if (!lifecycle.cancelled) setDismissed(value);
    });
    return () => { lifecycle.cancelled = true; };
  }, [userId]);

  const dismiss = useCallback(() => {
    // Optimistic: kart anında kapanır, yazma arka planda.
    setDismissed(true);
    if (userId) void writeNudgeDismissed(userId);
    if (assessment.reason) trackNudgeDismissed(assessment.reason);
  }, [assessment.reason, userId]);

  return { visible, reason: assessment.reason, suggestions, dismiss };
}
