import { FieldValue } from 'firebase-admin/firestore';
import { sendExpoPush } from './expoPush.js';
import { CATEGORY_FIELD } from './pushRepository.js';

export function createPushHandlers(db, repository) {
  return {
    async notification(document) {
      const notification = document.data();
      if (!notification?.userId || notification.pushSent) return;
      if (await repository.blocked(notification.userId, notification.senderId)) return;
      const settings = await repository.settings(notification.userId);
      const category = CATEGORY_FIELD[notification.type];
      if (!settings.pushNotifications || (category && settings[category] === false)) return;
      const token = await repository.token(notification.userId);
      if (!token) return;
      await sendExpoPush(token, notification.title || 'Bluma', notification.message || '', notification.data || {});
    },
    async message(document) {
      const message = document.data();
      const thread = document.ref.parent.parent;
      if (!thread || !message?.senderId) return;
      const participants = (await thread.get()).data()?.participants || [];
      const recipientId = participants.find(participant => participant !== message.senderId);
      if (!recipientId || await repository.blocked(recipientId, message.senderId)) return;
      const settings = await repository.settings(recipientId);
      if (!settings.pushNotifications) return;
      const token = await repository.token(recipientId);
      if (!token) return;
      const sender = await db.collection('users').doc(message.senderId).get();
      const senderName = sender.data()?.displayName || sender.data()?.username || 'Yeni mesaj';
      const body = message.text || (message.image ? '📷 Fotoğraf gönderdi' : 'Yeni mesaj gönderdi');
      const delivered = await sendExpoPush(token, senderName, body, { type: 'message', senderId: message.senderId });
      if (delivered) {
        await thread.set({ lastDelivered: { [recipientId]: FieldValue.serverTimestamp() } }, { merge: true })
          .catch(error => console.error('[messages] teslim filigranı yazılamadı:', error.message));
      }
    },
  };
}
