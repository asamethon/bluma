import { saveDraft, publishDraft } from '@/features/story/services/chapterDraft';
import { loadChapterDraft } from '@/features/story/services/chapterDraftStorage';
import { getChapter, loadAllChapters } from '@/features/story/services/chapters';
import { notificationActions } from '@/store/notificationStore';
import { publishSideEffects } from '@/features/story/services/storyMutations';
import { openStory } from '@/features/story/services/storyDraft';
import { storyActions } from '@/store/storyStore';
import { documents, resetChapterDatabase, scenario } from './support/chapterFirestore';

jest.mock('@react-native-firebase/firestore', () => jest.requireActual('./support/chapterFirestore').firestoreMock);
jest.mock('@/store', () => ({ store: jest.requireActual('./support/chapterFirestore').testStore }));
jest.mock('@/features/auth/services/emailVerification', () => ({ assertEmailVerified: async () => ({ ok: true }) }));
jest.mock('@/store/notificationStore', () => ({ notificationActions: { announceStoryToFollowers: jest.fn() } }));
jest.mock('@/features/story/services/storyMutations', () => ({ publishSideEffects: jest.fn() }));
jest.mock('@/store/storyStore', () => ({ storyActions: { getStoryById: jest.fn(), loadAllChapters: jest.fn() } }));
jest.mock('@/features/story/services/storyCache', () => ({ forgetStory: jest.fn() }));
jest.mock('@/features/story/services/listeners/storyFeedListeners', () => ({ applyStoryChange: jest.fn() }));
jest.mock('@/utils/logger', () => ({ logger: { error: jest.fn() } }));

const first = { id: 'one', title: 'İlk bölüm', content: 'Yayındaki metin' };
const second = { id: 'two', title: 'İkinci bölüm', content: 'Yeni bölüm metni' };
beforeEach(() => { jest.clearAllMocks(); resetChapterDatabase(); });

it('yazarın özel taslağı kaydolurken okuyucu gövdesi ve üstveri değişmez', async () => {
  await publishDraft('story', [first]);
  jest.clearAllMocks();
  const before = { ...documents.get('stories/story') };
  const draft = [{ ...first, title: 'Yeni başlık', content: 'Henüz yayımlanmayan metin' }, second];
  await saveDraft('story', draft);
  expect(await loadChapterDraft('story')).toEqual(draft);
  expect(await loadAllChapters('story')).toEqual([first]);
  expect((await getChapter('story', 0))?.content).toBe(first.content);
  expect(await getChapter('story', 1)).toBeNull();
  expect(documents.get('stories/story')).toEqual(before);
  expect(notificationActions.announceStoryToFollowers).not.toHaveBeenCalled();
  expect(publishSideEffects).not.toHaveBeenCalled();
});

it('ilk yayın gövdeyi ve üstveriyi kaydeder, sayaç ve duyuru bir kez çalışır', async () => {
  scenario.retryTransaction = true;
  expect((await publishDraft('story', [first])).success).toBe(true);
  expect(documents.get('stories/story')).toMatchObject({
    isPublished: true, chaptersCount: 1, chapterTitles: [first.title], chapterWordCounts: [2], lastNotifiedChapterCount: 1,
  });
  expect(documents.get('users/writer')?.storiesCount).toBe(1);
  expect(publishSideEffects).toHaveBeenCalledTimes(1);
  expect((await publishDraft('story', [first])).success).toBe(true);
  expect(documents.get('users/writer')?.storiesCount).toBe(1);
  expect(publishSideEffects).toHaveBeenCalledTimes(1);
  expect(notificationActions.announceStoryToFollowers).not.toHaveBeenCalled();
});

it('yayından kaldırılıp yeniden yayınlanan hikâye takipçilere ikinci kez duyurulmaz', async () => {
  await publishDraft('story', [first]);
  expect(publishSideEffects).toHaveBeenLastCalledWith(expect.anything(), 'story', 'Test hikâyesi', true);
  // Yayından kaldırma (updateStory) duyuru kaydını silmez, sayacı geri alır.
  documents.set('stories/story', { ...documents.get('stories/story'), isPublished: false });
  documents.set('users/writer', { ...documents.get('users/writer'), storiesCount: 0 });
  expect((await publishDraft('story', [first])).success).toBe(true);
  expect(publishSideEffects).toHaveBeenLastCalledWith(expect.anything(), 'story', 'Test hikâyesi', false);
  expect(documents.get('users/writer')?.storiesCount).toBe(1);
});

it('yeni bölüm duyurusu yalnızca başarılı açık yayından sonra bir kez gönderilir', async () => {
  await publishDraft('story', [first]);
  await saveDraft('story', [first, second]);
  expect(notificationActions.announceStoryToFollowers).not.toHaveBeenCalled();
  await publishDraft('story', [first, second]);
  expect(notificationActions.announceStoryToFollowers).toHaveBeenCalledWith('writer', 'Yazar', 'story', 'Test hikâyesi', 'new_chapter', 2);
  await publishDraft('story', [{ ...first, content: 'Düzeltilmiş metin' }, second]);
  expect(notificationActions.announceStoryToFollowers).toHaveBeenCalledTimes(1);
});

it('silinen bölümü yeniden eklemek duyuruyu tekrarlamaz ve bölüm beğenisi korunur', async () => {
  await publishDraft('story', [first, second]);
  documents.set('stories/story/chapters/0', { ...documents.get('stories/story/chapters/0'), likesCount: 7 });
  await publishDraft('story', [first]);
  expect(await getChapter('story', 1)).toBeNull();
  await publishDraft('story', [first, second]);
  expect((await getChapter('story', 0))?.likesCount).toBe(7);
  expect(notificationActions.announceStoryToFollowers).not.toHaveBeenCalled();
});

it('boş bölüm yayınlanmaz; metin özel taslakta kalır', async () => {
  await publishDraft('story', [first]);
  const draft = [first, { ...second, content: '  \n' }];
  expect((await publishDraft('story', draft)).success).toBe(false);
  expect(await loadChapterDraft('story')).toEqual(draft);
  expect(await loadAllChapters('story')).toEqual([first]);
  expect(notificationActions.announceStoryToFollowers).not.toHaveBeenCalled();
});

it('başarısız yayında okuyucu eski sürümü görür; son metin taslaktan kurtarılır', async () => {
  await publishDraft('story', [first]);
  const before = { ...documents.get('stories/story') };
  scenario.failPublication = true;
  expect((await publishDraft('story', [first, second])).success).toBe(false);
  expect(await loadChapterDraft('story')).toEqual([first, second]);
  expect(await loadAllChapters('story')).toEqual([first]);
  expect(documents.get('stories/story')).toEqual(before);
  expect(notificationActions.announceStoryToFollowers).not.toHaveBeenCalled();
});

it('editör yeniden açıldığında özel taslağı yükler; yayınlanmış sürümü ayrı tutar', async () => {
  await publishDraft('story', [first]);
  await saveDraft('story', [first, second]);
  jest.mocked(storyActions.getStoryById).mockResolvedValue({ id: 'story', ...documents.get('stories/story') } as any);
  jest.mocked(storyActions.loadAllChapters).mockResolvedValue([first]);
  const opened = await openStory('story', '1');
  expect(opened).toMatchObject({ chapters: [first, second], publishedChapters: [first], index: 1 });
});
