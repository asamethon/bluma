import { store } from '@/store';
import { patchUser } from '@/store/slices/authSlice';
import { logger } from '@/utils/logger';
import { doc, getFirestore, increment, updateDoc } from '@react-native-firebase/firestore';
import type { ConnectionList, ProfileConnections } from './connections';

/**
 * Kural (`firestore.rules` → `isCounterBump`) tek yazımda ±1'e izin veriyor,
 * bu yüzden fark kadar ayrı yazma yapılır. Üst sınır kaçak bir döngüye karşı.
 */
const MAX_STEPS = 10;

/**
 * Sayacın kaç adım DÜŞMESİ gerektiği.
 *
 * Yalnız fazla sayan sayaç düzeltilir; artırma asla buradan yapılmaz (sayacı
 * yukarı oynatmak takip akışının işi). Listede okunamayan kişi varsa elimizde
 * tam tablo yok demektir, o zaman sayaca hiç dokunulmaz — geçici bir ağ hatası
 * gerçek takipçileri silip atmasın.
 */
export function excessSteps(stored: number, list: ConnectionList): number {
  if (list.unreadable.length) return 0;
  if (!Number.isFinite(stored)) return 0;
  return Math.min(Math.max(0, Math.floor(stored - list.users.length)), MAX_STEPS);
}

async function stepDown(userId: string, field: string, steps: number) {
  const reference = doc(getFirestore(), 'users', userId);
  for (let index = 0; index < steps; index += 1) {
    await updateDoc(reference, { [field]: increment(-1) });
  }
}

/**
 * Kendi profilinde takipçi/takip sayacını listedeki gerçek kişi sayısına
 * indirir — "profilde 6, listede 5" tutarsızlığının görünen yüzünü kapatır.
 *
 * Hayalet TAKİP DOKÜMANLARI burada SİLİNMEZ: bir uid'in gerçekten silinmiş mi
 * yoksa kaydı yarım kalmış gerçek bir kullanıcı mı olduğunu ancak Auth'a da
 * sorabilen `reconcile-counters` işi bilebilir (bkz. o dosyadaki `isLive`).
 * İstemci yalnız sayıyı düzeltir; belge budama sunucunun işi kalır.
 */
export async function healOwnFollowCounters(userId: string, connections: ProfileConnections) {
  const user = store.getState().auth.user;
  if (!user || user.id !== userId) return;

  const plan = [
    { field: 'followersCount', steps: excessSteps(user.followersCount || 0, connections.followers) },
    { field: 'followingCount', steps: excessSteps(user.followingCount || 0, connections.following) },
  ].filter(item => item.steps > 0);
  if (!plan.length) return;

  try {
    for (const item of plan) await stepDown(userId, item.field, item.steps);
    store.dispatch(patchUser(Object.fromEntries(plan.map(item => [
      item.field,
      ((user[item.field as 'followersCount' | 'followingCount'] || 0) - item.steps),
    ]))));
  } catch (error) {
    logger.warn('Takip sayacı düzeltilemedi:', error);
  }
}
