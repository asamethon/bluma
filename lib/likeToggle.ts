import { logger } from '@/utils/logger';
import {
  getFirestore,
  increment,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type DocumentReference,
} from '@react-native-firebase/firestore';
import { chainLikeWrite, queueLikeWrite, type LikeOutcome } from './likeQueue';

type Reference = DocumentReference<DocumentData, DocumentData>;

export type LikeTargets = {
  /** `likesCount` alanını taşıyan doküman (hikâye, bölüm, konuşma, yorum). */
  counter: Reference;
  /** İçeriğin altındaki beğeni kaydı: `likes/{userId}`. */
  like: Reference;
  /** Kullanıcı tarafındaki kopya (`likedStories/{id}` gibi); yoksa yazılmaz. */
  userLike?: Reference;
  /** Kullanıcı tarafı kopyanın gövdesi (`{ storyId }` gibi). */
  userLikeData?: Record<string, unknown>;
};

/** Kayıt zaten istenen durumdaysa hiçbir şey yazılmaz. */
export const likePlan = (recordExists: boolean, desired: boolean): 'create' | 'remove' | 'none' =>
  recordExists === desired ? 'none' : desired ? 'create' : 'remove';

/**
 * Beğeni kaydı, kullanıcı tarafındaki kopya ve sayaç TEK transaction'da
 * yazılır: kaydı oku, istenen durumla aynıysa hiçbir şey yazma; farklıysa
 * kaydı yaz/sil + `increment(±1)`. Kural tarafında `counterProof` artık
 * `existsAfter` kullanıyor — kayıt ve sayaç aynı commit'te gittiği için
 * `exists()` eski durumu görüyordu.
 *
 * `desired: 'toggle'` sunucudaki durumu ters çevirir (arayüzünde beğeni
 * durumu tutulmayan hikâye yorumu için).
 */
type Applied = 'create' | 'remove' | 'none';

async function writeLike(
  targets: LikeTargets,
  userId: string,
  desired: boolean | 'toggle',
): Promise<Applied> {
  let applied: Applied = 'none';
  await runTransaction(getFirestore(), async transaction => {
    const snapshot = await transaction.get(targets.like);
    const exists = snapshot.exists();
    const plan = likePlan(exists, desired === 'toggle' ? !exists : desired);
    applied = plan;
    if (plan === 'none') return;
    if (plan === 'create') {
      transaction.set(targets.like, { userId, createdAt: serverTimestamp() });
      if (targets.userLike) {
        transaction.set(targets.userLike, { ...(targets.userLikeData ?? {}), createdAt: serverTimestamp() });
      }
      transaction.update(targets.counter, { likesCount: increment(1) });
      return;
    }
    transaction.delete(targets.like);
    if (targets.userLike) transaction.delete(targets.userLike);
    transaction.update(targets.counter, { likesCount: increment(-1) });
  });
  return applied;
}

type Options = {
  /** Birleştirme anahtarı, ör. `conversation:<id>`. */
  key: string;
  userId: string;
  targets: LikeTargets;
  /** Yalnızca gerçek false→true geçişinde çalışır; beklenmez. */
  onLiked?: () => void;
};

/** Arayüzün bildiği durumu sunucuya taşır (son dokunuş kazanır). */
export function setLikeState(
  options: Options & { desired: boolean; previous: boolean },
): Promise<LikeOutcome> {
  return queueLikeWrite(options.key, options, async desired => {
    const applied = await writeLike(options.targets, options.userId, desired);
    if (applied === 'create') options.onLiked?.();
  });
}

/** Sunucudaki durumu ters çevirir; dokunuşlar yalnızca sıraya dizilir. */
export async function toggleLikeState(options: Options): Promise<boolean> {
  try {
    const applied = await chainLikeWrite(options.key, () => writeLike(options.targets, options.userId, 'toggle'));
    if (applied === 'create') options.onLiked?.();
    return true;
  } catch (error) {
    logger.error('Like toggle error:', error);
    return false;
  }
}
