const DEFAULT_SETTINGS = {
  followNotifications: true,
  likeNotifications: true,
  commentNotifications: true,
  mentionNotifications: true,
  storyNotifications: true,
  pushNotifications: true,
};

export const CATEGORY_FIELD = {
  follow: 'followNotifications',
  follow_request: 'followNotifications',
  follow_accepted: 'followNotifications',
  like: 'likeNotifications',
  comment: 'commentNotifications',
  story_published: 'storyNotifications',
  new_chapter: 'storyNotifications',
  conversation_announcement: 'storyNotifications',
};

export function createPushRepository(db) {
  return {
    async settings(userId) {
      try {
        const snapshot = await db.collection('notificationSettings').doc(userId).get();
        return snapshot.exists ? { ...DEFAULT_SETTINGS, ...snapshot.data() } : DEFAULT_SETTINGS;
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
    async token(userId) {
      try {
        const snapshot = await db.collection('userPushTokens').doc(userId).get();
        return snapshot.exists ? snapshot.data()?.expoPushToken || null : null;
      } catch {
        return null;
      }
    },
    async blocked(ownerId, senderId) {
      if (!ownerId || !senderId || ownerId === senderId) return false;
      try {
        return (await db.collection('users').doc(ownerId).collection('blocked').doc(senderId).get()).exists;
      } catch {
        return false;
      }
    },
  };
}
