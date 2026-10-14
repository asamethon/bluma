/** Aynı bölümde Firestore'a en fazla bu aralıkla yazılır. */
export const SYNC_INTERVAL_MS = 60 * 1000;

export type LastSync = { chapterIndex: number; at: number };
export type SyncDecision = { writeNow: boolean; delayMs: number; chapterChanged: boolean };

/**
 * İlerleme kaydı Firestore'a ne zaman gitmeli? Bölüm değiştiyse ya da son
 * yazımdan bu yana aralık dolduysa hemen; değilse aralığın kalanı kadar sonra
 * (son konum kaybolmasın diye bekleyen tek yazım).
 */
export function decideSync(previous: LastSync | undefined, chapterIndex: number, now: number): SyncDecision {
  const chapterChanged = !previous || previous.chapterIndex !== chapterIndex;
  const elapsed = previous ? now - previous.at : SYNC_INTERVAL_MS;
  const writeNow = chapterChanged || elapsed >= SYNC_INTERVAL_MS;
  return { writeNow, delayMs: writeNow ? 0 : SYNC_INTERVAL_MS - elapsed, chapterChanged };
}
