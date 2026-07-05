import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from '@react-native-firebase/firestore';
import { store } from './index';
import { patchChallenge, setChallengeState } from './slices/challengeSlice';

export type { ChallengeState } from './slices/challengeSlice';

// ─────────────────────────────────────────────────────────────────
// Sabit tanımlar — değişmez, kodda yaşar
// ─────────────────────────────────────────────────────────────────

export const RANKS = [
  { name: 'Yeni Kalem',  min: 0,    icon: 'pencil-outline' },
  { name: 'Okur',        min: 500,  icon: 'book-outline' },
  { name: 'Yorumcu',     min: 1200, icon: 'chatbubbles-outline' },
  { name: 'Anlatıcı',   min: 2500, icon: 'create-outline' },
  { name: 'Hikâyeci',   min: 3500, icon: 'library-outline' },
  { name: 'Romancı',    min: 5200, icon: 'bookmarks-outline' },
  { name: 'Usta Kalem', min: 8000, icon: 'trophy-outline' },
];

export type Pillar = 'write' | 'read' | 'comment';
export type Tracker =
  | 'storiesPublished'
  | 'chaptersRead'
  | 'commentsPosted'
  | 'newFollows'
  | 'streakDays'
  | 'manual';

export interface ChallengeDef {
  id: string;
  pillar: Pillar;
  icon: string;
  title: string;
  desc: string;
  goal: number;
  xp: number;
  tracker: Tracker;
  badge?: string;
}

export const CHALLENGE_DEFS: ChallengeDef[] = [
  { id: 'w1', pillar: 'write',   icon: 'create-outline',             title: 'Bu hafta 3 yeni hikaye yayınla',       desc: 'Okurların devamını bekliyor.',               goal: 3,   xp: 150, tracker: 'storiesPublished' },
  { id: 'w2', pillar: 'write',   icon: 'flame-outline',              title: '5 günlük yazma serisi',                desc: 'Her gün en az bir hikaye yayınla.',          goal: 5,   xp: 200, tracker: 'streakDays' },
  { id: 'w3', pillar: 'write',   icon: 'checkmark-done-outline',     title: 'Yarım kalan bir hikayeyi tamamla',     desc: '"Tamamlandı" olarak işaretle.',              goal: 1,   xp: 300, tracker: 'manual', badge: 'Tamamlayıcı' },
  { id: 'w4', pillar: 'write',   icon: 'bulb-outline',               title: 'İlk hikayeni yayınla',                 desc: 'Yazar yolculuğuna merhaba de.',              goal: 1,   xp: 100, tracker: 'storiesPublished' },
  { id: 'r1', pillar: 'read',    icon: 'book-outline',               title: 'Bu hafta 5 bölüm oku',                 desc: 'Akışındaki yeni hikayelerden.',              goal: 5,   xp: 80,  tracker: 'chaptersRead' },
  { id: 'r2', pillar: 'read',    icon: 'checkmark-circle-outline',   title: 'Bir hikayeyi sonuna kadar oku',        desc: 'Son bölüme kadar git.',                      goal: 3,   xp: 150, tracker: 'chaptersRead' },
  { id: 'r3', pillar: 'read',    icon: 'time-outline',               title: '10 hikaye oku',                        desc: 'Bu hafta en az 10 farklı bölümü bitir.',     goal: 10,  xp: 120, tracker: 'chaptersRead' },
  { id: 'r4', pillar: 'read',    icon: 'compass-outline',            title: 'Yeni bir yazar keşfet',                desc: 'Hiç okumadığın birinin hikayesini aç.',      goal: 1,   xp: 100, tracker: 'manual' },
  { id: 'c1', pillar: 'comment', icon: 'chatbubble-ellipses-outline',title: '5 hikayeye yorum bırak',               desc: 'Yazarları geri bildiriminle besle.',         goal: 5,   xp: 90,  tracker: 'commentsPosted' },
  { id: 'c2', pillar: 'comment', icon: 'person-add-outline',         title: '3 yeni yazar takip et',               desc: 'Okuma çevreni genişlet.',                    goal: 3,   xp: 60,  tracker: 'newFollows' },
  { id: 'c3', pillar: 'comment', icon: 'heart-outline',              title: '10 beğeni yap',                        desc: 'Sevdiğin hikayeleri öne çıkar.',             goal: 10,  xp: 40,  tracker: 'manual' },
  { id: 'c4', pillar: 'comment', icon: 'ribbon-outline',             title: 'Bir yazara ilham ver',                 desc: 'Yorumun "öne çıkan" seçilsin.',              goal: 1,   xp: 180, tracker: 'manual', badge: 'İlham Veren' },
];

export const PILLAR_COLORS: Record<Pillar, string> = {
  write: '#FF5C8A',
  read: '#7C5CD0',
  comment: '#2FA98A',
};

export const WEEKLY_FEATURED = {
  title: 'Hafta Sonu Okuma Maratonu',
  desc: 'Cuma–Pazar arası 3 bölüm bitir, 2 yorum bırak.',
  xp: 250,
  endsIn: '2 gün',
  cur: 0,
  goal: 5,
};

// ─────────────────────────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────────────────────────

export function getRankIndex(xp: number): number {
  let idx = 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) { idx = i; break; }
  }
  return idx;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getWeekStartStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff).toISOString().split('T')[0];
}

// ─────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────

export const challengeActions = {
  async loadProgress(userId: string) {
    try {
      const userRef = doc(getFirestore(), 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists) return;

      const data = userDoc.data() as any;
      const today = getTodayStr();
      const weekStart = getWeekStartStr();
      const isNewWeek = (data.challengeWeekStart || '') < weekStart;

      // Streak hesapla
      let newStreak = data.streak || 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (!data.lastActiveDate || data.lastActiveDate < yesterdayStr) {
        newStreak = 1; // Gün atlandı, sıfırla
      } else if (data.lastActiveDate === yesterdayStr) {
        newStreak = (data.streak || 0) + 1; // Dün aktifti, artır
      } else {
        newStreak = data.streak || 1; // Bugün zaten kayıtlı
      }

      let challengeProgress: Record<string, number> = data.challengeProgress || {};

      // Yeni hafta: haftalık görevleri sıfırla
      if (isNewWeek) {
        const weeklyTrackers: Tracker[] = ['storiesPublished', 'chaptersRead', 'commentsPosted', 'newFollows'];
        CHALLENGE_DEFS.forEach(c => {
          if (weeklyTrackers.includes(c.tracker)) {
            challengeProgress[c.id] = 0;
          }
        });
      }

      // Streak görevini güncelle
      CHALLENGE_DEFS.filter(c => c.tracker === 'streakDays').forEach(c => {
        challengeProgress[c.id] = Math.min(newStreak, c.goal);
      });

      store.dispatch(setChallengeState({
        xp: data.xp || 0,
        streak: newStreak,
        challengeProgress,
        claimedChallenges: data.claimedChallenges || [],
        isLoaded: true,
      }));

      // Streak ve lastActiveDate'i geri yaz
      if (data.lastActiveDate !== today || isNewWeek) {
        await updateDoc(userRef, {
          streak: newStreak,
          lastActiveDate: today,
          challengeWeekStart: weekStart,
          challengeProgress,
        });
      }
    } catch (error) {
      console.error('challengeStore loadProgress hatası:', error);
    }
  },

  async claimChallenge(userId: string, challengeId: string) {
    const def = CHALLENGE_DEFS.find(c => c.id === challengeId);
    if (!def) return;
    const { xp, claimedChallenges } = store.getState().challenge;
    if (claimedChallenges.includes(challengeId)) return;

    try {
      const newXp = xp + def.xp;
      const newClaimed = [...claimedChallenges, challengeId];

      store.dispatch(patchChallenge({ xp: newXp, claimedChallenges: newClaimed }));

      await updateDoc(doc(getFirestore(), 'users', userId), {
        xp: newXp,
        claimedChallenges: arrayUnion(challengeId),
      });
    } catch (error) {
      console.error('challengeStore claimChallenge hatası:', error);
    }
  },

  async trackAction(userId: string, tracker: Tracker, amount = 1) {
    try {
      const progress = { ...store.getState().challenge.challengeProgress };

      CHALLENGE_DEFS.forEach(c => {
        if (c.tracker === tracker) {
          progress[c.id] = Math.min((progress[c.id] || 0) + amount, c.goal);
        }
      });

      store.dispatch(patchChallenge({ challengeProgress: progress }));

      await updateDoc(doc(getFirestore(), 'users', userId), {
        challengeProgress: progress,
      });
    } catch (error) {
      console.error('challengeStore trackAction hatası:', error);
    }
  },
};
