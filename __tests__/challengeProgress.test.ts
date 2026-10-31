import { challengeActions } from '@/features/challenges/services/challengeProgress';
import { startChallengeSession } from '@/features/challenges/services/challengeSession';
import { todayKey, weekStartKey, yesterdayKey } from '@/features/challenges/services/challengeCalendar';
import { reviewPromptActions } from '@/features/review/services/reviewPrompt';
import { patchAuth, type User } from '@/store/slices/authSlice';
import { selectChallengeProgress, selectChallengeXp, selectClaimedChallenges } from '@/store/slices/challengeSlice';
import { appState, database, deferred, firestoreMock, identity, scenario, seed, testStore } from './support/challengeFirestore';

jest.mock('@react-native-firebase/firestore', () => jest.requireActual('./support/challengeFirestore').firestoreMock);
jest.mock('@react-native-firebase/auth', () => ({ getAuth: () => jest.requireActual('./support/challengeFirestore').identity }));
jest.mock('@/store', () => ({ store: jest.requireActual('./support/challengeFirestore').testStore }));
jest.mock('react-native', () => ({ AppState: { addEventListener: jest.fn((_event, callback) => {
  jest.requireActual('./support/challengeFirestore').appState.callback = callback;
  return { remove: jest.fn() };
}) } }));
jest.mock('@/features/review/services/reviewPrompt', () => ({ reviewPromptActions: { recordMoment: jest.fn(async () => {}) } }));
jest.mock('@/utils/logger', () => ({ logger: { error: jest.fn() } }));
const login = (id: string) => {
  identity.currentUser = { uid: id };
  testStore.dispatch(patchAuth({ user: { id } as User, isAuthenticated: true, isGuest: false }));
};
const progress = () => selectChallengeProgress(testStore.getState());
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 16, 12));
  identity.currentUser = null;
  testStore.dispatch(patchAuth({ user: null, isAuthenticated: false }));
  challengeActions.resetSession();
  database.clear();
  scenario.beforeRead = null; scenario.beforeCommit = null; scenario.retry = null;
  jest.clearAllMocks();
  seed('A', { xp: 150, challengeProgress: { r1: 2, r3: 2, c1: 1, w3: 1, w2: 2 }, claimedChallenges: ['w3'] });
  seed('B', { xp: 40, challengeProgress: { c2: 1 }, claimedChallenges: ['c3'] });
});
afterEach(() => jest.useRealTimers());

it('profil açılmadan yapılan aksiyon eski ilerlemeyi, XP ve ödülleri korur', async () => {
  login('A');
  await challengeActions.trackAction('A', 'commentsPosted');
  expect(database.get('A')).toMatchObject({ xp: 150, challengeProgress: { r1: 2, c1: 2, w3: 1 }, claimedChallenges: ['w3'] });
  expect(progress()).toMatchObject({ r1: 2, c1: 2, w3: 1 });
});

it('ilk yükleme gecikirken gelen peş peşe aksiyonlar kaybolmaz', async () => {
  login('A');
  const gate = deferred(); scenario.beforeRead = () => gate.promise;
  const load = challengeActions.loadProgress('A');
  const actions = [challengeActions.trackAction('A', 'chaptersRead'), challengeActions.trackAction('A', 'commentsPosted'),
    challengeActions.trackAction('A', 'chaptersRead')];
  gate.resolve(); await Promise.all([load, ...actions]);
  expect(progress()).toMatchObject({ r1: 4, r3: 4, c1: 2, w3: 1 });
  expect(database.get('A')?.challengeProgress).toEqual(progress());
});

it('aynı gün yüklemeleri tek okumada birleşir ve transaction açılmaz', async () => {
  login('A');
  await Promise.all([challengeActions.loadProgress('A'), challengeActions.loadProgress('A')]);
  await challengeActions.loadProgress('A');
  expect(firestoreMock.getDocFromServer).toHaveBeenCalledTimes(1);
  expect(firestoreMock.runTransaction).not.toHaveBeenCalled();
});

it('gün yenilerken ilk okumadan sonra başka cihazın yazdığı veriyi yeniden okur', async () => {
  seed('A', { lastActiveDate: yesterdayKey(), streak: 3 }); login('A');
  scenario.beforeRead = async () => {
    seed('A', { streak: 4, challengeProgress: { w2: 4, c1: 3 } });
  };
  await challengeActions.loadProgress('A');
  expect(firestoreMock.runTransaction).toHaveBeenCalledTimes(1);
  expect(database.get('A')).toMatchObject({ streak: 4, challengeProgress: { c1: 3 } });
  expect(progress()).toMatchObject({ w2: 4, c1: 3 });
});

it('başarısız optimistic artış geri alınır, sınırdaki sonraki aksiyon korunur', async () => {
  seed('A', { challengeProgress: { r1: 4 } }); login('A'); await challengeActions.loadProgress('A');
  const gate = deferred(); scenario.beforeCommit = async () => { await gate.promise; throw Error('bağlantı'); };
  const first = challengeActions.trackAction('A', 'chaptersRead');
  const second = challengeActions.trackAction('A', 'chaptersRead');
  expect(progress().r1).toBe(5);
  gate.resolve(); await Promise.all([first, second]);
  expect(progress().r1).toBe(5);
  expect(database.get('A')?.challengeProgress.r1).toBe(5);
  expect(database.get('A')?.challengeProgress.r3).toBe(1);
});

it('yükleme hatasında boş store sunucu ilerlemesinin üzerine yazılmaz', async () => {
  login('A'); scenario.beforeRead = async () => { throw Error('ağ yok'); };
  await challengeActions.loadProgress('A');
  expect(testStore.getState().challenge.isLoaded).toBe(false);
  await challengeActions.trackAction('A', 'newFollows');
  expect(progress()).toMatchObject({ r1: 2, c1: 1, c2: 1 });
});

it('transaction tekrarında başka cihazın ilerlemesi korunur ve tamamlanma bir kez bildirilir', async () => {
  login('A'); scenario.retry = () => seed('A', { challengeProgress: { r1: 4, c1: 4, custom: 7 } });
  await challengeActions.trackAction('A', 'chaptersRead');
  expect(database.get('A')?.challengeProgress).toMatchObject({ r1: 5, c1: 4, custom: 7 });
  expect(reviewPromptActions.recordMoment).toHaveBeenCalledTimes(1);
});

it('ödül alma güncel hesabı okur, tamamlanmamış görevi reddeder ve çift XP vermez', async () => {
  login('A');
  await challengeActions.claimChallenge('A', 'r1');
  expect(selectChallengeXp(testStore.getState())).toBe(150);
  await Promise.all([challengeActions.claimChallenge('A', 'w3'), challengeActions.claimChallenge('A', 'w3')]);
  expect(database.get('A')?.xp).toBe(150);
  seed('A', { xp: 150, challengeProgress: { c1: 5 } });
  await Promise.all([challengeActions.claimChallenge('A', 'c1'), challengeActions.claimChallenge('A', 'c1')]);
  expect(database.get('A')?.xp).toBe(240);
  expect(selectClaimedChallenges(testStore.getState())).toEqual(['c1']);
});

it('başarısız ödül yazımı XP ve alındı durumunu geri alır', async () => {
  seed('A', { challengeProgress: { c1: 5 } }); login('A'); await challengeActions.loadProgress('A');
  scenario.beforeCommit = async () => { throw Error('ağ yok'); };
  const claim = challengeActions.claimChallenge('A', 'c1');
  expect(selectChallengeXp(testStore.getState())).toBe(90);
  await claim;
  expect(selectChallengeXp(testStore.getState())).toBe(0);
  expect(selectClaimedChallenges(testStore.getState())).toEqual([]);
});

it('A yüklemesi geç dönerken B hesabının verisi karışmaz', async () => {
  login('A'); const gate = deferred(); scenario.beforeRead = () => gate.promise;
  const load = challengeActions.loadProgress('A'); await Promise.resolve();
  challengeActions.resetSession(); login('B'); await challengeActions.loadProgress('B');
  gate.resolve(); await load;
  expect(selectChallengeXp(testStore.getState())).toBe(40);
  expect(selectClaimedChallenges(testStore.getState())).toEqual(['c3']);
  expect(progress().r1).toBeUndefined();
  await challengeActions.trackAction('A', 'commentsPosted');
  expect(database.get('A')?.challengeProgress.c1).toBe(1);
});

it('aynı hesaba yeniden girişte önceki oturumun bekleyen aksiyonları iptal edilir', async () => {
  login('A'); const gate = deferred(); scenario.beforeRead = () => gate.promise;
  const load = challengeActions.loadProgress('A'); await Promise.resolve();
  const action = challengeActions.trackAction('A', 'commentsPosted');
  challengeActions.resetSession(); login('B'); login('A'); await challengeActions.loadProgress('A');
  gate.resolve(); await Promise.all([load, action]);
  expect(progress().c1).toBe(1);
});

it('A yazımı tamamlanırken B açılırsa geç gelen sonuç B arayüzüne uygulanmaz', async () => {
  login('A'); await challengeActions.loadProgress('A');
  const gate = deferred(); const started = deferred();
  scenario.beforeCommit = async () => { started.resolve(); await gate.promise; };
  const action = challengeActions.trackAction('A', 'commentsPosted');
  await started.promise;
  challengeActions.resetSession(); login('B'); await challengeActions.loadProgress('B');
  gate.resolve(); await action;
  expect(database.get('A')?.challengeProgress.c1).toBe(2);
  expect(selectChallengeXp(testStore.getState())).toBe(40);
  expect(progress().c1).toBeUndefined();
});

it('tek aksiyonun kaydı reddedilirse optimistic sayaç önceki değerine döner', async () => {
  login('A'); await challengeActions.loadProgress('A');
  scenario.beforeCommit = async () => { throw Error('izin reddedildi'); };
  const action = challengeActions.trackAction('A', 'commentsPosted');
  expect(progress().c1).toBe(2);
  await action;
  expect(progress().c1).toBe(1);
  expect(database.get('A')?.challengeProgress.c1).toBe(1);
});

it('hafta geçişi aksiyonda yenilenir ve kalıcı görev korunur', async () => {
  seed('A', { challengeWeekStart: '2026-10-05', lastActiveDate: yesterdayKey(), streak: 3,
    challengeProgress: { r1: 5, c1: 5, w3: 1 } }); login('A');
  await challengeActions.trackAction('A', 'commentsPosted');
  expect(database.get('A')).toMatchObject({ streak: 4, lastActiveDate: todayKey(), challengeWeekStart: weekStartKey(),
    challengeProgress: { r1: 0, c1: 1, w3: 1 } });
});

it('oturum aboneliği profili açmadan yükler, dönüşte günü yeniler ve çıkışta temizler', async () => {
  startChallengeSession(); startChallengeSession();
  seed('A', { lastActiveDate: yesterdayKey(), streak: 3 }); login('A');
  await challengeActions.loadProgress('A');
  expect(database.get('A')?.streak).toBe(4);
  jest.setSystemTime(new Date(2026, 9, 17, 12)); appState.callback('active');
  await challengeActions.loadProgress('A');
  expect(database.get('A')?.streak).toBe(5);
  login('B'); await challengeActions.loadProgress('B');
  expect(selectChallengeXp(testStore.getState())).toBe(40);
  testStore.dispatch(patchAuth({ user: null, isAuthenticated: false }));
  expect(testStore.getState().challenge).toMatchObject({ userId: null, isLoaded: false, pending: [] });
  expect(selectChallengeXp(testStore.getState())).toBe(0);
});
