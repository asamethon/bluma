import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { store } from '@/store';
import { patchChallenge, setChallengeState } from '@/store/slices/challengeSlice';
import { logger } from '@/utils/logger';
import { arrayUnion, doc, getDoc, getFirestore, increment, updateDoc } from '@react-native-firebase/firestore';
import { CHALLENGE_DEFS, type Tracker } from '../definitions';
import { todayKey, weekStartKey, yesterdayKey } from './challengeCalendar';

/** Her hafta başında sıfırlanan sayaçlar. */
const WEEKLY_TRACKERS: Tracker[] = ['storiesPublished', 'chaptersRead', 'commentsPosted', 'newFollows'];

type StoredProgress = {
  xp?: number;
  streak?: number;
  lastActiveDate?: string;
  challengeWeekStart?: string;
  challengeProgress?: Record<string, number>;
  claimedChallenges?: string[];
};

const userRef = (userId: string) => doc(getFirestore(), 'users', userId);

/** Dün aktifse seri uzar, ara verildiyse baştan başlar. */
function nextStreak(data: StoredProgress): number {
  const yesterday = yesterdayKey();
  if (!data.lastActiveDate || data.lastActiveDate < yesterday) return 1;
  if (data.lastActiveDate === yesterday) return (data.streak ?? 0) + 1;
  return data.streak || 1;
}

function refreshedProgress(stored: Record<string, number>, streak: number, isNewWeek: boolean) {
  const weeklyReset = isNewWeek
    ? CHALLENGE_DEFS.filter(def => WEEKLY_TRACKERS.includes(def.tracker)).map(def => [def.id, 0])
    : [];
  const streakProgress = CHALLENGE_DEFS.filter(def => def.tracker === 'streakDays').map(def => [
    def.id,
    Math.min(streak, def.goal),
  ]);
  return { ...stored, ...Object.fromEntries([...weeklyReset, ...streakProgress]) };
}

/**
 * Eşzamanlı `ensureLoaded` çağrıları tek okumayı paylaşır — aksi halde
 * uygulama açılışındaki ilk aksiyonlar aynı dokümanı birkaç kez okur.
 */
const loading = { promise: null as Promise<void> | null };

async function loadProgress(userId: string) {
  try {
    const snapshot = await getDoc(userRef(userId));
    const data = (snapshot.exists() ? snapshot.data() ?? {} : {}) as StoredProgress;
    const today = todayKey();
    const weekStart = weekStartKey();
    const isNewWeek = (data.challengeWeekStart || '') < weekStart;
    const streak = nextStreak(data);
    const challengeProgress = refreshedProgress(data.challengeProgress ?? {}, streak, isNewWeek);

    store.dispatch(setChallengeState({
      xp: data.xp ?? 0,
      streak,
      challengeProgress,
      claimedChallenges: data.claimedChallenges ?? [],
      isLoaded: true,
    }));

    if (snapshot.exists() && (data.lastActiveDate !== today || isNewWeek)) {
      await updateDoc(userRef(userId), {
        streak,
        lastActiveDate: today,
        challengeWeekStart: weekStart,
        challengeProgress,
      });
    }
  } catch (error) {
    logger.error('challengeStore loadProgress hatası:', error);
  }
}

/**
 * İlerleme store'a yüklenmeden hesap yapılamaz: boş haritadan başlayan
 * `trackAction` Firestore'daki ilerlemenin tamamını siliyordu. Okuma,
 * yorum ve takip profil ekranı hiç açılmadan da gerçekleşebilir.
 */
async function ensureLoaded(userId: string) {
  if (store.getState().challenge.isLoaded) return;
  if (!loading.promise) {
    loading.promise = loadProgress(userId).finally(() => { loading.promise = null; });
  }
  await loading.promise;
}

async function claimChallenge(userId: string, challengeId: string) {
  const def = CHALLENGE_DEFS.find(challenge => challenge.id === challengeId);
  if (!def) return;
  await ensureLoaded(userId);
  const { xp, claimedChallenges } = store.getState().challenge;
  if (claimedChallenges.includes(challengeId)) return;

  store.dispatch(patchChallenge({
    xp: xp + def.xp,
    claimedChallenges: [...claimedChallenges, challengeId],
  }));

  try {
    // XP atomik artırılır: store'daki değerden hesaplanan yazma, başka bir
    // cihazda kazanılan XP'yi geri alıyordu.
    await updateDoc(userRef(userId), {
      xp: increment(def.xp),
      claimedChallenges: arrayUnion(challengeId),
    });
  } catch (error) {
    logger.error('challengeStore claimChallenge hatası:', error);
  }
}

async function trackAction(userId: string, tracker: Tracker, amount = 1) {
  await ensureLoaded(userId);
  const current = store.getState().challenge.challengeProgress;
  const advanced = CHALLENGE_DEFS.filter(def => def.tracker === tracker).map(def => {
    const before = current[def.id] ?? 0;
    return { def, before, after: Math.min(before + amount, def.goal) };
  });
  const changed = advanced.filter(({ before, after }) => after !== before);
  if (changed.length === 0) return;

  store.dispatch(patchChallenge({
    challengeProgress: {
      ...current,
      ...Object.fromEntries(changed.map(({ def, after }) => [def.id, after])),
    },
  }));

  // Görevi bitirmek de bir "mutlu an": değerlendirme eşiğine sayılır.
  if (changed.some(({ def, before, after }) => before < def.goal && after >= def.goal)) {
    reviewPromptActions.recordMoment('challengeCompleted').catch(() => {});
  }

  try {
    // Yalnızca değişen görevlerin alanı yazılır; haritanın tamamını yazmak
    // başka bir akışta/cihazda ilerleyen görevleri siliyordu.
    await updateDoc(userRef(userId), Object.fromEntries(
      changed.map(({ def, after }) => [`challengeProgress.${def.id}`, after]),
    ));
  } catch (error) {
    logger.error('challengeStore trackAction hatası:', error);
  }
}

export const challengeActions = { loadProgress, claimChallenge, trackAction };
