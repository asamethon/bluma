/** Bir hikâyenin okuma ilerlemesi (yerelde ve Firestore'da aynı şema). */
export interface ReadingProgress {
  storyId: string;
  chapterIndex: number;
  scrollRatio: number;
  updatedAt: number;
}

export const localKey = (userId: string, storyId: string) =>
  `readingProgress:${userId}:${storyId}`;
