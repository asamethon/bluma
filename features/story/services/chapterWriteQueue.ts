const writes = new Map<string, Promise<unknown>>();

export async function waitForChapterWrites(storyId: string) {
  await writes.get(storyId)?.catch(() => undefined);
}

/** Aynı hikâyede eski autosave yeni kaydın/yayının üzerine gelemez. */
export function queueChapterWrite<T>(storyId: string, operation: () => Promise<T>): Promise<T> {
  const previous = writes.get(storyId) ?? Promise.resolve();
  const request = previous.catch(() => undefined).then(operation);
  writes.set(storyId, request);
  void request.finally(() => {
    if (writes.get(storyId) === request) writes.delete(storyId);
  }).catch(() => {});
  return request;
}
