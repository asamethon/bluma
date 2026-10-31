import { saveDraft } from '@/features/story/services/chapterDraft';
import { createDraftAutosave } from '@/features/story/services/draftAutosave';
import { queueChapterWrite, waitForChapterWrites } from '@/features/story/services/chapterWriteQueue';

jest.mock('@/features/story/services/chapterDraft', () => ({ saveDraft: jest.fn() }));
jest.mock('@/utils/logger', () => ({ logger: { warn: jest.fn() } }));

const first = [{ id: '1', title: 'Bölüm', content: 'İlk metin' }];
const latest = [{ ...first[0], content: 'En son metin' }];
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function deferred() {
  const callbacks = { resolve: () => {}, reject: (_error: Error) => {} };
  const promise = new Promise<void>((resolve, reject) => { callbacks.resolve = resolve; callbacks.reject = reject; });
  return { promise, ...callbacks };
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.mocked(saveDraft).mockResolvedValue(undefined);
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

it('hızlı yazımları tek kayıtta birleştirir', async () => {
  const onState = jest.fn();
  const autosave = createDraftAutosave('story', onState);
  autosave.schedule(first);
  jest.advanceTimersByTime(500);
  autosave.schedule(latest);
  jest.advanceTimersByTime(799);
  expect(saveDraft).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  await flush();
  expect(saveDraft).toHaveBeenCalledTimes(1);
  expect(saveDraft).toHaveBeenCalledWith('story', latest);
  expect(onState).toHaveBeenLastCalledWith('saved');
});

it('800 ms dolmadan çıkıldığında da son metni kaydeder', async () => {
  const onState = jest.fn();
  const autosave = createDraftAutosave('story', onState);
  autosave.schedule(latest);
  autosave.dispose();
  onState.mockClear();
  await flush();
  expect(saveDraft).toHaveBeenCalledWith('story', latest);
  expect(onState).not.toHaveBeenCalled();
});

it('kayıt hatası görünür olur ve aynı metin tekrar denenebilir', async () => {
  jest.mocked(saveDraft).mockRejectedValueOnce(new Error('Bağlantı yok'));
  const onState = jest.fn();
  const autosave = createDraftAutosave('story', onState);
  autosave.saveNow(latest);
  await flush();
  expect(onState).toHaveBeenLastCalledWith('error');
  autosave.retry();
  await flush();
  expect(saveDraft).toHaveBeenNthCalledWith(2, 'story', latest);
  expect(onState).toHaveBeenLastCalledWith('saved');
});

it('eski bir kaydın hatası yeni metni veya kayıt durumunu geri almaz', async () => {
  const old = deferred();
  const next = deferred();
  jest.mocked(saveDraft).mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  const onState = jest.fn();
  const autosave = createDraftAutosave('story', onState);
  autosave.saveNow(first);
  autosave.saveNow(latest);
  old.reject(new Error('Eski kayıt reddedildi'));
  await flush();
  expect(onState).toHaveBeenLastCalledWith('saving');
  next.resolve();
  await flush();
  expect(onState).toHaveBeenLastCalledWith('saved');
  autosave.retry();
  autosave.dispose();
  expect(saveDraft).toHaveBeenCalledTimes(2);
});

it('yaşam döngüsü yeniden bağlandığında kayıt rozeti çalışmaya devam eder', async () => {
  const onState = jest.fn();
  const autosave = createDraftAutosave('story', onState);
  autosave.dispose();
  autosave.start();
  autosave.schedule(first);
  jest.advanceTimersByTime(800);
  await flush();
  expect(onState).toHaveBeenLastCalledWith('saved');
});

it('aynı hikâyenin yazımları sıralıdır; başarısız kayıt yayını engellemez', async () => {
  const saving = deferred();
  const events: string[] = [];
  const old = queueChapterWrite('queue-story', () => { events.push('save'); return saving.promise; });
  const publication = queueChapterWrite('queue-story', async () => { events.push('publish'); });
  const reopening = waitForChapterWrites('queue-story').then(() => { events.push('open'); });
  await flush();
  expect(events).toEqual(['save']);
  const failure = expect(old).rejects.toThrow('Hata');
  saving.reject(new Error('Hata'));
  await failure;
  await publication;
  await reopening;
  expect(events).toEqual(['save', 'publish', 'open']);
});
