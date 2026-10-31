import { notificationActions } from '@/store/notificationStore';
import { logger } from '@/utils/logger';
import { collection, getDocs, getFirestore, limit, query, where } from '@react-native-firebase/firestore';

/** Yorum başına en fazla bu kadar kişi bildirilir (bildirim spam'ine karşı). */
const MAX_MENTIONS = 3;
/** Metindeki tekil `@kullanıcıadı`ları sırayla verir (e-posta adresleri hariç). */
export function extractMentions(text: string): string[] {
  // Kullanıcı adları onboarding'de [a-z0-9_] olarak normalize edilir. Her
  // çağrıda yeni ifade: global ifadenin `lastIndex` durumu paylaşılmasın.
  const pattern = /(?:^|[^a-z0-9_@])@([a-z0-9_]{2,30})/gi;
  const names: string[] = [];
  for (let match = pattern.exec(text); match && names.length < MAX_MENTIONS; match = pattern.exec(text)) {
    const name = match[1].toLowerCase();
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

async function userIdByUsername(username: string): Promise<string | null> {
  const snapshot = await getDocs(
    query(collection(getFirestore(), 'users'), where('username', '==', username), limit(1)),
  );
  return snapshot.empty ? null : snapshot.docs[0].id;
}

type MentionParams = {
  content: string;
  senderId: string;
  senderName: string;
  storyId: string;
  storyTitle: string;
  commentId: string;
  /** Zaten "yorum" bildirimi alan kişi (hikâye yazarı ya da yanıtlanan). */
  alreadyNotifiedId?: string;
};

/**
 * Yorumdaki anmalar için bildirim. Alıcı tarafı (çeviri, yönlendirme,
 * ayar anahtarı) hazırdı ama bildirimi üreten kod yoktu. Kendini anmak ve
 * aynı kişiye ikinci bildirim atlanır; engellenen kullanıcının yazımını
 * güvenlik kuralı reddeder.
 */
export async function notifyMentions(params: MentionParams) {
  const usernames = extractMentions(params.content);
  if (!usernames.length) return;
  const ids = await Promise.all(usernames.map(name => userIdByUsername(name).catch(() => null)));
  const recipients = [...new Set(ids)].filter((id): id is string =>
    !!id && id !== params.senderId && id !== params.alreadyNotifiedId);
  for (const recipientId of recipients) {
    void notificationActions.createMentionNotification(
      params.senderId, recipientId, params.senderName, params.storyTitle, params.storyId, params.commentId,
    ).catch(error => logger.debug('Anma bildirimi gönderilemedi:', error));
  }
}
