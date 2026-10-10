type AnimationTarget = { play: () => Promise<void>; cancel: () => void };
const targets = new Map<string, AnimationTarget>();
const keyFor = (threadId: string, messageId: string) => `${threadId}/${messageId}`;

/** Sanallaştırılan satırlar yalnızca ekrandayken bir animasyon tutamacı kaydeder. */
export function registerRemovalAnimation(threadId: string, messageId: string, target: AnimationTarget) {
  const key = keyFor(threadId, messageId);
  targets.get(key)?.cancel();
  targets.set(key, target);
  return () => {
    target.cancel();
    if (targets.get(key) === target) targets.delete(key);
  };
}
export const playRemovalAnimation = (threadId: string, messageId: string) =>
  targets.get(keyFor(threadId, messageId))?.play() ?? Promise.resolve();
export const cancelRemovalAnimation = (threadId: string, messageId: string) =>
  targets.get(keyFor(threadId, messageId))?.cancel();
